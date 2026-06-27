import pool from '../db/pool.js';

function normalizeAttempt(row) {
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    lessonId: row.lesson_id,
    lessonText: row.lesson_text,
    difficulty: row.difficulty,
    source: row.source,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    startedAt: row.started_at instanceof Date ? row.started_at.toISOString() : row.started_at,
    completedAt: row.completed_at instanceof Date ? row.completed_at.toISOString() : row.completed_at
  };
}

function normalizeResult(row) {
  if (!row) return null;

  return {
    id: row.id,
    attemptId: row.attempt_id,
    lessonId: row.lesson_id,
    difficulty: row.difficulty,
    source: row.source,
    wpm: Number(row.wpm),
    accuracy: Number(row.accuracy),
    errors: Number(row.errors),
    seconds: Number(row.seconds),
    correctChars: Number(row.correct_chars),
    totalChars: Number(row.total_chars),
    analysis: row.analysis ?? {},
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  };
}

function normalizeResultDetails(row) {
  const result = normalizeResult(row);
  if (!result) return null;

  return {
    ...result,
    lessonText: row.lesson_text,
    startedAt: row.started_at instanceof Date ? row.started_at.toISOString() : row.started_at,
    completedAt: row.completed_at instanceof Date ? row.completed_at.toISOString() : row.completed_at
  };
}

function normalizeResultSummary(row) {
  const { analysis: _analysis, ...result } = normalizeResult(row);
  return result;
}

export async function createAttempt({ userId, lessonId, lessonText, difficulty, source }) {
  const { rows } = await pool.query(
    `
      INSERT INTO training_attempts (user_id, lesson_id, lesson_text, difficulty, source)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [userId, lessonId, lessonText, difficulty, source]
  );

  return normalizeAttempt(rows[0]);
}

export async function findLatestAttempt(userId) {
  const { rows } = await pool.query(
    `
      SELECT *
      FROM training_attempts
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [userId]
  );

  return normalizeAttempt(rows[0]);
}

export async function startAttempt({ attemptId, userId }) {
  const { rows } = await pool.query(
    `
      UPDATE training_attempts
      SET started_at = COALESCE(started_at, NOW())
      WHERE id = $1 AND user_id = $2 AND completed_at IS NULL
      RETURNING *
    `,
    [attemptId, userId]
  );

  return normalizeAttempt(rows[0]);
}

export async function findAttemptForUpdate(client, { attemptId, userId }) {
  const { rows } = await client.query(
    `
      SELECT *
      FROM training_attempts
      WHERE id = $1 AND user_id = $2
      FOR UPDATE
    `,
    [attemptId, userId]
  );

  return normalizeAttempt(rows[0]);
}

export async function finishAttemptWithClient(client, attemptId) {
  await client.query(
    'UPDATE training_attempts SET completed_at = NOW() WHERE id = $1',
    [attemptId]
  );
}

export async function createResultWithClient(client, result) {
  const { rows } = await client.query(
    `
      INSERT INTO training_results (
        attempt_id,
        user_id,
        lesson_id,
        difficulty,
        source,
        wpm,
        accuracy,
        errors,
        seconds,
        correct_chars,
        total_chars,
        analysis
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
      RETURNING *
    `,
    [
      result.attemptId,
      result.userId,
      result.lessonId,
      result.difficulty,
      result.source,
      result.wpm,
      result.accuracy,
      result.errors,
      result.seconds,
      result.correctChars,
      result.totalChars,
      JSON.stringify(result.analysis ?? {})
    ]
  );

  return normalizeResult(rows[0]);
}

export async function listUserResults(userId, limit = 100) {
  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 100));
  const { rows } = await pool.query(
    `
      SELECT *
      FROM training_results
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `,
    [userId, safeLimit]
  );

  return rows.map(normalizeResult);
}

export async function getUserKeyboardHeatmap(userId) {
  const { rows } = await pool.query(
    `
      SELECT
        LOWER(entry->>'value') AS key,
        SUM(GREATEST(0, COALESCE((entry->>'count')::integer, 0)))::integer AS errors
      FROM training_results result
      JOIN users user_account ON user_account.id = result.user_id
      CROSS JOIN LATERAL jsonb_array_elements(
        COALESCE(result.analysis->'missedChars', '[]'::jsonb)
      ) AS entry
      WHERE result.user_id = $1
        AND (
          user_account.keyboard_heatmap_reset_at IS NULL
          OR result.created_at > user_account.keyboard_heatmap_reset_at
        )
        AND CHAR_LENGTH(entry->>'value') = 1
      GROUP BY LOWER(entry->>'value')
    `,
    [userId]
  );

  return Object.fromEntries(
    rows
      .filter((row) => row.key && Number(row.errors) > 0)
      .map((row) => [row.key, Number(row.errors)])
  );
}

export async function listUserResultsPage(userId, { limit = 20, cursor = null } = {}) {
  const safeLimit = Math.max(1, Math.min(50, Number(limit) || 20));
  const values = [userId, safeLimit + 1];
  let cursorClause = '';

  if (cursor?.createdAt && cursor?.id) {
    values.push(cursor.createdAt, cursor.id);
    cursorClause = 'AND (created_at, id) < ($3::timestamptz, $4::text)';
  }

  const { rows } = await pool.query(
    `
      SELECT *
      FROM training_results
      WHERE user_id = $1
      ${cursorClause}
      ORDER BY created_at DESC, id DESC
      LIMIT $2
    `,
    values
  );

  const hasMore = rows.length > safeLimit;
  const items = rows.slice(0, safeLimit).map(normalizeResultSummary);
  return { items, hasMore };
}

export async function findUserResultDetails(userId, resultId) {
  const { rows } = await pool.query(
    `
      SELECT result.*, attempt.lesson_text, attempt.started_at, attempt.completed_at
      FROM training_results result
      JOIN training_attempts attempt ON attempt.id = result.attempt_id
      WHERE result.id = $1 AND result.user_id = $2
      LIMIT 1
    `,
    [resultId, userId]
  );

  return normalizeResultDetails(rows[0]);
}

export async function deleteStaleAttempts() {
  await pool.query(`
    DELETE FROM training_attempts
    WHERE completed_at IS NULL
      AND created_at < NOW() - INTERVAL '24 hours'
  `);
}

export default {
  createAttempt,
  findLatestAttempt,
  startAttempt,
  findAttemptForUpdate,
  finishAttemptWithClient,
  createResultWithClient,
  listUserResults,
  getUserKeyboardHeatmap,
  listUserResultsPage,
  findUserResultDetails,
  deleteStaleAttempts
};
