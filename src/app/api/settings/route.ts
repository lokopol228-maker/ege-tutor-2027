import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { llmProvider: true, llmApiKey: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "session_stale",
          message: "Сессия устарела после деплоя. Выйди и войди снова.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      provider: user.llmProvider || "groq",
      hasKey: Boolean(user.llmApiKey),
      keyPreview: user.llmApiKey
        ? `${user.llmApiKey.slice(0, 6)}…${user.llmApiKey.slice(-4)}`
        : null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "db_error", message: "Ошибка базы. Сделай Redeploy на Render." },
      { status: 500 },
    );
  }
}

const bodySchema = z.object({
  provider: z.enum(["groq", "openrouter", "openai"]).optional(),
  apiKey: z.string().max(2000).optional(),
  clearKey: z.boolean().optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      {
        error: "session_stale",
        message: "Сессия устарела. Нажми «Выйти» и войди заново, потом сохрани ключ.",
      },
      { status: 409 },
    );
  }

  const data: { llmProvider?: string; llmApiKey?: string | null } = {};

  if (parsed.data.provider) {
    data.llmProvider = parsed.data.provider;
  }

  if (parsed.data.clearKey) {
    data.llmApiKey = null;
  } else if (typeof parsed.data.apiKey === "string") {
    const key = parsed.data.apiKey.trim();
    data.llmApiKey = key.length > 0 ? key : null;
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "save_failed",
        message: "Не удалось сохранить. Выйди/войди и попробуй ещё раз.",
      },
      { status: 500 },
    );
  }
}
