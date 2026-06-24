import type { DifficultyLevel } from "~/types/trainer";

export type PacePresetId = "15s" | "30s" | "1m" | "2m";

export const pacePresets: Array<{
  id: PacePresetId;
  label: string;
  difficulty: Exclude<DifficultyLevel, "adaptive">;
  hint: string;
}> = [
  { id: "15s", label: "15с", difficulty: "beginner", hint: "Короткий урок для быстрого разгона" },
  { id: "30s", label: "30с", difficulty: "beginner", hint: "Короткий урок в спокойном темпе" },
  { id: "1m", label: "1м", difficulty: "intermediate", hint: "Средняя длина текста" },
  { id: "2m", label: "2м", difficulty: "advanced", hint: "Длинный текст для выносливости" }
];

export const difficultyOptions: Array<{
  value: DifficultyLevel;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    value: "adaptive",
    label: "Адаптивный",
    shortLabel: "адаптив",
    description: "Уровень и символы выбираются по истории результатов"
  },
  {
    value: "beginner",
    label: "Начальный",
    shortLabel: "лёгкий",
    description: "Короткие слова и спокойный темп"
  },
  {
    value: "intermediate",
    label: "Средний",
    shortLabel: "средний",
    description: "Фразы длиннее, важен ровный ритм"
  },
  {
    value: "advanced",
    label: "Сложный",
    shortLabel: "сложный",
    description: "Длинные тексты, знаки препинания и скорость"
  }
];

export const difficultyLabels = difficultyOptions.reduce<Record<DifficultyLevel, string>>(
  (labels, option) => {
    labels[option.value] = option.label;
    return labels;
  },
  {
    adaptive: "Адаптивный",
    beginner: "Начальный",
    intermediate: "Средний",
    advanced: "Сложный"
  }
);
