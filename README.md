# Keyboard Trainer / Diplom

Черновой старт для ВКР:

- `frontend` - Nuxt 4 интерфейс клавиатурного тренажера
- `backend` - простой Node.js API на Express

## Что уже есть

- регистрация и вход по логину и паролю
- никнейм, эмоджи-клан и аватар пользователя
- простое хранение пользователей в `backend/data/users.json`
- профиль после входа и стартовый экран тренажера

## Запуск

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend по умолчанию ожидает backend на `http://localhost:4001/api`.
