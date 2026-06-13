import { getRecommendedDifficulty } from './lessonService.js';

const achievementDefinitions = [
  { id: 'first-training', title: 'Первый шаг', description: 'Завершить первую тренировку.', test: ({ total }) => total >= 1 },
  { id: 'ten-trainings', title: 'Вошёл во вкус', description: 'Завершить 10 тренировок.', test: ({ total }) => total >= 10 },
  { id: 'accuracy-95', title: 'Почти без ошибок', description: 'Достичь точности 95%.', test: ({ bestAccuracy }) => bestAccuracy >= 95 },
  { id: 'speed-40', title: 'Быстрые пальцы', description: 'Достичь скорости 40 WPM.', test: ({ bestWpm }) => bestWpm >= 40 },
  { id: 'streak-3', title: 'Стабильный ритм', description: 'Тренироваться 3 дня подряд.', test: ({ longestStreak }) => longestStreak >= 3 },
  { id: 'hundred-points', title: 'Командный вклад', description: 'Заработать 100 очков для клана.', test: ({ points }) => points >= 100 }
];

function toDayKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function differenceInDays(left, right) {
  return Math.round((left.getTime() - right.getTime()) / 86400000);
}

export function calculateStreaks(results = [], now = new Date()) {
  const days = [...new Set(results.map((result) => toDayKey(result.createdAt)))].sort().reverse();

  if (days.length === 0) {
    return { current: 0, longest: 0 };
  }

  let longest = 1;
  let running = 1;

  for (let index = 1; index < days.length; index += 1) {
    const previous = new Date(`${days[index - 1]}T00:00:00.000Z`);
    const current = new Date(`${days[index]}T00:00:00.000Z`);

    if (differenceInDays(previous, current) === 1) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 1;
    }
  }

  const today = toDayKey(now);
  const yesterday = toDayKey(new Date(now.getTime() - 86400000));
  let current = days[0] === today || days[0] === yesterday ? 1 : 0;

  for (let index = 1; current > 0 && index < days.length; index += 1) {
    const previous = new Date(`${days[index - 1]}T00:00:00.000Z`);
    const day = new Date(`${days[index]}T00:00:00.000Z`);
    if (differenceInDays(previous, day) !== 1) break;
    current += 1;
  }

  return { current, longest };
}

export function buildProgressSummary({ results = [], stats = {}, points = 0, now = new Date() } = {}) {
  const streak = calculateStreaks(results, now);
  const total = Math.max(results.length, Number(stats.testsCompleted ?? 0));
  const bestWpm = Math.max(
    Number(stats.bestWpm ?? 0),
    results.reduce((best, result) => Math.max(best, Number(result.wpm ?? 0)), 0)
  );
  const bestAccuracy = Math.max(
    Number(stats.bestAccuracy ?? 0),
    results.reduce((best, result) => Math.max(best, Number(result.accuracy ?? 0)), 0)
  );
  const recent = results.slice(0, 10);
  const averageWpm = recent.length
    ? Math.round(recent.reduce((sum, result) => sum + Number(result.wpm ?? 0), 0) / recent.length)
    : 0;
  const averageAccuracy = recent.length
    ? Math.round(recent.reduce((sum, result) => sum + Number(result.accuracy ?? 0), 0) / recent.length)
    : 0;
  const achievementContext = { total, bestWpm, bestAccuracy, longestStreak: streak.longest, points };

  return {
    total,
    averageWpm,
    averageAccuracy,
    bestWpm,
    bestAccuracy,
    streak,
    recommendedDifficulty: getRecommendedDifficulty(results),
    achievements: achievementDefinitions.map(({ test, ...achievement }) => ({
      ...achievement,
      unlocked: test(achievementContext)
    }))
  };
}

export default {
  calculateStreaks,
  buildProgressSummary
};
