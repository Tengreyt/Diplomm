# Keyboard Trainer / Diplom

Проект ВКР: веб-тренажер печати с авторизацией, профилем пользователя и сохранением результатов.

Стек:
- `frontend` - Nuxt 4 + Vue 3 + Tailwind
- `backend` - Node.js + Express
- хранилище - файл `backend/data/users.json`

## Быстрый старт

### 1) Backend

```bash
cd backend
npm install
npm run dev
```

Запуск в dev: `node --watch src/index.js`  
По умолчанию API доступен на `http://localhost:4001/api`.

### 2) Frontend

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

### Frontend
- `NUXT_PUBLIC_API_BASE` - базовый URL API  
  По умолчанию: `http://localhost:4001/api`

## Карта проекта

```text
.
├── backend/
│   ├── src/
│   │   ├── index.js          # entrypoint backend, auth/lesson/profile/clans
│   │   └── server.js         # маршрут сохранения результатов /api/results
│   ├── data/
│   │   └── users.json        # файловое хранилище пользователей
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── app.vue
│   │   ├── pages/
│   │   │   └── index.vue     # главный экран, связывает auth/profile/trainer
│   │   ├── composables/
│   │   │   ├── useAuth.ts    # auth state + API (register/login/me)
│   │   │   └── useTrainer.ts # логика тренажера + API (lesson/results)
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
└── README.md
```

## API (кратко)

Все маршруты начинаются с `/api`.

### Сервисные
- `GET /health` - проверка доступности backend
- `GET /lesson` - получить случайный тренировочный текст

### Авторизация и профиль
- `POST /auth/register` - регистрация  
  body: `login`, `password`, `nickname`, `emoji`, `avatarUrl`
- `POST /auth/login` - вход  
  body: `login`, `password`
- `GET /me` - текущий пользователь (требует `Authorization: Bearer <token>`)
- `GET /clans/:emoji` - участники клана по эмоджи

### Результаты тренировки
- `POST /results` - сохранить результат (требует Bearer токен)  
  body: `wpm`, `accuracy`, `errors`, `seconds`

## Архитектура и поток данных

1. Пользователь регистрируется/логинится через `useAuth.ts`.
2. Токен сохраняется в `localStorage`, состояние пользователя - в `useState`.
3. После входа `useTrainer.ts` запрашивает урок через `/lesson`.
4. Во время печати считаются метрики (accuracy/WPM/errors/time).
5. После завершения отправляется результат в `/results`.
6. Backend обновляет `stats` пользователя и сохраняет в `users.json`.

## Ограничения текущей реализации

- Хранилище - JSON-файл, без БД и миграций.
- Сессии хранятся в памяти процесса backend (`Map`), после перезапуска недействительны.
- Пароли хешируются через SHA-256 (без соли), решение учебное, не production-ready.
- Тестов и CI в репозитории сейчас нет.

## Для ИИ и новых участников (экономия токенов)

### Что читать в первую очередь
1. `README.md` (этот файл)
2. `backend/src/index.js`
3. `backend/src/server.js`
4. `frontend/app/pages/index.vue`
5. `frontend/app/composables/useAuth.ts`
6. `frontend/app/composables/useTrainer.ts`
7. `frontend/app/types/auth.ts` и `frontend/app/types/trainer.ts`

### Что обычно не нужно читать для задач по логике
- `frontend/.nuxt/**` (генерируется Nuxt)
- `frontend/.output/**` (build output)
- `frontend/node_modules/**`

### Перед любыми правками
- Проверить, что backend и frontend запускаются локально.
- Учитывать, что рабочее дерево может быть грязным (есть незакоммиченные изменения).
- Не менять сгенерированные каталоги (`.nuxt`, `.output`) вручную.
