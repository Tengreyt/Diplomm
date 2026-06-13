import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateResultMetrics } from '../src/services/resultMetricsService.js';

test('calculates trusted metrics from text and elapsed time', () => {
  assert.deepEqual(
    calculateResultMetrics({
      lessonText: 'мир дом',
      typedText: 'мир том',
      seconds: 12
    }),
    {
      wpm: 6,
      accuracy: 86,
      errors: 1,
      seconds: 12,
      correctChars: 6,
      totalChars: 7
    }
  );
});

test('counts missing characters as errors and clamps time', () => {
  const result = calculateResultMetrics({
    lessonText: 'текст',
    typedText: 'те',
    seconds: 0
  });

  assert.equal(result.errors, 3);
  assert.equal(result.correctChars, 2);
  assert.equal(result.seconds, 1);
});
