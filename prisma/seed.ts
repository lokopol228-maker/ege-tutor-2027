import { PrismaClient, Subject, Mastery } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const subjects: Subject[] = ["MATH", "RUSSIAN", "INF", "ESSAY"];

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Ученик";

  if (!email || !password) {
    throw new Error("Задай ADMIN_EMAIL и ADMIN_PASSWORD в переменных окружения.");
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD должен быть не короче 8 символов.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash, name },
    create: {
      email: email.toLowerCase(),
      passwordHash,
      name,
    },
  });

  for (const subject of subjects) {
    await prisma.progress.upsert({
      where: {
        userId_subject: { userId: user.id, subject },
      },
      update: {},
      create: {
        userId: user.id,
        subject,
        score: 35,
        status: Mastery.GAP,
        focusTask: "Диагностика уровня",
      },
    });
  }

  console.log(`Готово: пользователь ${user.email} и прогресс по 4 предметам.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
