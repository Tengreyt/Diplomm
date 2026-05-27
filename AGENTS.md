# AGENTS.md

Инструкции для ИИ-агентов и новых участников проекта. README остается входной точкой для человека и содержит общую карту проекта. Этот файл не дублирует дерево папок, а фиксирует архитектуру, правила правок и порядок чтения файлов для работы с кодом.

## Назначение проекта

Это учебный full-stack веб-тренажер печати для ВКР. Пользователь регистрируется или входит, выбирает профиль/клан, проходит тренировку, а результат сохраняется в профиль.

## Стек

- Frontend: Nuxt 4, Vue 3, TypeScript, Tailwind CSS, `tailwind-variants`.
- Backend: Node.js, Express, ES modules.
- Хранилище: JSON-файл `backend/data/users.json`.
- Авторизация: Bearer-токены в памяти backend-процесса (`Map`) + токен в `localStorage` на клиенте.

## Быстрый запуск

Backend:

```bash
cd backend
npm install
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
- `backend/src/app.js` - создает Express-приложение, подключает middleware, in-memory sessions, публичные `/api/health`, `/api/lesson`, защищенный `/api/me`, регистрирует контроллеры.
- `backend/src/controllers/authController.js` - `/api/auth/register`, `/api/auth/login`.
- `backend/src/controllers/resultsController.js` - `/api/results`, обновляет статистику и `lastResult`.
- `backend/src/controllers/clansController.js` - `/api/clans`, `/api/clans/:emoji`.
- `backend/src/services/userService.js` - сериализация пользователя, SHA-256 хеш пароля, расчет очков клана, avatar presets.
- `backend/src/repo/usersRepo.js` - чтение/запись `backend/data/users.json`.
- `backend/src/server.js` - совместимый wrapper для регистрации result routes; основной запуск идет через `index.js`.

Важные ограничения backend:

- `users.json` пишется целиком и синхронно, без блокировок и миграций.
- Сессии живут только в памяти процесса и пропадают после перезапуска.
- Пароли хешируются SHA-256 без соли; это учебная реализация, не production security.
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
- Не редактируй `backend/data/users.json` без явной причины: это рабочее файловое хранилище с пользовательскими данными.
- Перед крупными изменениями сначала прочитай ближайшие composable/controller/type файлы, а не только компонент.
- Для UI держись существующего стиля: Tailwind + `tailwind-variants`, Vue `<script setup lang="ts">`, русские тексты интерфейса.
- Для backend держись ES modules, Express controllers и `userService`/`usersRepo` вместо новой инфраструктуры.
- Не добавляй базу данных, JWT, Pinia, UI-kit или новый state manager без отдельного решения.

## Что читать первым

1. `README.md`
2. `AGENTS.md`
3. `backend/src/app.js`
4. `backend/src/controllers/*.js`
5. `backend/src/services/userService.js`
6. `frontend/app/pages/index.vue`
7. `frontend/app/composables/useAuth.ts`
8. `frontend/app/composables/useTrainer.ts`
9. `frontend/app/types/auth.ts`
10. `frontend/app/types/trainer.ts`

## Частые сценарии

Добавить поле пользователя:

- обновить создание пользователя в `authController.js`;
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
