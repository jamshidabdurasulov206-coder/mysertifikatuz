const { Pool } = require("pg");
require("dotenv").config();

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

// faqat test query
pool.query("SELECT 1")
  .then(() => console.log("PostgreSQL connected"))
  .catch(err => console.error(err));

module.exports = pool;