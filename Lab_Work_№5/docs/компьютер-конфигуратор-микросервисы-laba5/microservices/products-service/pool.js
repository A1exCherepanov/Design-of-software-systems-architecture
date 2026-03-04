import * as pg from "pg";
const { Pool } = pg.default;

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "electronics_db",
  password: process.env.DB_PASSWORD || "580414",
  port: process.env.DB_PORT || 5432,
});

export default pool;
