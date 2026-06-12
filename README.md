# Keyboard Trainer / Diplom

Проект ВКР: веб-тренажер печати с авторизацией, профилем пользователя и сохранением результатов.

Стек:
- `frontend` - Nuxt 4 + Vue 3 + Tailwind
- `backend` - Node.js + Express
- хранилище - PostgreSQL

## Быстрый старт

### 1) PostgreSQL

Локально проще всего поднять БД через Docker:

```bash
docker compose up -d postgres
```

Если команда пишет `Cannot connect to the Docker daemon`, сначала запусти Docker Desktop и дождись статуса `Docker is running`, затем повтори команду.

### 2) Backend

```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

Запуск в dev: `node --watch src/index.js`  
По умолчанию API доступен на `http://localhost:4001/api`.

### 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

Дополнительно:
- `npm run build` - production build
- `npm run preview` - локальный preview production-сборки
- `npm run typecheck` - проверка типов

## Переменные окружения

### Backend
- `PORT` - порт API (по умолчанию `4001`)
- `DATABASE_URL` - строка подключения PostgreSQL
- `SESSION_TTL_DAYS` - срок жизни bearer-сессии в днях (по умолчанию `30`)
- `DB_SSL` - `true`, если managed PostgreSQL требует SSL
- `CORS_ORIGIN` - список разрешенных frontend origin через запятую
- `OPENAI_API_KEY` - ключ OpenAI для AI-тренера; если пустой, backend использует локальный fallback
- `OPENAI_MODEL` - модель для AI-тренера (по умолчанию `gpt-4.1-mini`)
- `OPENAI_TIMEOUT_MS` - таймаут запроса к OpenAI перед fallback

### Frontend
- `NUXT_PUBLIC_API_BASE` - базовый URL API  
  По умолчанию: `http://localhost:4001/api`

## Карта проекта

```text
.
├── backend/
│   ├── src/
│   │   ├── index.js          # entrypoint backend
│   │   ├── app.js            # Express app, CORS, /health, /lesson, /me
│   │   ├── controllers/      # auth, clans, results, AI coach routes
│   │   ├── db/               # PostgreSQL pool and migrations
│   │   ├── services/         # userService, task progress, typing analysis, AI coach
│   │   ├── repo/             # PostgreSQL repositories
│   │   └── server.js         # wrapper для result routes
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── app.vue
│   │   ├── pages/
│   │   │   └── index.vue     # главный экран, связывает auth/profile/trainer
│   │   ├── composables/
│   │   │   ├── useAuth.ts    # auth state + API (register/login/me)
│   │   │   ├── useTrainer.ts # логика тренажера + API (lesson/results)
│   │   │   └── useAiCoach.ts # API AI-тренера для профиля
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── profile/
│   │   │   ├── trainer/
│   │   │   ├── ui/
│   │   │   ├── home/
│   │   │   └── brand/
│   │   ├── types/
│   │   │   ├── auth.ts
│   │   │   └── trainer.ts
│   │   ├── constants/
│   │   └── utils/
│   ├── nuxt.config.ts
│   └── package.json
├── AGENTS.md                  # инструкции для ИИ-агентов и новых участников
└── README.md
```

Для подробной карты архитектуры, правил правок и подсказок для ИИ-агентов см. `AGENTS.md`.

## API (кратко)

Все маршруты начинаются с `/api`.

### Сервисные
- `GET /health` - проверка доступности backend
- `GET /lesson?level=beginner|intermediate|advanced` - получить случайный тренировочный текст выбранной сложности

### Авторизация и профиль
- `POST /auth/register` - регистрация  
  body: `login`, `password`, `nickname`, `emoji`, `avatarUrl`
- `POST /auth/login` - вход  
  body: `login`, `password`
- `GET /me` - текущий пользователь (требует `Authorization: Bearer <token>`)
- `GET /clans` - рейтинг кланов
- `GET /clans/:emoji` - участники клана по эмоджи
- `GET /ai/coach` - персональное AI-задание (требует Bearer токен)

### Результаты тренировки
- `POST /results` - сохранить результат (требует Bearer токен)  
  body: `wpm`, `accuracy`, `errors`, `seconds`, `lessonText`, `typedText`; ответ обновляет пользователя, задачи, очки и возвращает `coach`

## Архитектура и поток данных

1. Пользователь регистрируется/логинится через `useAuth.ts`.
2. Токен сохраняется в `localStorage`, состояние пользователя - в `useState`.
3. После входа `useTrainer.ts` запрашивает урок через `/lesson`.
4. Во время печати считаются метрики (accuracy/WPM/errors/time).
5. После завершения отправляется результат в `/results`.
6. Backend обновляет `stats`, прогресс ежедневных/еженедельных задач и очки пользователя в PostgreSQL.
7. Backend анализирует ошибки попытки и возвращает AI-совет/задание через OpenAI или локальный fallback.
8. Очки пользователя суммируются в рейтинге кланов и сортировке участников внутри клана.

## Backend и деплой

- Основное хранилище - PostgreSQL. Пользовательские данные не хранятся в файлах репозитория.
- Таблицы создаются миграцией `npm run db:migrate`; при старте backend также проверяет и применяет схему.
- Сессии хранятся в таблице `sessions` как SHA-256 hash bearer-токена, поэтому переживают перезапуск backend.
- Новые пароли хешируются через `bcrypt`. Старые SHA-256 hash из JSON поддерживаются при импорте и автоматически обновляются после успешного логина.
- Для production укажи реальные `DATABASE_URL`, `CORS_ORIGIN`, `DB_SSL` и секреты в переменных окружения платформы, а не в git.
- `OPENAI_API_KEY` хранится только на backend. Не добавляй его в frontend env и не коммить `.env`.

## Ограничения текущей реализации

- Тестов и CI в репозитории сейчас нет.
- Таблицы создаются простым SQL-migrate без отдельного migration framework.
