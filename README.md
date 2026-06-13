# Keyboard Trainer / Diplom

Проект ВКР: адаптивный веб-тренажер печати с авторизацией, историей результатов,
аналитикой прогресса, достижениями, клановым рейтингом и AI-тренером.

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
npm run db:seed # необязательно: демонстрационные пользователи и история
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

Демонстрационный аккаунт после `npm run db:seed`:

```text
login: demo_nova
password: Demo1234
```

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
│   │   ├── controllers/      # auth, attempts, results, progress, profile, clans, AI
│   │   ├── db/               # PostgreSQL pool and migrations
│   │   ├── services/         # lessons, metrics, progress, tasks, typing analysis, AI
│   │   ├── repo/             # users, sessions and training repositories
│   │   └── server.js         # wrapper для result routes
│   ├── test/                  # node:test unit tests
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── app.vue
│   │   ├── pages/
│   │   │   └── index.vue     # главный экран, связывает auth/profile/trainer
│   │   ├── composables/
│   │   │   ├── useAuth.ts    # auth state + API (register/login/me)
│   │   │   ├── useTrainer.ts # попытка, таймер и сохранение результата
│   │   │   ├── useAiCoach.ts # API AI-тренера для профиля
│   │   │   └── useProgress.ts# история и аналитика
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

### Тренировка и результаты
- `POST /attempts` - создать серверную попытку и получить урок
  body: `difficulty`; для AI-задания дополнительно `targetText`
- `POST /attempts/:attemptId/start` - зафиксировать серверное время первого ввода
- `POST /results` - завершить попытку
  body: `attemptId`, `typedText`; WPM, точность, ошибки и время считает backend
- `GET /progress` - история, средние показатели, серия, достижения и рекомендуемый уровень

### Управление профилем
- `PATCH /me` - изменить никнейм, аватар и при необходимости пароль
- `DELETE /me` - удалить аккаунт с подтверждением паролем
- `POST /auth/logout` - завершить текущую серверную сессию

## Архитектура и поток данных

1. Пользователь регистрируется/логинится через `useAuth.ts`.
2. Токен сохраняется в `localStorage`, состояние пользователя - в `useState`.
3. После входа `useTrainer.ts` создает попытку через `/attempts`.
4. При первой клавише backend фиксирует начало попытки.
5. После завершения frontend отправляет только `attemptId` и набранный текст.
6. Backend транзакционно пересчитывает метрики, сохраняет результат и обновляет задачи/очки.
7. История используется для графиков, серий, достижений и адаптивного выбора упражнения.
8. Backend анализирует ошибки и возвращает AI-совет через OpenAI или локальный fallback.
9. Очки пользователей суммируются в рейтинге кланов.

## Адаптивный режим

Адаптивный режим анализирует до пяти последних результатов:

- новичок или точность ниже целевой получает начальный уровень;
- стабильная точность и средняя скорость повышают сложность;
- часто ошибочно набираемые символы включаются в следующий тренировочный текст;
- рекомендация отображается в разделе прогресса.

История хранится в `training_results`, а незавершенные и завершенные попытки -
в `training_attempts`. Повторно сохранить одну попытку нельзя.

## Проверки

```bash
cd backend
npm test

cd ../frontend
npm run typecheck
npm run build
```

GitHub Actions выполняет миграцию PostgreSQL, backend-тесты, frontend typecheck
и production build. Для контейнерного развертывания добавлены Dockerfile обоих приложений.

Полный production-like запуск:

```bash
POSTGRES_PASSWORD=change-me docker compose -f docker-compose.prod.yml up --build
```

Для публичного сервера также задай `CORS_ORIGIN`, `NUXT_PUBLIC_API_BASE`,
`OPENAI_API_KEY` и надежный пароль PostgreSQL через окружение.

## Backend и деплой

- Основное хранилище - PostgreSQL. Пользовательские данные не хранятся в файлах репозитория.
- Таблицы создаются миграцией `npm run db:migrate`; при старте backend также проверяет и применяет схему.
- Сессии хранятся в таблице `sessions` как SHA-256 hash bearer-токена, поэтому переживают перезапуск backend.
- Новые пароли хешируются через `bcrypt`. Старые SHA-256 hash из JSON поддерживаются при импорте и автоматически обновляются после успешного логина.
- Для production укажи реальные `DATABASE_URL`, `CORS_ORIGIN`, `DB_SSL` и секреты в переменных окружения платформы, а не в git.
- `OPENAI_API_KEY` хранится только на backend. Не добавляй его в frontend env и не коммить `.env`.

## Ограничения текущей реализации

- SQL-схема пока применяется единым idempotent-migrate без версионированного migration framework.
- Bearer-токен хранится в `localStorage`; для production-системы с повышенными требованиями
  безопасности стоит перейти на защищенную `HttpOnly` cookie-сессию.
- Клан после регистрации неизменяем, это сознательное продуктовое правило проекта.
