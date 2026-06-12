import pool from './pool.js';
import { formatDatabaseError } from './errorMessage.js';

export async function migrateDatabase() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      login TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      nickname TEXT NOT NULL,
      emoji TEXT NOT NULL,
      avatar_url TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      tests_completed INTEGER NOT NULL DEFAULT 0 CHECK (tests_completed >= 0),
      best_accuracy INTEGER NOT NULL DEFAULT 0 CHECK (best_accuracy >= 0 AND best_accuracy <= 100),
      best_wpm INTEGER NOT NULL DEFAULT 0 CHECK (best_wpm >= 0),
      points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
      task_state JSONB NOT NULL DEFAULT '{}'::jsonb,
      task_completions JSONB NOT NULL DEFAULT '[]'::jsonb,
      last_result JSONB
    )
  `);

  await migrateUserIdsToText();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    )
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS idx_users_emoji ON users (emoji)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at)');
}

async function migrateUserIdsToText() {
  const { rows } = await pool.query(`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'id'
    LIMIT 1
  `);

  if (rows[0]?.data_type !== 'uuid') {
    return;
  }

  await pool.query('DROP TABLE IF EXISTS sessions');
  await pool.query('ALTER TABLE users ALTER COLUMN id DROP DEFAULT');
  await pool.query('ALTER TABLE users ALTER COLUMN id TYPE TEXT USING id::text');
  await pool.query("ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid()::text");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrateDatabase()
    .then(async () => {
      console.log('Database migration completed.');
      await pool.end();
    })
    .catch(async (error) => {
      console.error('Database migration failed:\n%s', formatDatabaseError(error));
      await pool.end();
      process.exitCode = 1;
    });
}

export default migrateDatabase;
