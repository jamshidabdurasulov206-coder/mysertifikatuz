const pool = require("./src/config/db");
async function migrate() {
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS father_name TEXT;");
    console.log("Column father_name added successfully");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err.message);
    process.exit(1);
  }
}
migrate();
