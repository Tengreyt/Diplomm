# AGENTS.md

Инструкции для ИИ-агентов и новых участников проекта. README остается входной точкой для человека и содержит общую карту проекта. Этот файл не дублирует дерево папок, а фиксирует архитектуру, правила правок и порядок чтения файлов для работы с кодом.

## Назначение проекта

Это учебный full-stack веб-тренажер печати для ВКР. Пользователь регистрируется или входит, выбирает профиль/клан, проходит тренировку, а результат сохраняется в профиль.

## Стек

- Frontend: Nuxt 4, Vue 3, TypeScript, Tailwind CSS, `tailwind-variants`.
- Backend: Node.js, Express, ES modules.
- Хранилище: PostgreSQL через `pg`.
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

У backend сейчас нет тестового скрипта. Если меняешь API, минимум проверь запуск backend и ручной сценарий регистрации/логина/сохранения результата.

## Архитектура backend

- `backend/src/index.js` - точка запуска, импортирует `app` и слушает порт.
- `backend/src/app.js` - создает Express-приложение, подключает middleware/CORS, публичные `/api/health`, `/api/lesson`, защищенный `/api/me`, регистрирует контроллеры.
- `backend/src/db/pool.js` - PostgreSQL pool, `DATABASE_URL`, SSL-настройка.
- `backend/src/db/migrate.js` - SQL-схема `users` и `sessions`.
- `backend/src/controllers/authController.js` - `/api/auth/register`, `/api/auth/login`.
- `backend/src/controllers/resultsController.js` - `/api/results`, обновляет статистику и `lastResult`.
- `backend/src/controllers/clansController.js` - `/api/clans`, `/api/clans/:emoji`.
- `backend/src/services/userService.js` - сериализация пользователя, bcrypt/SHA-256 legacy-проверка пароля, расчет очков клана, avatar presets.
- `backend/src/repo/usersRepo.js` - PostgreSQL-запросы пользователей, статистики, кланов.
- `backend/src/repo/sessionsRepo.js` - хранение hash bearer-токенов и сроков жизни сессий.
- `backend/src/server.js` - совместимый wrapper для регистрации result routes; основной запуск идет через `index.js`.

Важные ограничения backend:

- Пользовательские данные хранятся в PostgreSQL, а не в JSON-файлах репозитория.
- Новые пароли хешируются bcrypt. SHA-256 нужен только для совместимости со старыми импортированными пользователями.
- Сессии хранятся как SHA-256 hash токена в PostgreSQL и имеют TTL.
- Перед изменением схемы обновляй `backend/src/db/migrate.js`, репозиторий и README.
- `serializeUser` не должен отдавать `passwordHash`.

## Архитектура frontend

- `frontend/app/pages/index.vue` - главный экран: гость видит auth + pitch, авторизованный пользователь видит профиль + тренажер.
- `frontend/app/composables/useAuth.ts` - состояние авторизации, формы регистрации/логина, `localStorage`, запросы `/auth/register`, `/auth/login`, `/me`.
- `frontend/app/composables/useTrainer.ts` - состояние урока, выбранная сложность, таймер, расчет WPM/accuracy/errors, запросы `/lesson`, `/results`.
- `frontend/app/types/auth.ts` и `frontend/app/types/trainer.ts` - контракты данных между UI и API.
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
- `POST /results` с Bearer token, body: `wpm`, `accuracy`, `errors`, `seconds`; ответ: `{ user, result, tasks }`.

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
11. `frontend/app/types/auth.ts`
12. `frontend/app/types/trainer.ts`

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
