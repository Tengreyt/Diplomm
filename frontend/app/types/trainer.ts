export type LessonResponse = {
  id: number;
  level: string;
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
