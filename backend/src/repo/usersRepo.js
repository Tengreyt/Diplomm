import pool from '../db/pool.js';

function normalizeUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    login: row.login,
    passwordHash: row.password_hash,
    nickname: row.nickname,
    emoji: row.emoji,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    stats: {
      testsCompleted: Number(row.tests_completed ?? 0),
      bestAccuracy: Number(row.best_accuracy ?? 0),
      bestWpm: Number(row.best_wpm ?? 0),
      points: Number(row.points ?? 0)
    },
    taskState: row.task_state ?? {},
    taskCompletions: row.task_completions ?? [],
    lastResult: row.last_result ?? null
  };
}

export async function listUsers() {
  const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at ASC');
  return rows.map(normalizeUser);
}

export async function findUserById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  return normalizeUser(rows[0]);
}

export async function findUserByLogin(login) {
  const { rows } = await pool.query('SELECT * FROM users WHERE login = $1 LIMIT 1', [login]);
  return normalizeUser(rows[0]);
}

export async function createUser(user) {
  const stats = user.stats ?? {};

  const { rows } = await pool.query(
    `
      INSERT INTO users (
        id,
        login,
        password_hash,
        nickname,
        emoji,
        avatar_url,
        created_at,
        tests_completed,
        best_accuracy,
        best_wpm,
        points,
        task_state,
        task_completions,
        last_result
      )
      VALUES (
        COALESCE(NULLIF($1, ''), gen_random_uuid()::text),
        $2,
        $3,
        $4,
        $5,
        $6,
        COALESCE($7::timestamptz, NOW()),
        $8,
        $9,
        $10,
        $11,
        $12::jsonb,
        $13::jsonb,
        $14::jsonb
      )
      RETURNING *
    `,
    [
      user.id ?? null,
      user.login,
      user.passwordHash,
      user.nickname,
      user.emoji,
      user.avatarUrl,
      user.createdAt ?? null,
      Number(stats.testsCompleted ?? 0),
      Number(stats.bestAccuracy ?? 0),
      Number(stats.bestWpm ?? 0),
      Number(stats.points ?? 0),
      JSON.stringify(user.taskState ?? {}),
      JSON.stringify(user.taskCompletions ?? []),
      user.lastResult ? JSON.stringify(user.lastResult) : null
    ]
  );

  return normalizeUser(rows[0]);
}

export async function updatePasswordHash(userId, passwordHash) {
  await pool.query('UPDATE users SET password_hash = $2 WHERE id = $1', [userId, passwordHash]);
}

export async function updateProfile(userId, { nickname, avatarUrl, passwordHash = null }) {
  const { rows } = await pool.query(
    `
      UPDATE users
      SET
        nickname = $2,
        avatar_url = $3,
        password_hash = COALESCE($4, password_hash)
      WHERE id = $1
      RETURNING *
    `,
    [userId, nickname, avatarUrl, passwordHash]
  );

  return normalizeUser(rows[0]);
}

export async function deleteUser(userId) {
  const result = await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  return result.rowCount > 0;
}

export async function saveUserProgress(user) {
  const stats = user.stats ?? {};

  const { rows } = await pool.query(
    `
      UPDATE users
      SET
        tests_completed = $2,
        best_accuracy = $3,
        best_wpm = $4,
        points = $5,
        task_state = $6::jsonb,
        task_completions = $7::jsonb,
        last_result = $8::jsonb
      WHERE id = $1
      RETURNING *
    `,
    [
      user.id,
      Number(stats.testsCompleted ?? 0),
      Number(stats.bestAccuracy ?? 0),
      Number(stats.bestWpm ?? 0),
      Number(stats.points ?? 0),
      JSON.stringify(user.taskState ?? {}),
      JSON.stringify(user.taskCompletions ?? []),
      user.lastResult ? JSON.stringify(user.lastResult) : null
    ]
  );

  return normalizeUser(rows[0]);
}

async function saveUserProgressWithClient(client, user) {
  const stats = user.stats ?? {};

  const { rows } = await client.query(
    `
      UPDATE users
      SET
        tests_completed = $2,
        best_accuracy = $3,
        best_wpm = $4,
        points = $5,
        task_state = $6::jsonb,
        task_completions = $7::jsonb,
        last_result = $8::jsonb
      WHERE id = $1
      RETURNING *
    `,
    [
      user.id,
      Number(stats.testsCompleted ?? 0),
      Number(stats.bestAccuracy ?? 0),
      Number(stats.bestWpm ?? 0),
      Number(stats.points ?? 0),
      JSON.stringify(user.taskState ?? {}),
      JSON.stringify(user.taskCompletions ?? []),
      user.lastResult ? JSON.stringify(user.lastResult) : null
    ]
  );

  return normalizeUser(rows[0]);
}

export async function updateUserProgressInTransaction(userId, updateUser) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows } = await client.query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [userId]);
    const user = normalizeUser(rows[0]);

    if (!user) {
      await client.query('ROLLBACK');
      return null;
    }

    await updateUser(user, client);
    const savedUser = await saveUserProgressWithClient(client, user);

    await client.query('COMMIT');
    return savedUser;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function countClanMembers(emoji) {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM users WHERE emoji = $1', [emoji]);
  return Number(rows[0]?.count ?? 0);
}

export async function listClanMembers(emoji) {
  const { rows } = await pool.query(
    `
      SELECT id, login, nickname, avatar_url, points, tests_completed
      FROM users
      WHERE emoji = $1
      ORDER BY points DESC, tests_completed DESC
    `,
    [emoji]
  );

  return rows.map((row) => ({
    id: row.id,
    login: row.login,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    points: Number(row.points ?? 0),
    testsCompleted: Number(row.tests_completed ?? 0)
  }));
}

export async function listClanRatings() {
  const { rows } = await pool.query(`
    SELECT emoji, COUNT(*)::int AS members, COALESCE(SUM(points), 0)::int AS points
    FROM users
    WHERE BTRIM(emoji) <> ''
    GROUP BY emoji
    ORDER BY points DESC, members DESC
  `);

  return rows.map((row) => ({
    emoji: row.emoji,
    members: Number(row.members ?? 0),
    points: Number(row.points ?? 0)
  }));
}

export default {
  listUsers,
  findUserById,
  findUserByLogin,
  createUser,
  updatePasswordHash,
  updateProfile,
  deleteUser,
  saveUserProgress,
  updateUserProgressInTransaction,
  countClanMembers,
  listClanMembers,
  listClanRatings
};
