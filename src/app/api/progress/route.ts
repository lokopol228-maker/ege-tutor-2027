import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSubject } from "@/lib/subjects";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const progresses = await prisma.progress.findMany({
    where: { userId: session.user.id },
    orderBy: { subject: "asc" },
  });

  return NextResponse.json({ progresses });
}

const patchSchema = z.object({
  subject: z.string(),
  score: z.number().int().min(0).max(100).optional(),
  status: z.enum(["EXCELLENT", "PRACTICE", "GAP"]).optional(),
  focusTask: z.string().max(200).optional(),
});

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success || !isSubject(parsed.data.subject)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { subject, ...data } = parsed.data;

  const progress = await prisma.progress.update({
    where: {
      userId_subject: { userId: session.user.id, subject },
    },
    data,
  });

  return NextResponse.json({ progress });
}
