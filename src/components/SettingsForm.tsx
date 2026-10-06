"use client";

import { FormEvent, useEffect, useState } from "react";

export function SettingsForm() {
  const [provider, setProvider] = useState("groq");
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setProvider(data.provider || "groq");
        setHasKey(Boolean(data.hasKey));
        setPreview(data.keyPreview || null);
      })
      .catch(() => setStatus("Не удалось загрузить настройки."));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        apiKey: apiKey.trim() ? apiKey.trim() : undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setStatus("Ошибка сохранения.");
      return;
    }

    setApiKey("");
    setStatus("Сохранено. Можно идти учиться.");
    const fresh = await fetch("/api/settings").then((r) => r.json());
    setHasKey(Boolean(fresh.hasKey));
    setPreview(fresh.keyPreview || null);
  }

  async function clearKey() {
    setLoading(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearKey: true }),
    });
    setLoading(false);
    setHasKey(false);
    setPreview(null);
    setStatus("Ключ удалён. Работает офлайн-репетитор.");
  }

  return (
    <form className="card login-panel" onSubmit={onSubmit}>
      <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>Ключ ИИ</h2>
      <p className="note">
        Вставляй ключ здесь на сайте. В GitHub и в пустые поля Gemini на Render —
        ничего не нужно.
      </p>

      <label>
        Провайдер
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          style={{
            width: "100%",
            padding: "0.8rem 0.9rem",
            borderRadius: 12,
            border: "1px solid var(--line)",
            background: "#fffdf8",
          }}
        >
          <option value="groq">Groq (бесплатно) — ключ gsk_...</option>
          <option value="openrouter">OpenRouter (есть free-модели)</option>
          <option value="openai">OpenAI (платно)</option>
        </select>
      </label>

      <label>
        API-ключ
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={hasKey ? "Ключ уже сохранён — вставь новый, чтобы заменить" : "Вставь ключ сюда"}
          autoComplete="off"
        />
      </label>

      <p className="note">
        Сейчас: {hasKey ? `ключ есть (${preview})` : "ключа нет → офлайн-репетитор"}
      </p>

      {status ? <p className="note">{status}</p> : null}

      <button type="submit" className="primary-btn" disabled={loading}>
        {loading ? "Сохраняю…" : "Сохранить"}
      </button>
      {hasKey ? (
        <button type="button" className="ghost-btn" onClick={clearKey} disabled={loading}>
          Удалить ключ
        </button>
      ) : null}

      <div className="note">
        <p>
          <strong>Groq:</strong> https://console.groq.com → войти → API Keys
        </p>
        <p>
          Если Groq не открывается — учись без ключа (офлайн) или попробуй OpenRouter:
          https://openrouter.ai/keys
        </p>
      </div>
    </form>
  );
}
