"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/lib/actions/conversations";
import styles from "@/styles/admin-shared.module.css";
import chatStyles from "./ChatView.module.css";

export type ChatMessage = {
  id: string;
  body: string;
  senderName: string;
  isAdmin: boolean;
  createdAt: string;
};

export default function ChatView({
  conversationId,
  basePath,
  initialMessages,
  participantNames,
}: {
  conversationId: string;
  basePath: string;
  initialMessages: ChatMessage[];
  participantNames: Record<string, string>;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef(new Set(initialMessages.map((m) => m.id)));

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            body: string;
            sender_admin_id: string | null;
            sender_event_staff_id: string | null;
            created_at: string;
          };

          if (seenIds.current.has(row.id)) return;
          seenIds.current.add(row.id);

          const isAdmin = Boolean(row.sender_admin_id);
          const senderName = isAdmin
            ? "Admin"
            : participantNames[row.sender_event_staff_id ?? ""] ?? "Staff";

          setMessages((current) => [
            ...current,
            { id: row.id, body: row.body, senderName, isAdmin, createdAt: row.created_at },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, participantNames]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    setError(null);
    const result = await sendMessage(conversationId, basePath, draft);
    setSending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setDraft("");
  };

  return (
    <div className={chatStyles.chat}>
      <div className={chatStyles.messageList}>
        {messages.length === 0 && <p className={styles.emptyState}>No messages yet.</p>}
        {messages.map((message) => (
          <div key={message.id} className={chatStyles.message}>
            <div className={chatStyles.messageMeta}>
              <span className={message.isAdmin ? styles.badge : styles.badgeMuted}>
                {message.senderName}
              </span>
              <span className={chatStyles.messageTime}>
                {new Date(message.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <p className={chatStyles.messageBody}>{message.body}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <form onSubmit={handleSend} className={chatStyles.composer}>
        <input
          className={styles.input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          disabled={sending}
        />
        <button type="submit" className={styles.primaryButton} disabled={sending || !draft.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
