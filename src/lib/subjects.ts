import type { Mastery, Subject } from "@prisma/client";

export type SubjectKey = Subject;

export const SUBJECTS: Record<
  SubjectKey,
  { title: string; short: string; goal: string; color: string }
> = {
  MATH: {
    title: "Профильная математика",
    short: "Математика",
    goal: "80+",
    color: "#1f6f5b",
  },
  RUSSIAN: {
    title: "Русский язык",
    short: "Русский",
    goal: "90+",
    color: "#8b3a2b",
  },
  INF: {
    title: "Информатика",
    short: "Информатика",
    goal: "90+",
    color: "#245b8b",
  },
  ESSAY: {
    title: "Итоговое сочинение",
    short: "Сочинение",
    goal: "допуск",
    color: "#6b4f2a",
  },
};

export const MODES = [
  {
    id: "topic",
    title: "Разбор темы с нуля",
    hint: "закрываем пробел шаг за шагом",
  },
  {
    id: "practice",
    title: "Практика задания ЕГЭ",
    hint: "конкретный номер / тип",
  },
  {
    id: "review",
    title: "Проверка работы",
    hint: "ДЗ, сочинение или код",
  },
  {
    id: "blitz",
    title: "Имитация экзамена",
    hint: "блиц без подсказок сразу",
  },
] as const;

export type ModeId = (typeof MODES)[number]["id"];

export function masteryLabel(status: Mastery): string {
  switch (status) {
    case "EXCELLENT":
      return "Отлично";
    case "PRACTICE":
      return "Нужна практика";
    case "GAP":
      return "Пробел";
  }
}

export function masteryEmoji(status: Mastery): string {
  switch (status) {
    case "EXCELLENT":
      return "🟩";
    case "PRACTICE":
      return "🟨";
    case "GAP":
      return "🟥";
  }
}

export function isSubject(value: string): value is SubjectKey {
  return value in SUBJECTS;
}
