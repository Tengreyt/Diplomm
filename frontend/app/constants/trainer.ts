import type { DifficultyLevel } from "~/types/trainer";

export const difficultyOptions: Array<{
  value: DifficultyLevel;
  label: string;
  description: string;
}> = [
  {
    value: "beginner",
    label: "Начальный",
    description: "Короткие слова и спокойный темп"
  },
  {
    value: "intermediate",
    label: "Средний",
    description: "Фразы длиннее, важен ровный ритм"
  },
  {
    value: "advanced",
    label: "Сложный",
    description: "Длинные тексты, знаки препинания и скорость"
  }
];

export const difficultyLabels = difficultyOptions.reduce<Record<DifficultyLevel, string>>(
  (labels, option) => {
    labels[option.value] = option.label;
    return labels;
  },
  {
    beginner: "Начальный",
    intermediate: "Средний",
    advanced: "Сложный"
  }
);
