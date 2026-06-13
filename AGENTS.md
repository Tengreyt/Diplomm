# AGENTS.md

Инструкции для ИИ-агентов и новых участников проекта. README остается входной точкой для человека и содержит общую карту проекта. Этот файл не дублирует дерево папок, а фиксирует архитектуру, правила правок и порядок чтения файлов для работы с кодом.

## Назначение проекта

Это учебный full-stack веб-тренажер печати для ВКР. Пользователь регистрируется или входит, выбирает профиль/клан, проходит тренировку, а результат сохраняется в профиль.

## Стек

- Frontend: Nuxt 4, Vue 3, TypeScript, Tailwind CSS, `tailwind-variants`.
- Backend: Node.js, Express, ES modules.
- Хранилище: PostgreSQL через `pg`.
- AI-тренер: backend вызывает OpenAI Responses API при наличии `OPENAI_API_KEY`; без ключа используется локальный fallback.
- Авторизация: Bearer-токены в PostgreSQL-таблице `sessions` + токен в `localStorage` на клиенте.

## Быстрый запуск

Backend:

```bash
docker compose up -d postgres
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Проверки frontend:

```bash
cd frontend
npm run typecheck
npm run build
```

Для backend запускай `npm test`. Если меняешь API, дополнительно проверь миграцию и ручной сценарий регистрации/логина/сохранения результата.

## Архитектура backend

- `backend/src/index.js` - точка запуска, импортирует `app` и слушает порт.
- `backend/src/app.js` - создает Express-приложение, подключает middleware/CORS, публичные `/api/health`, `/api/lesson`, защищенный `/api/me`, регистрирует контроллеры.
- `backend/src/db/pool.js` - PostgreSQL pool, `DATABASE_URL`, SSL-настройка.
- `backend/src/db/migrate.js` - SQL-схема пользователей, сессий, попыток и результатов.
- `backend/src/controllers/authController.js` - `/api/auth/register`, `/api/auth/login`.
- `backend/src/controllers/resultsController.js` - `/api/results`, обновляет статистику и `lastResult`.
- `backend/src/controllers/attemptsController.js` - создание и серверный запуск попытки.
- `backend/src/controllers/progressController.js` - история, серии, достижения и рекомендации.
- `backend/src/controllers/profileController.js` - редактирование/удаление профиля и logout.
- `backend/src/controllers/aiCoachController.js` - `/api/ai/coach`, персональное задание и совет AI-тренера.
- `backend/src/controllers/clansController.js` - `/api/clans`, `/api/clans/:emoji`.
- `backend/src/services/userService.js` - сериализация пользователя, bcrypt/SHA-256 legacy-проверка пароля, расчет очков клана, avatar presets.
- `backend/src/services/typingAnalysisService.js` - анализ ошибок попытки печати.
- `backend/src/services/resultMetricsService.js` - серверный расчет WPM, точности и ошибок.
- `backend/src/services/lessonService.js` - каталог и адаптивный выбор уроков.
- `backend/src/services/progressService.js` - серии, агрегаты и достижения.
- `backend/src/services/aiCoachService.js` - prompt, OpenAI-запрос, JSON-схема ответа и локальный fallback.
- `backend/src/repo/usersRepo.js` - PostgreSQL-запросы пользователей, статистики, кланов.
- `backend/src/repo/sessionsRepo.js` - хранение hash bearer-токенов и сроков жизни сессий.
- `backend/src/repo/trainingRepo.js` - попытки и история результатов.
- `backend/src/server.js` - совместимый wrapper для регистрации result routes; основной запуск идет через `index.js`.

Важные ограничения backend:

- Пользовательские данные хранятся в PostgreSQL, а не в JSON-файлах репозитория.
- Новые пароли хешируются bcrypt. SHA-256 нужен только для совместимости со старыми импортированными пользователями.
- Сессии хранятся как SHA-256 hash токена в PostgreSQL и имеют TTL.
- Метрики результата считаются на backend по сохраненной попытке; не доверяй WPM с клиента.
- Завершение попытки, запись результата и обновление пользователя выполняются транзакционно.
- Перед изменением схемы обновляй `backend/src/db/migrate.js`, репозиторий и README.
- `serializeUser` не должен отдавать `passwordHash`.

## Архитектура frontend

- `frontend/app/pages/index.vue` - главный экран: гость видит auth + pitch, авторизованный пользователь видит профиль + тренажер.
- `frontend/app/composables/useAuth.ts` - состояние авторизации, формы регистрации/логина, `localStorage`, запросы `/auth/register`, `/auth/login`, `/me`.
- `frontend/app/composables/useTrainer.ts` - состояние попытки, локальный live-preview метрик и запросы `/attempts`, `/results`; итоговые метрики возвращает backend.
- `frontend/app/composables/useAiCoach.ts` - загрузка персонального задания `/ai/coach` для профиля.
- `frontend/app/composables/useProgress.ts` - история, графики, достижения и серия.
- `frontend/app/types/auth.ts`, `frontend/app/types/trainer.ts`, `frontend/app/types/coach.ts` - контракты данных между UI и API.
- `frontend/app/types/progress.ts` - контракт аналитики и истории.
- `frontend/app/components/auth` - форма авторизации.
- `frontend/app/components/profile` - профиль, настройки, таблицы/рейтинги клана.
- `frontend/app/components/trainer` - UI тренажера, поверхность печати, статистика, экран результата.
- `frontend/app/components/ui` - базовые переиспользуемые UI-компоненты.
- `frontend/app/assets/css/main.css` - глобальные стили, Tailwind layers, transition classes.

## API-контракты

Все маршруты начинаются с `/api`.

- `GET /health` -> `{ ok, service }`.
- `GET /lesson?level=beginner|intermediate|advanced` -> `{ id, level, levelLabel, text }`.
- `POST /auth/register` body: `login`, `password`, `nickname`, `emoji`, `avatarUrl`; ответ: `{ token, user }`.
- `POST /auth/login` body: `login`, `password`; ответ: `{ token, user }`.
- `GET /me` с `Authorization: Bearer <token>` -> `{ user }`.
- `GET /clans` -> `{ clans: [{ emoji, members, points }] }`, где `points` - сумма очков участников.
- `GET /clans/:emoji` -> `{ emoji, members }`, участники сортируются по очкам внутри клана.
- `GET /ai/coach` с Bearer token -> `{ coach }`.
- `POST /attempts` с Bearer token, body: `difficulty`, опционально `targetText` -> `{ attemptId, lesson }`.
- `POST /attempts/:attemptId/start` с Bearer token -> `{ startedAt }`.
- `POST /results` с Bearer token, body: `attemptId`, `typedText`; ответ: `{ user, result, tasks, coach }`.
- `GET /progress` с Bearer token -> `{ summary, history }`.
- `PATCH /me`, `DELETE /me`, `POST /auth/logout` управляют профилем и сессией.

Если меняешь поля API, синхронно обновляй:

- backend controller/service;
- frontend composable;
- соответствующий type в `frontend/app/types`;
- README, если меняется внешний контракт.

## Правила правок

- Не трогай `frontend/.nuxt`, `frontend/.output`, `node_modules` и другие сгенерированные каталоги.
- Учитывай, что рабочее дерево может быть грязным. Не откатывай чужие изменения.
- Не добавляй файловое хранилище пользователей обратно: основной источник данных - PostgreSQL.
- Перед крупными изменениями сначала прочитай ближайшие composable/controller/type файлы, а не только компонент.
- Для UI держись существующего стиля: Tailwind + `tailwind-variants`, Vue `<script setup lang="ts">`, русские тексты интерфейса.
- Для backend держись ES modules, Express controllers, `userService`, PostgreSQL repo-слоя и миграции в `backend/src/db/migrate.js`.
- Не добавляй JWT, ORM, Pinia, UI-kit или новый state manager без отдельного решения.
- Не вызывай OpenAI API с frontend. Ключи и prompt AI-тренера должны оставаться на backend.

## Что читать первым

1. `README.md`
2. `AGENTS.md`
3. `backend/src/app.js`
4. `backend/src/db/migrate.js`
5. `backend/src/repo/usersRepo.js`
6. `backend/src/controllers/*.js`
7. `backend/src/services/userService.js`
8. `frontend/app/pages/index.vue`
9. `frontend/app/composables/useAuth.ts`
10. `frontend/app/composables/useTrainer.ts`
11. `frontend/app/composables/useAiCoach.ts`
12. `frontend/app/types/auth.ts`
13. `frontend/app/types/trainer.ts`
14. `frontend/app/types/coach.ts`

## Частые сценарии

Добавить поле пользователя:

- обновить схему в `backend/src/db/migrate.js`;
- обновить создание/чтение пользователя в `usersRepo.js`;
- обновить создание пользователя в `authController.js`, если поле приходит из формы;
- обновить `serializeUser` в `userService.js`;
- обновить `UserProfile`/формы в `frontend/app/types/auth.ts`;
- обновить нужные компоненты профиля или авторизации.

Добавить метрику тренировки:

- обновить `TrainerStats` в `frontend/app/types/trainer.ts`;
- обновить расчет в `useTrainer.ts`;
- обновить отображение в `components/trainer`;
- если метрика сохраняется, обновить `resultsController.js` и README API.

Добавить задачу или изменить очки:

- обновить `backend/src/services/tasksService.js`;
- проверить, что `serializeUser` продолжает отдавать актуальные `tasks` и `stats.points`;
- если меняется форма задачи, обновить `UserTask` в `frontend/app/types/auth.ts`;
- обновить `ProfileTasks.vue`, если задача требует нового отображения.

Добавить backend route:

- создать или расширить controller в `backend/src/controllers`;
- зарегистрировать его в `backend/src/app.js`;
- если route нужен frontend, добавить вызов в composable, а не напрямую раскидывать `$fetch` по компонентам.
