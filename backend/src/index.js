import cors from "cors";
import express from "express";

const app = express();
const port = process.env.PORT || 4001;

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

app.use(cors());
app.use(express.json());

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

app.listen(port, () => {
  console.log(`Backend started on http://localhost:${port}`);
});
