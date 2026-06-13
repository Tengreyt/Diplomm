import pool from './pool.js';
import { formatDatabaseError } from './errorMessage.js';
import { migrateDatabase } from './migrate.js';
import { hashPassword } from '../services/userService.js';

const demoUsers = [
  { login: 'demo_nova', nickname: 'Nova', emoji: '🔥', seed: 'Nova', points: 410, baseWpm: 32 },
  { login: 'demo_pixel', nickname: 'Pixel', emoji: '🔥', seed: 'Pixel', points: 285, baseWpm: 25 },
  { login: 'demo_orbit', nickname: 'Orbit', emoji: '⚡', seed: 'Orbit', points: 360, baseWpm: 38 },
  { login: 'demo_signal', nickname: 'Signal', emoji: '🌙', seed: 'Signal', points: 190, baseWpm: 22 }
];

async function seedUser(user, passwordHash) {
  const avatarUrl = `https://api.dicebear.com/9.x/thumbs/svg?seed=${user.seed}`;
  const { rows } = await pool.query(
    `
      INSERT INTO users (login, password_hash, nickname, emoji, avatar_url, points)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (login) DO UPDATE
      SET nickname = EXCLUDED.nickname,
          emoji = EXCLUDED.emoji,
          avatar_url = EXCLUDED.avatar_url
      RETURNING id
    `,
    [user.login, passwordHash, user.nickname, user.emoji, avatarUrl, user.points]
  );
  const userId = rows[0].id;
  const countResult = await pool.query(
    'SELECT COUNT(*)::int AS count FROM training_results WHERE user_id = $1',
    [userId]
  );

  if (Number(countResult.rows[0].count) > 0) return;

  for (let index = 6; index >= 0; index -= 1) {
    const createdAt = new Date(Date.now() - index * 86400000);
    const wpm = user.baseWpm + (6 - index) * 2;
    const accuracy = Math.min(98, 86 + (6 - index) * 2);
    const errors = Math.max(1, Math.round((100 - accuracy) / 3));
    const seconds = 28;

    const attemptResult = await pool.query(
      `
        INSERT INTO training_attempts (
          user_id, lesson_id, lesson_text, difficulty, source,
          created_at, started_at, completed_at
        )
        VALUES ($1, $2, $3, $4, 'adaptive', $5, $5, $6)
        RETURNING id
      `,
      [
        userId,
        `seed-${index}`,
        'Сегодня мы тренируем ровный ритм печати и точность.',
        wpm >= 40 ? 'advanced' : wpm >= 25 ? 'intermediate' : 'beginner',
        createdAt,
        new Date(createdAt.getTime() + seconds * 1000)
      ]
    );

    await pool.query(
      `
        INSERT INTO training_results (
          attempt_id, user_id, lesson_id, difficulty, source,
          wpm, accuracy, errors, seconds, correct_chars, total_chars,
          analysis, created_at
        )
        VALUES ($1, $2, $3, $4, 'adaptive', $5, $6, $7, $8, $9, 54, $10::jsonb, $11)
      `,
      [
        attemptResult.rows[0].id,
        userId,
        `seed-${index}`,
        wpm >= 40 ? 'advanced' : wpm >= 25 ? 'intermediate' : 'beginner',
        wpm,
        accuracy,
        errors,
        seconds,
        Math.round(54 * accuracy / 100),
        JSON.stringify({ focusChars: index % 2 === 0 ? ['р', 'т'] : ['о'] }),
        createdAt
      ]
    );
  }

  await pool.query(
    `
      UPDATE users
      SET tests_completed = 7,
          best_wpm = $2,
          best_accuracy = 98,
          points = GREATEST(points, $3),
          last_result = $4::jsonb
      WHERE id = $1
    `,
    [
      userId,
      user.baseWpm + 12,
      user.points,
      JSON.stringify({
        wpm: user.baseWpm + 12,
        accuracy: 98,
        errors: 1,
        seconds: 28,
        createdAt: new Date().toISOString()
      })
    ]
  );
}

async function seedDatabase() {
  await migrateDatabase();
  const passwordHash = await hashPassword('Demo1234');

  for (const user of demoUsers) {
    await seedUser(user, passwordHash);
  }

  console.log('Demo data created. Login: demo_nova, password: Demo1234');
}

seedDatabase()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error('Database seed failed:\n%s', formatDatabaseError(error));
    await pool.end();
    process.exitCode = 1;
  });
