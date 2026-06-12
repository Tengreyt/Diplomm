import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

function buildSslConfig() {
  if (process.env.DB_SSL === 'true') {
    return { rejectUnauthorized: false };
  }

  return undefined;
}

export function requireDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Set it in backend/.env or deployment environment.');
  }

  return process.env.DATABASE_URL;
}

export const pool = new Pool({
  connectionString: requireDatabaseUrl(),
  ssl: buildSslConfig()
});

export async function closePool() {
  await pool.end();
}

export default pool;
