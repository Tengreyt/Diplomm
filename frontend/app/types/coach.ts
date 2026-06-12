export type AiCoachTask = {
  title: string;
  description: string;
  targetText: string;
  focus: string;
  minutes: number;
};

export type AiCoach = {
  source: "openai" | "local";
  updatedAt: string;
  praise: string;
  advice: string;
  focusKeys: string[];
  task: AiCoachTask;
};

export type AiCoachResponse = {
  coach: AiCoach;
};
