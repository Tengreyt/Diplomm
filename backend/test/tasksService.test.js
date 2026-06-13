import test from 'node:test';
import assert from 'node:assert/strict';

import { applyTaskProgress } from '../src/services/tasksService.js';

test('does not award the same periodic task twice', () => {
  const user = { stats: { points: 0 }, taskState: {}, taskCompletions: [] };
  const result = { wpm: 40, accuracy: 95 };
  const now = new Date('2026-06-13T12:00:00.000Z');

  const first = applyTaskProgress(user, result, now);
  const second = applyTaskProgress(user, result, now);

  assert.ok(first.earnedPoints > 0);
  assert.equal(second.earnedPoints, 0);
});
