const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config(); // Ensure we load environment variables

const sslEnv = process.env.DB_SSL;
const sslConfig = sslEnv === "true"
  ? { rejectUnauthorized: false }
  : sslEnv === "no-verify"
    ? { rejectUnauthorized: false }
    : false;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: sslConfig,
});

const MIGRATIONS_TABLE = 'schema_migrations';

function getArgs() {
  const args = process.argv.slice(2);
  return {
    baselineExisting: args.includes('--baseline-existing'),
    continueOnError: args.includes('--continue-on-error')
  };
}

function checksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(client) {
  const res = await client.query(`SELECT filename, checksum FROM ${MIGRATIONS_TABLE}`);
  return new Map(res.rows.map((r) => [r.filename, r.checksum]));
}

async function markApplied(client, filename, fileChecksum) {
  await client.query(
    `INSERT INTO ${MIGRATIONS_TABLE} (filename, checksum) VALUES ($1, $2)
     ON CONFLICT (filename) DO UPDATE SET checksum = EXCLUDED.checksum, applied_at = NOW()`,
    [filename, fileChecksum]
  );
}

async function runMigrations() {
  const { baselineExisting, continueOnError } = getArgs();
  const migrationsDir = path.join(__dirname, 'migrations');
  console.log(`Checking for migrations in: ${migrationsDir}`);
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found.');
    process.exit(0);
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  
  if (files.length === 0) {
    console.log('No SQL migration files found.');
    process.exit(0);
  }

  console.log(`Found ${files.length} migration files.`);
  
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    if (baselineExisting) {
      console.log('Baseline mode: marking all existing migration files as applied...');
      for (const file of files) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');
        await markApplied(client, file, checksum(sql));
      }
      console.log('✅ Baseline completed. No SQL executed.');
      console.log('\nMigration script finished.');
      process.exit(0);
    }

    console.log('Executing pending migrations...');

    let executedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      const fileChecksum = checksum(sql);

      if (applied.has(file)) {
        if (applied.get(file) !== fileChecksum) {
          console.log(`\n⚠️ Skipping changed migration already applied: ${file}`);
        } else {
          console.log(`\n⏭️ Already applied: ${file}`);
        }
        skippedCount += 1;
        continue;
      }

      console.log(`\n⏳ Running: ${file}...`);
      
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await markApplied(client, file, fileChecksum);
        await client.query('COMMIT');
        console.log(`✅ Success: ${file}`);
        executedCount += 1;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed: ${file}`);
        console.error(err.message);

        if (continueOnError) {
          console.log('↪️ Continuing due to --continue-on-error');
          continue;
        }

        console.log('Stopping migrations due to error.');
        console.log('Tip: if legacy files are already applied manually, run once with --baseline-existing');
        process.exitCode = 1;
        break;
      }
    }

    console.log(`\nSummary: executed=${executedCount}, skipped=${skippedCount}`);
  } finally {
    client.release();
    await pool.end();
  }

  console.log('\nMigration script finished.');
  process.exit(process.exitCode || 0);
}

runMigrations().catch(err => {
  console.error("Migration fatal error:", err);
  process.exit(1);
});
