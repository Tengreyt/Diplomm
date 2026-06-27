import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAdaptiveLesson, getRecommendedDifficulty, lessons } from '../src/services/lessonService.js';
import { buildKeyboardHeatmap } from '../src/services/typingAnalysisService.js';

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

test('does not repeat the excluded adaptive text', () => {
  const results = [
    { accuracy: 82, wpm: 18, analysis: { focusChars: ['р', 'т'] } }
  ];
  const previousLesson = buildAdaptiveLesson(results);
  const nextLesson = buildAdaptiveLesson(results, { excludedTexts: [previousLesson.text] });

  assert.notEqual(nextLesson.text, previousLesson.text);
  assert.equal(nextLesson.levelLabel, 'Адаптивный');
});

test('does not repeat the excluded catalog text in adaptive mode', () => {
  const previousText = lessons.find((lesson) => lesson.level === 'beginner').text;
  const lesson = buildAdaptiveLesson([], { excludedTexts: [previousText] });

  assert.notEqual(lesson.text, previousText);
});

test('aggregates keyboard mistakes across recent results', () => {
  const heatmap = buildKeyboardHeatmap([
    { analysis: { missedChars: [{ value: 'Р', count: 2 }, { value: 'о', count: 1 }] } },
    { analysis: { missedChars: [{ value: 'р', count: 3 }] } }
  ]);

  assert.deepEqual(heatmap, { р: 5, о: 1 });
});
