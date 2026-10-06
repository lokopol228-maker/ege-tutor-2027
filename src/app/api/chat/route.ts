import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTutorReply } from "@/lib/llm";
import { isSubject, MODES, type ModeId } from "@/lib/subjects";

const bodySchema = z.object({
  subject: z.string(),
  mode: z.string(),
  message: z.string().min(1).max(8000),
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject") ?? "";
  if (!isSubject(subject)) {
    return NextResponse.json({ error: "Bad subject" }, { status: 400 });
  }

  const messages = await prisma.message.findMany({
    where: { userId: session.user.id, subject },
    orderBy: { createdAt: "asc" },
    take: 80,
  });

  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { subject, mode, message } = parsed.data;
  const modeId = mode as ModeId;
  if (!isSubject(subject) || !MODES.some((m) => m.id === modeId)) {
    return NextResponse.json({ error: "Bad subject/mode" }, { status: 400 });
  }

  await prisma.message.create({
    data: {
      userId: session.user.id,
      subject,
      mode: modeId,
      role: "user",
      content: message,
    },
  });

  const history = await prisma.message.findMany({
    where: { userId: session.user.id, subject },
    orderBy: { createdAt: "asc" },
    take: 40,
  });

  let text: string;
  let provider = "offline";

  try {
    const result = await generateTutorReply({
      subject,
      mode: modeId,
      history: history.map((item) => ({
        role: item.role as "user" | "assistant",
        content: item.content,
      })),
    });
    text = result.text;
    provider = result.provider;
  } catch (error) {
    console.error(error);
    text =
      "Сбой бесплатного ИИ-провайдера. Переключаюсь на офлайн-шаг: напиши короткий ответ на текущее задание (1–3 предложения) — продолжим без оплаты.";
    provider = "offline-fallback";
  }

  const reply = await prisma.message.create({
    data: {
      userId: session.user.id,
      subject,
      mode: modeId,
      role: "assistant",
      content: text,
    },
  });

  const current =
    (
      await prisma.progress.findUnique({
        where: {
          userId_subject: { userId: session.user.id, subject },
        },
      })
    )?.score ?? 35;

  const scoreBump = Math.min(100, current + 1);

  await prisma.progress.update({
    where: {
      userId_subject: { userId: session.user.id, subject },
    },
    data: {
      score: scoreBump,
      status: scoreBump >= 75 ? "EXCELLENT" : scoreBump >= 50 ? "PRACTICE" : "GAP",
      focusTask: `Режим: ${modeId} · ${provider}`,
    },
  });

  return NextResponse.json({ reply, provider });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject") ?? "";
  if (!isSubject(subject)) {
    return NextResponse.json({ error: "Bad subject" }, { status: 400 });
  }

  await prisma.message.deleteMany({
    where: { userId: session.user.id, subject },
  });

  return NextResponse.json({ ok: true });
}
