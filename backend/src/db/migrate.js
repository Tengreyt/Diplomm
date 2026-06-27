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

  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS keyboard_heatmap_reset_at TIMESTAMPTZ');

  await migrateUserIdsToText();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS training_attempts (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id TEXT NOT NULL,
      lesson_text TEXT NOT NULL,
      difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
      source TEXT NOT NULL DEFAULT 'catalog' CHECK (source IN ('catalog', 'adaptive', 'coach')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS training_results (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      attempt_id TEXT NOT NULL UNIQUE REFERENCES training_attempts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id TEXT NOT NULL,
      difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
      source TEXT NOT NULL CHECK (source IN ('catalog', 'adaptive', 'coach')),
      wpm INTEGER NOT NULL CHECK (wpm >= 0),
      accuracy INTEGER NOT NULL CHECK (accuracy >= 0 AND accuracy <= 100),
      errors INTEGER NOT NULL CHECK (errors >= 0),
      seconds INTEGER NOT NULL CHECK (seconds > 0),
      correct_chars INTEGER NOT NULL CHECK (correct_chars >= 0),
      total_chars INTEGER NOT NULL CHECK (total_chars > 0),
      analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS idx_users_emoji ON users (emoji)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_attempts_user_created ON training_attempts (user_id, created_at DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_results_user_created ON training_results (user_id, created_at DESC)');
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
