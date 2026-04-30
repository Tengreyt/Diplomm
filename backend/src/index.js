import cors from "cors";
import crypto from "crypto";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../data");
const usersFile = path.join(dataDir, "users.json");

const app = express();
const port = process.env.PORT || 4001;

const sessions = new Map();

const lessons = [
  {
    id: 1,
    level: "beginner",
    text: "дом том ком сон фон дон"
  },
  {
    id: 2,
    level: "intermediate",
    text: "Сегодня мы тренируем ровный ритм печати и аккуратное нажатие клавиш."
  },
  {
    id: 3,
    level: "advanced",
    text: "Съешь ещё этих мягких французских булок, да выпей же чаю."
  }
];

const avatarPresets = [
  "https://api.dicebear.com/9.x/thumbs/svg?seed=Orbit",
  "https://api.dicebear.com/9.x/thumbs/svg?seed=Nova",
  "https://api.dicebear.com/9.x/thumbs/svg?seed=Pixel",
  "https://api.dicebear.com/9.x/thumbs/svg?seed=Signal"
];

app.use(cors());
app.use(express.json({ limit: "1mb" }));

ensureStorage();

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    service: "keyboard-trainer-backend"
  });
});

app.get("/api/lesson", (_request, response) => {
  const lesson = lessons[Math.floor(Math.random() * lessons.length)];
  response.json(lesson);
});

app.post("/api/auth/register", (request, response) => {
  const users = readUsers();
  const {
    login = "",
    password = "",
    nickname = "",
    emoji = "",
    avatarUrl = ""
  } = request.body ?? {};

  const cleanLogin = String(login).trim().toLowerCase();
  const cleanNickname = String(nickname).trim();
  const cleanEmoji = String(emoji).trim();
  const cleanAvatarUrl = String(avatarUrl).trim();

  if (!cleanLogin || !password || !cleanNickname || !cleanEmoji || !cleanAvatarUrl) {
    return response.status(400).json({
      message: "Заполни логин, пароль, ник, эмоджи клана и аватар."
    });
  }

  if (cleanLogin.length < 3) {
    return response.status(400).json({
      message: "Логин должен быть не короче 3 символов."
    });
  }

  if (String(password).length < 6) {
    return response.status(400).json({
      message: "Пароль должен быть не короче 6 символов."
    });
  }

  if (users.some((user) => user.login === cleanLogin)) {
    return response.status(409).json({
      message: "Пользователь с таким логином уже существует."
    });
  }

  const newUser = {
    id: crypto.randomUUID(),
    login: cleanLogin,
    nickname: cleanNickname,
    emoji: cleanEmoji,
    avatarUrl: cleanAvatarUrl,
    createdAt: new Date().toISOString(),
    passwordHash: createHash(password),
    stats: {
      testsCompleted: 0,
      bestAccuracy: 0,
      bestWpm: 0
    }
  };

  users.push(newUser);
  writeUsers(users);

  const token = createSession(newUser.id);

  response.status(201).json({
    token,
    user: serializeUser(newUser, users)
  });
});

app.post("/api/auth/login", (request, response) => {
  const users = readUsers();
  const { login = "", password = "" } = request.body ?? {};
  const cleanLogin = String(login).trim().toLowerCase();

  const user = users.find((entry) => entry.login === cleanLogin);

  if (!user || user.passwordHash !== createHash(password)) {
    return response.status(401).json({
      message: "Неверный логин или пароль."
    });
  }

  const token = createSession(user.id);

  response.json({
    token,
    user: serializeUser(user, users)
  });
});

app.get("/api/me", (request, response) => {
  const session = getSession(request);

  if (!session) {
    return response.status(401).json({
      message: "Сессия не найдена."
    });
  }

  const users = readUsers();
  const user = users.find((entry) => entry.id === session.userId);

  if (!user) {
    sessions.delete(session.token);
    return response.status(401).json({
      message: "Пользователь не найден."
    });
  }

  response.json({
    user: serializeUser(user, users)
  });
});

app.get("/api/clans/:emoji", (request, response) => {
  const users = readUsers();
  const emoji = String(request.params.emoji ?? "").trim();
  const clanMembers = users.filter((user) => user.emoji === emoji);

  response.json({
    emoji,
    members: clanMembers.map((user) => ({
      id: user.id,
      login: user.login,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl || avatarPresets[0]
    }))
  });
});

app.listen(port, () => {
  console.log(`Backend started on http://localhost:${port}`);
});

function ensureStorage() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, "[]", "utf8");
  }
}

function readUsers() {
  return JSON.parse(fs.readFileSync(usersFile, "utf8"));
}

function writeUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf8");
}

function createHash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function createSession(userId) {
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, {
    token,
    userId,
    createdAt: Date.now()
  });
  return token;
}

function getSession(request) {
  const header = request.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return token ? sessions.get(token) : null;
}

function serializeUser(user, users) {
  const clanMembers = users.filter((entry) => entry.emoji === user.emoji).length;

  return {
    id: user.id,
    login: user.login,
    nickname: user.nickname,
    emoji: user.emoji,
    avatarUrl: user.avatarUrl || avatarPresets[0],
    clanMembers,
    createdAt: user.createdAt,
    stats: user.stats
  };
}
