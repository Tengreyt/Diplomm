export const taskDefinitions = [
  {
    id: 'daily-finish',
    period: 'daily',
    title: 'Разминка дня',
    description: 'Заверши одну тренировку сегодня.',
    target: 1,
    points: 30,
    metric: 'tests'
  },
  {
    id: 'daily-accuracy',
    period: 'daily',
    title: 'Чистая печать',
    description: 'Пройди тренировку с точностью не ниже 90%.',
    target: 1,
    points: 45,
    metric: 'accurateTests',
    minAccuracy: 90
  },
  {
    id: 'daily-speed',
    period: 'daily',
    title: 'Быстрый темп',
    description: 'Набери 25 WPM или больше в одной тренировке.',
    target: 1,
    points: 50,
    metric: 'fastTests',
    minWpm: 25
  },
  {
    id: 'weekly-volume',
    period: 'weekly',
    title: 'Недельная серия',
    description: 'Заверши 5 тренировок за неделю.',
    target: 5,
    points: 120,
    metric: 'tests'
  },
  {
    id: 'weekly-accuracy',
    period: 'weekly',
    title: 'Стабильная точность',
    description: 'Сделай 3 тренировки за неделю с точностью не ниже 85%.',
    target: 3,
    points: 110,
    metric: 'accurateTests',
    minAccuracy: 85
  },
  {
    id: 'weekly-speed',
    period: 'weekly',
    title: 'Скоростная неделя',
    description: 'Сделай 3 тренировки за неделю со скоростью от 35 WPM.',
    target: 3,
    points: 130,
    metric: 'fastTests',
    minWpm: 35
  }
];

const metricRules = {
  tests: () => true,
  accurateTests: (result, task) => result.accuracy >= Number(task.minAccuracy ?? 90),
  fastTests: (result, task) => result.wpm >= Number(task.minWpm ?? 25)
};

function getDailyKey(date) {
  return date.toISOString().slice(0, 10);
}

function getWeeklyKey(date) {
  const normalizedDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = normalizedDate.getUTCDay() || 7;
  normalizedDate.setUTCDate(normalizedDate.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(normalizedDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((normalizedDate - yearStart) / 86400000 + 1) / 7);

  return `${normalizedDate.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function getPeriodKey(period, date) {
  return period === 'weekly' ? getWeeklyKey(date) : getDailyKey(date);
}

function ensureTaskState(user) {
  if (!user.taskState || typeof user.taskState !== 'object') {
    user.taskState = {};
  }

  if (!Array.isArray(user.taskCompletions)) {
    user.taskCompletions = [];
  }

  if (!user.stats || typeof user.stats !== 'object') {
    user.stats = {};
  }

  user.stats.points = Number(user.stats.points ?? 0);
}

export function applyTaskProgress(user, result, now = new Date()) {
  ensureTaskState(user);

  let earnedPoints = 0;
  const completedTasks = [];

  for (const task of taskDefinitions) {
    const periodKey = getPeriodKey(task.period, now);
    const stateKey = `${task.id}:${periodKey}`;
    const currentState = user.taskState[stateKey] ?? {
      taskId: task.id,
      period: task.period,
      periodKey,
      progress: 0,
      completed: false
    };

    if (!currentState.completed && metricRules[task.metric]?.(result, task)) {
      currentState.progress = Math.min(task.target, Number(currentState.progress ?? 0) + 1);

      if (currentState.progress >= task.target) {
        currentState.completed = true;
        currentState.completedAt = now.toISOString();
        earnedPoints += task.points;
        completedTasks.push({
          id: task.id,
          period: task.period,
          title: task.title,
          points: task.points
        });
        user.taskCompletions.push({
          taskId: task.id,
          period: task.period,
          periodKey,
          points: task.points,
          completedAt: currentState.completedAt
        });
      }
    }

    user.taskState[stateKey] = currentState;
  }

  user.stats.points = Number(user.stats.points ?? 0) + earnedPoints;

  return {
    earnedPoints,
    completedTasks
  };
}

export function getUserTasks(user, now = new Date()) {
  ensureTaskState(user);

  return taskDefinitions.map((task) => {
    const periodKey = getPeriodKey(task.period, now);
    const state = user.taskState[`${task.id}:${periodKey}`] ?? {};
    const progress = Math.min(task.target, Number(state.progress ?? 0));

    return {
      id: task.id,
      period: task.period,
      title: task.title,
      description: task.description,
      target: task.target,
      progress,
      points: task.points,
      completed: Boolean(state.completed)
    };
  });
}

export default {
  taskDefinitions,
  applyTaskProgress,
  getUserTasks
};
