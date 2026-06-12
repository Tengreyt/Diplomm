import { analyzeTypingAttempt, buildPracticeText } from './typingAnalysisService.js';

const defaultModel = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const openAiUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/responses';
const requestTimeoutMs = Number(process.env.OPENAI_TIMEOUT_MS ?? 8000);

const coachSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    praise: {
      type: 'string',
      description: 'Short encouraging phrase in Russian.'
    },
    advice: {
      type: 'string',
      description: 'One practical typing improvement tip in Russian.'
    },
    focusKeys: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 4
    },
    task: {
      type: 'object',
      additionalProperties: false,
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        targetText: { type: 'string' },
        focus: { type: 'string' },
        minutes: { type: 'integer', minimum: 1, maximum: 10 }
      },
      required: ['title', 'description', 'targetText', 'focus', 'minutes']
    }
  },
  required: ['praise', 'advice', 'focusKeys', 'task']
};

function trimText(value, fallback, maxLength) {
  const text = String(value ?? '').trim();
  return (text || fallback).slice(0, maxLength);
}

function normalizeCoach(rawCoach, source = 'local') {
  const task = rawCoach?.task ?? {};

  return {
    source,
    updatedAt: new Date().toISOString(),
    praise: trimText(rawCoach?.praise, 'Хорошая работа, результат сохранен.', 160),
    advice: trimText(rawCoach?.advice, 'На следующем подходе держи ровный ритм и не ускоряйся после ошибки.', 260),
    focusKeys: Array.isArray(rawCoach?.focusKeys)
      ? rawCoach.focusKeys.map((key) => String(key).trim()).filter(Boolean).slice(0, 4)
      : ['ритм'],
    task: {
      title: trimText(task.title, 'Точность перед скоростью', 80),
      description: trimText(task.description, 'Пройди короткую тренировку медленнее обычного и следи за каждым символом.', 220),
      targetText: trimText(task.targetText, 'мир дом рука окно свет ритм', 180),
      focus: trimText(task.focus, 'ровный ритм', 80),
      minutes: Math.max(1, Math.min(10, Math.round(Number(task.minutes ?? 3))))
    }
  };
}

function buildFallbackCoach({ user, result, analysis }) {
  const testsCompleted = Number(user?.stats?.testsCompleted ?? 0);
  const focusKeys = analysis.focusChars.length > 0 ? analysis.focusChars : ['ритм'];
  const targetText = buildPracticeText(focusKeys);

  if (testsCompleted === 0) {
    return normalizeCoach({
      praise: 'Отличный старт: первая цель уже понятна.',
      advice: 'Печатай медленно первые 20 секунд, чтобы пальцы поймали ровный темп.',
      focusKeys,
      task: {
        title: 'Первая чистая серия',
        description: 'Сделай одну тренировку без спешки и держи точность выше 85%.',
        targetText,
        focus: 'плавный старт',
        minutes: 3
      }
    });
  }

  if (Number(result?.accuracy ?? 0) < 85 || Number(result?.errors ?? 0) >= 5) {
    return normalizeCoach({
      praise: 'Результат сохранен, теперь ясно, где точка роста.',
      advice: 'После ошибки не ускоряйся, вернись к одному ровному темпу на 3-4 слова.',
      focusKeys,
      task: {
        title: 'Чистые клавиши',
        description: 'Повтори короткий набор и целься в точность 90%+, скорость пока вторична.',
        targetText,
        focus: `символы: ${focusKeys.join(', ')}`,
        minutes: 4
      }
    });
  }

  if (Number(result?.wpm ?? 0) < 25) {
    return normalizeCoach({
      praise: 'Точность уже держится, можно аккуратно поднимать темп.',
      advice: 'Печатай группами по словам, а не отдельными буквами: взгляд должен идти чуть впереди пальцев.',
      focusKeys,
      task: {
        title: 'Ровный разгон',
        description: 'Сделай 3 минуты печати в одном темпе и попробуй прибавить 5 WPM без потери точности.',
        targetText,
        focus: 'скорость без рывков',
        minutes: 3
      }
    });
  }

  return normalizeCoach({
    praise: 'Сильно: темп и точность уже выглядят уверенно.',
    advice: 'Теперь тренируй стабильность: не гонись за рекордом в начале, ускоряйся ближе к середине текста.',
    focusKeys,
    task: {
      title: 'Стабильная серия',
      description: 'Пройди две тренировки подряд с точностью от 90% и без резкого падения скорости.',
      targetText,
      focus: 'стабильность',
      minutes: 5
    }
  });
}

function extractResponseText(payload) {
  if (typeof payload?.output_text === 'string') {
    return payload.output_text;
  }

  const content = payload?.output
    ?.flatMap((item) => item.content ?? [])
    ?.find((item) => item.type === 'output_text' || typeof item.text === 'string');

  return content?.text ?? '';
}

async function requestOpenAiCoach({ user, result, analysis }) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(openAiUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: defaultModel,
        temperature: 0.7,
        max_output_tokens: 700,
        text: {
          format: {
            type: 'json_schema',
            name: 'typing_coach_response',
            strict: true,
            schema: coachSchema
          }
        },
        input: [
          {
            role: 'system',
            content: [
              'Ты ИИ-тренер для русскоязычного клавиатурного тренажера.',
              'Дай короткое персональное задание на основе ошибок, скорости и точности.',
              'Пиши по-русски, дружелюбно, без длинных объяснений.',
              'Не обещай медицинских или гарантированных результатов.'
            ].join(' ')
          },
          {
            role: 'user',
            content: JSON.stringify({
              user: {
                nickname: user?.nickname,
                testsCompleted: user?.stats?.testsCompleted,
                bestWpm: user?.stats?.bestWpm,
                bestAccuracy: user?.stats?.bestAccuracy
              },
              result,
              analysis
            })
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI coach request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const text = extractResponseText(payload);
    const parsedCoach = JSON.parse(text);

    return normalizeCoach(parsedCoach, 'openai');
  } finally {
    clearTimeout(timeout);
  }
}

export async function buildCoach({ user, result = null, lessonText = '', typedText = '' } = {}) {
  const safeResult = result ?? user?.lastResult ?? {
    wpm: user?.stats?.bestWpm ?? 0,
    accuracy: user?.stats?.bestAccuracy ?? 0,
    errors: 0,
    seconds: 0
  };
  const analysis = analyzeTypingAttempt({ lessonText, typedText, result: safeResult });
  const fallbackCoach = buildFallbackCoach({ user, result: safeResult, analysis });

  try {
    const openAiCoach = await requestOpenAiCoach({ user, result: safeResult, analysis });
    return openAiCoach ?? fallbackCoach;
  } catch (error) {
    console.warn('AI coach fallback used:', error.message);
    return fallbackCoach;
  }
}

export default {
  buildCoach
};
