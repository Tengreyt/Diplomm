export function calculateResultMetrics({ lessonText = '', typedText = '', seconds = 1 } = {}) {
  const expected = Array.from(String(lessonText));
  const actual = Array.from(String(typedText)).slice(0, expected.length);
  let correctChars = 0;
  let errors = 0;

  for (let index = 0; index < expected.length; index += 1) {
    if (actual[index] === expected[index]) {
      correctChars += 1;
    } else {
      errors += 1;
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
    errors,
    seconds: safeSeconds,
    correctChars,
    totalChars: expected.length
  };
}

export default { calculateResultMetrics };
