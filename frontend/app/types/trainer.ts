import type { AiCoach } from "~/types/coach";

export type ActualDifficulty = "beginner" | "intermediate" | "advanced";
export type DifficultyLevel = ActualDifficulty | "adaptive";

export type LessonResponse = {
  id: string;
  level: ActualDifficulty;
  levelLabel: string;
  text: string;
  source: "catalog" | "adaptive" | "coach";
};

export type AttemptResponse = {
  attemptId: string;
  lesson: LessonResponse;
  keyboardHeatmap: Record<string, number>;
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
    correctChars: number;
    totalChars: number;
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
