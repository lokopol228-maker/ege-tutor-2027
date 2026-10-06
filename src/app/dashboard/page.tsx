import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  SUBJECTS,
  masteryEmoji,
  masteryLabel,
  type SubjectKey,
} from "@/lib/subjects";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const progresses = await prisma.progress.findMany({
    where: { userId: session.user.id },
  });

  const bySubject = Object.fromEntries(
    progresses.map((item) => [item.subject, item]),
  ) as Partial<Record<SubjectKey, (typeof progresses)[number]>>;

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <p className="eyebrow">Кабинет ученика</p>
          <h1 className="hero-brand">Траектория 80+</h1>
          <p className="lead">
            Привет, {session.user.name || "ученик"}. Выбери предмет и продолжай
            траекторию. Прогресс сохраняется после каждого диалога.
          </p>
        </div>
        <SignOutButton />
      </header>

      <section className="grid-subjects">
        {(Object.keys(SUBJECTS) as SubjectKey[]).map((key) => {
          const meta = SUBJECTS[key];
          const progress = bySubject[key];
          const score = progress?.score ?? 0;
          const status = progress?.status ?? "GAP";

          return (
            <Link key={key} href={`/tutor/${key.toLowerCase()}`} className="card subject-card">
              <div className="meta-row">
                <span style={{ color: meta.color, fontWeight: 700 }}>Цель {meta.goal}</span>
                <span>
                  {masteryEmoji(status)} {masteryLabel(status)}
                </span>
              </div>
              <h2>{meta.title}</h2>
              <p className="note">Фокус: {progress?.focusTask || "ещё не начато"}</p>
              <div className="scorebar" aria-hidden>
                <span style={{ width: `${score}%` }} />
              </div>
              <div className="meta-row">
                <span>Ментальный балл</span>
                <strong>{score}/100</strong>
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
