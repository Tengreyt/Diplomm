import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateResultMetrics,
  resolveCumulativeErrors
} from '../src/services/resultMetricsService.js';

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
      remainingErrors: 1,
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
  assert.equal(result.remainingErrors, 3);
  assert.equal(result.correctChars, 2);
  assert.equal(result.seconds, 1);
});

test('accepts cumulative errors that include corrected mistakes', () => {
  const remaining = calculateResultMetrics({
    lessonText: 'дом',
    typedText: 'дом',
    seconds: 10
  });

  assert.equal(
    resolveCumulativeErrors({
      lessonText: 'дом',
      remainingErrors: remaining.remainingErrors,
      reportedTotalErrors: 2
    }),
    2
  );
});

test('rejects tampered cumulative errors outside valid range', () => {
  assert.equal(
    resolveCumulativeErrors({
      lessonText: 'дом',
      remainingErrors: 0,
      reportedTotalErrors: 999
    }),
    0
  );

  assert.equal(
    resolveCumulativeErrors({
      lessonText: 'дом',
      remainingErrors: 1,
      reportedTotalErrors: 0
    }),
    1
  );
});
