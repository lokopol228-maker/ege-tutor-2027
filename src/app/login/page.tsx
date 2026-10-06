import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { authOptions } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="login-wrap">
      <section className="card login-panel">
        <p className="eyebrow">ЕГЭ 2027 · приватный кабинет</p>
        <h1 className="hero-brand">Траектория 80+</h1>
        <p className="lead">
          Математика, русский, информатика и итоговое сочинение — с репетитором,
          прогрессом и без публичной регистрации.
        </p>
        <LoginForm />
        <p className="note">
          Доступ только по логину и паролю. ИИ бесплатно:{" "}
          <code>GEMINI_API_KEY</code> (или офлайн-репетитор без ключей).
        </p>
      </section>
    </main>
  );
}
