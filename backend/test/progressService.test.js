import test from 'node:test';
import assert from 'node:assert/strict';

import { buildProgressSummary, calculateStreaks } from '../src/services/progressService.js';

const resultAt = (date, overrides = {}) => ({
  createdAt: `${date}T12:00:00.000Z`,
  wpm: 30,
  accuracy: 90,
  ...overrides
});

test('calculates current and longest daily streaks', () => {
  const results = [
    resultAt('2026-06-13'),
    resultAt('2026-06-12'),
    resultAt('2026-06-11'),
    resultAt('2026-06-08')
  ];

  assert.deepEqual(
    calculateStreaks(results, new Date('2026-06-13T18:00:00.000Z')),
    { current: 3, longest: 3 }
  );
});

test('builds achievements and averages from history', () => {
  const summary = buildProgressSummary({
    results: [
      resultAt('2026-06-13', { wpm: 42, accuracy: 96 }),
      resultAt('2026-06-12', { wpm: 38, accuracy: 94 }),
      resultAt('2026-06-11', { wpm: 35, accuracy: 93 })
    ],
    stats: { testsCompleted: 10, bestWpm: 42, bestAccuracy: 96 },
    points: 120,
    now: new Date('2026-06-13T18:00:00.000Z')
  });

  assert.equal(summary.total, 10);
  assert.equal(summary.averageWpm, 38);
  assert.equal(summary.streak.current, 3);
  assert.equal(summary.achievements.every((achievement) => achievement.unlocked), true);
});
