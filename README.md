# Траектория 80+ (ЕГЭ-репетитор)

Приватный сайт подготовки к ЕГЭ-2027:

- логин и пароль (без публичной регистрации)
- 4 направления: профильная математика, русский, информатика, итоговое сочинение
- чат с репетитором (метод Сократа / scaffolding)
- сохранение диалогов и прогресса

Стек: Next.js + NextAuth + Prisma + PostgreSQL. Деплой: Render.

## 1) Что нужно заранее

1. Аккаунт [Render](https://render.com)
2. Репозиторий на GitHub/GitLab с этим кодом
3. (По желанию) бесплатный ключ **Google Gemini** — живой ИИ без оплаты
4. На своём ПК (по желанию): Node.js 22+ и Git

### Бесплатный стек
| Что | Как бесплатно |
|---|---|
| Хостинг сайта | Render Free |
| База данных | Render Postgres Free |
| ИИ-репетитор | Google Gemini Free **или** Groq Free |
| Без ключей вообще | Встроенный офлайн-репетитор (задания + проверка по шагам) |

OpenAI **не нужен**.

### Как получить бесплатный Gemini (рекомендую)
1. Зайди на https://aistudio.google.com/apikey
2. Создай API key (нужен Google-аккаунт)
3. В Render → Environment → `GEMINI_API_KEY` = ключ
4. `GEMINI_MODEL` = `gemini-2.0-flash` (уже в `render.yaml`)

Альтернатива: https://console.groq.com/keys → `GROQ_API_KEY`

## 2) Деплой на Render (Blueprint)

1. Залей проект в GitHub.
2. В Render: **New → Blueprint** → выбери репозиторий (`render.yaml` подхватится сам).
3. Заполни env (не оставляй пустыми):
   - `ADMIN_EMAIL` — твой логин
   - `ADMIN_PASSWORD` — пароль (от 8 символов)
   - `NEXTAUTH_URL` — URL сервиса, например `https://ege-tutor-2027.onrender.com`
   - `OPENAI_API_KEY` — ключ модели
4. Дождись билда. При старте сервис сам создаст таблицы и пользователя.
5. Открой сайт → войди email/паролем → кабинет → предмет.

## 3) Деплой вручную (без Blueprint)

1. **New → PostgreSQL** (Free)
2. **New → Web Service** из репозитория
3. Build: `npm install && npx prisma generate && npm run build`
4. Start: `npx prisma db push && npm run db:seed && npm start`
5. Env: как в `.env.example` + `DATABASE_URL` из Postgres

## 4) Локальный запуск

```bash
cp .env.example .env
# заполни DATABASE_URL (локальный Postgres) и остальные ключи
npm install
npm run db:setup
npm run dev
```

Открой http://localhost:3000

## 5) Безопасность

- Регистрации с сайта нет: доступ только у пользователя из `ADMIN_*`.
- Не коммить `.env`.
- Пароль хранится как bcrypt-хэш.
- На free-плане Render сервис может «засыпать»; первый заход бывает долгим.

## 6) Как пользоваться

1. Войти
2. Выбрать предмет на дашборде
3. Выбрать режим: тема / практика / проверка / блиц
4. Учиться диалогом; прогресс растёт после сообщений
