import pool from '../db/pool.js';

const defaultSessionDays = Number(process.env.SESSION_TTL_DAYS ?? 30);

function getExpiresAt() {
  const date = new Date();
  date.setDate(date.getDate() + defaultSessionDays);
  return date;
}

export async function createSessionRecord({ tokenHash, userId }) {
  const expiresAt = getExpiresAt();

  await pool.query(
    `
      INSERT INTO sessions (token_hash, user_id, expires_at)
      VALUES ($1, $2, $3)
    `,
    [tokenHash, userId, expiresAt]
  );

  return {
    tokenHash,
    userId,
    expiresAt: expiresAt.toISOString()
  };
}

export async function findSessionByTokenHash(tokenHash) {
  const { rows } = await pool.query(
    `
      SELECT token_hash, user_id, created_at, expires_at
      FROM sessions
      WHERE token_hash = $1 AND expires_at > NOW()
      LIMIT 1
    `,
    [tokenHash]
  );

  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    tokenHash: row.token_hash,
    userId: row.user_id,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    expiresAt: row.expires_at instanceof Date ? row.expires_at.toISOString() : row.expires_at
  };
}

export async function deleteSession(tokenHash) {
  await pool.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
}

export async function deleteExpiredSessions() {
  await pool.query('DELETE FROM sessions WHERE expires_at <= NOW()');
}

export default {
  createSessionRecord,
  findSessionByTokenHash,
  deleteSession,
  deleteExpiredSessions
};
