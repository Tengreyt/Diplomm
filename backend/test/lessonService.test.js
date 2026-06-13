import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAdaptiveLesson, getRecommendedDifficulty } from '../src/services/lessonService.js';

test('keeps new users on beginner difficulty', () => {
  assert.equal(getRecommendedDifficulty([]), 'beginner');
});

test('raises difficulty only for stable accurate results', () => {
  const results = Array.from({ length: 5 }, () => ({ accuracy: 96, wpm: 48 }));
  assert.equal(getRecommendedDifficulty(results), 'advanced');
});

test('builds focused adaptive text from recorded mistakes', () => {
  const lesson = buildAdaptiveLesson([
    { accuracy: 82, wpm: 18, analysis: { focusChars: ['р', 'т'] } },
    { accuracy: 85, wpm: 20, analysis: { focusChars: ['о'] } }
  ]);

  assert.equal(lesson.source, 'adaptive');
  assert.equal(lesson.levelLabel, 'Адаптивный');
  assert.match(lesson.text, /ритм|точность|скорость/);
});
