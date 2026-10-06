import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";
import { TutorChat } from "@/components/TutorChat";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  SUBJECTS,
  isSubject,
  masteryEmoji,
  masteryLabel,
  type SubjectKey,
} from "@/lib/subjects";
import { openingMessage } from "@/lib/tutor";

const slugMap: Record<string, SubjectKey> = {
  math: "MATH",
  russian: "RUSSIAN",
  inf: "INF",
  essay: "ESSAY",
  MATH: "MATH",
  RUSSIAN: "RUSSIAN",
  INF: "INF",
  ESSAY: "ESSAY",
};

export default async function TutorPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { subject: raw } = await params;
  const subject = slugMap[raw] ?? raw.toUpperCase();
  if (!isSubject(subject)) {
    notFound();
  }

  const meta = SUBJECTS[subject];
  const progress = await prisma.progress.findUnique({
    where: {
      userId_subject: { userId: session.user.id, subject },
    },
  });

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <p className="eyebrow">
            <Link href="/dashboard">← Кабинет</Link>
          </p>
          <h1 className="hero-brand">{meta.short}</h1>
          <p className="lead">
            Цель {meta.goal}. Сейчас: {masteryEmoji(progress?.status ?? "GAP")}{" "}
            {masteryLabel(progress?.status ?? "GAP")} · {progress?.score ?? 0}/100
          </p>
        </div>
        <SignOutButton />
      </header>

      <TutorChat subject={subject} opening={openingMessage(subject, "topic")} />
    </main>
  );
}
