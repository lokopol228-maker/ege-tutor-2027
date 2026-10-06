import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/SettingsForm";
import { SignOutButton } from "@/components/SignOutButton";
import { authOptions } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <p className="eyebrow">
            <Link href="/dashboard">← Кабинет</Link>
          </p>
          <h1 className="hero-brand">Настройки</h1>
          <p className="lead">Сюда вставляется ключ ИИ. На Render для этого поле больше не нужно.</p>
        </div>
        <SignOutButton />
      </header>
      <SettingsForm />
    </main>
  );
}
