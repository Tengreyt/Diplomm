export type AuthMode = "register" | "login";

export type UserStats = {
  testsCompleted: number;
  bestAccuracy: number;
  bestWpm: number;
  points: number;
};

export type TaskPeriod = "daily" | "weekly";

export type UserTask = {
  id: string;
  period: TaskPeriod;
  title: string;
  description: string;
  target: number;
  progress: number;
  points: number;
  completed: boolean;
};

export type UserProfile = {
  id: string;
  login: string;
  nickname: string;
  emoji: string;
  avatarUrl: string;
  clanMembers: number;
  createdAt: string;
  stats: UserStats;
  tasks: UserTask[];
};

export type ClanMember = Pick<UserProfile, "id" | "login" | "nickname" | "avatarUrl"> & {
  points: number;
  testsCompleted: number;
};

export type ClanResponse = {
  emoji: string;
  members: ClanMember[];
};

export type ClanRatingItem = {
  emoji: string;
  members: number;
  points: number;
};

export type ClanRatingResponse = {
  clans: ClanRatingItem[];
};

export type AuthResponse = {
  token: string;
  user: UserProfile;
};

export type RegisterForm = {
  login: string;
  password: string;
  nickname: string;
  emoji: string;
  avatarUrl: string;
};

export type LoginForm = {
  login: string;
  password: string;
};
