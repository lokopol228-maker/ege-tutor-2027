"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ModeId } from "@/lib/subjects";
import { MODES } from "@/lib/subjects";

type ChatMessage = {
  id: string;
  role: string;
  content: string;
  mode: string;
};

export function TutorChat({
  subject,
  opening,
}: {
  subject: string;
  opening: string;
}) {
  const [mode, setMode] = useState<ModeId>("topic");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch(`/api/chat?subject=${subject}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!cancelled) {
        setMessages(data.messages ?? []);
        setBooted(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [subject]);

  const viewMessages = useMemo(() => {
    if (!booted) return [];
    if (messages.length === 0) {
      return [
        {
          id: "opening",
          role: "assistant",
          content: opening,
          mode,
        },
      ];
    }
    return messages;
  }, [booted, messages, opening, mode]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        role: "user",
        content: text,
        mode,
      },
    ]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, mode, message: text }),
    });

    setLoading(false);

    if (!res.ok) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Сбой ответа сервера. Попробуй ещё раз через минуту.",
          mode,
        },
      ]);
      return;
    }

    const data = await res.json();
    setMessages((prev) => [...prev, data.reply]);
  }

  async function clearChat() {
    await fetch(`/api/chat?subject=${subject}`, { method: "DELETE" });
    setMessages([]);
  }

  return (
    <div className="tutor-shell">
      <div className="mode-row">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={mode === item.id ? "mode-chip active" : "mode-chip"}
            onClick={() => setMode(item.id)}
            title={item.hint}
          >
            {item.title}
          </button>
        ))}
        <button type="button" className="ghost-btn" onClick={clearChat}>
          Очистить диалог
        </button>
      </div>

      <div className="chat-window">
        {viewMessages.map((msg) => (
          <article
            key={msg.id}
            className={msg.role === "user" ? "bubble user" : "bubble assistant"}
          >
            <header>{msg.role === "user" ? "Ты" : "Репетитор"}</header>
            <div className="bubble-body">{msg.content}</div>
          </article>
        ))}
        {loading ? <p className="typing">Репетитор думает…</p> : null}
      </div>

      <form className="composer" onSubmit={onSubmit}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Напиши ответ, вопрос или вставь работу на проверку…"
          rows={3}
          required
        />
        <button type="submit" className="primary-btn" disabled={loading}>
          Отправить
        </button>
      </form>
    </div>
  );
}
