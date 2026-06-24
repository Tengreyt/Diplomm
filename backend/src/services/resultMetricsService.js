export function calculateResultMetrics({ lessonText = '', typedText = '', seconds = 1 } = {}) {
  const expected = Array.from(String(lessonText));
  const actual = Array.from(String(typedText)).slice(0, expected.length);
  let correctChars = 0;
  let remainingErrors = 0;

  for (let index = 0; index < expected.length; index += 1) {
    if (actual[index] === expected[index]) {
      correctChars += 1;
    } else {
      remainingErrors += 1;
    }
  }

  const safeSeconds = Math.max(1, Math.round(Number(seconds) || 1));
  const accuracy = expected.length > 0
    ? Math.round((correctChars / expected.length) * 100)
    : 0;
  const wpm = Math.round((correctChars / 5) / (safeSeconds / 60));

  return {
    wpm: Math.max(0, wpm),
    accuracy: Math.max(0, Math.min(100, accuracy)),
    errors: remainingErrors,
    remainingErrors,
    seconds: safeSeconds,
    correctChars,
    totalChars: expected.length
  };
}

/**
 * Накопительные ошибки приходят с клиента (каждый неверный ввод, включая исправленные).
 * Сервер проверяет диапазон и не доверяет значению вне разумных границ.
 */
export function resolveCumulativeErrors({
  lessonText = '',
  remainingErrors = 0,
  reportedTotalErrors
} = {}) {
  const lessonLength = Array.from(String(lessonText)).length;
  const minErrors = Math.max(0, Math.round(Number(remainingErrors) || 0));
  const maxErrors = Math.max(minErrors, lessonLength * 20);

  if (reportedTotalErrors === undefined || reportedTotalErrors === null) {
    return minErrors;
  }

  const totalErrors = Math.round(Number(reportedTotalErrors));

  if (!Number.isFinite(totalErrors) || totalErrors < minErrors || totalErrors > maxErrors) {
    return minErrors;
  }

  return totalErrors;
}

export default { calculateResultMetrics, resolveCumulativeErrors };
