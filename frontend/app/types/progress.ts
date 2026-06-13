import type { ActualDifficulty } from "~/types/trainer";

export type TrainingResult = {
  id: string;
  attemptId: string;
  lessonId: string;
  difficulty: ActualDifficulty;
  source: "catalog" | "adaptive" | "coach";
  wpm: number;
  accuracy: number;
  errors: number;
  seconds: number;
  correctChars: number;
  totalChars: number;
  createdAt: string;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
};

export type ProgressSummary = {
  total: number;
  averageWpm: number;
  averageAccuracy: number;
  bestWpm: number;
  bestAccuracy: number;
  streak: {
    current: number;
    longest: number;
  };
  recommendedDifficulty: ActualDifficulty;
  achievements: Achievement[];
};

export type ProgressResponse = {
  summary: ProgressSummary;
  history: TrainingResult[];
};
