export type AuthMode = "register" | "login";

export type UserStats = {
  testsCompleted: number;
  bestAccuracy: number;
  bestWpm: number;
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
};

export type ClanMember = Pick<UserProfile, "id" | "login" | "nickname" | "avatarUrl">;

export type ClanResponse = {
  emoji: string;
  members: ClanMember[];
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
