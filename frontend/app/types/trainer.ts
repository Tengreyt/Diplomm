import type { AiCoach } from "~/types/coach";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export type LessonResponse = {
  id: number;
  level: DifficultyLevel;
  levelLabel: string;
  text: string;
};

export type TrainerStats = {
  correctChars: number;
  accuracy: number;
  totalChars: number;
  errors: number;
  wpm: number;
  seconds: number;
};

export type SaveResultResponse = {
  user: import("~/types/auth").UserProfile;
  result: {
    wpm: number;
    accuracy: number;
    errors: number;
    seconds: number;
    createdAt: string;
  };
  tasks: {
    earnedPoints: number;
    completedTasks: Array<{
      id: string;
      period: import("~/types/auth").TaskPeriod;
      title: string;
      points: number;
    }>;
  };
  coach?: AiCoach;
};
