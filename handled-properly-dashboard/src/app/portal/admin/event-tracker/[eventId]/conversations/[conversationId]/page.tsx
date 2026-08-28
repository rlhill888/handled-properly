import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import ChatView, { type ChatMessage } from "@/components/portal/ChatView";
import styles from "@/styles/admin-shared.module.css";

export default async function AdminConversationPage({
  params,
}: {
  params: Promise<{ eventId: string; conversationId: string }>;
}) {
  const { eventId, conversationId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, conversation_participants(event_staff(id, contacts(name)))")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation) notFound();

  const { data: messageRows } = await supabase
    .from("messages")
    .select("id, body, created_at, sender_admin_id, event_staff(id, contacts(name))")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const participantNames: Record<string, string> = {};
  for (const p of conversation.conversation_participants) {
    if (p.event_staff?.contacts) participantNames[p.event_staff.id] = p.event_staff.contacts.name;
  }

  const initialMessages: ChatMessage[] = (messageRows ?? []).map((row) => ({
    id: row.id,
    body: row.body,
    isAdmin: Boolean(row.sender_admin_id),
    senderName: row.sender_admin_id ? "Admin" : row.event_staff?.contacts?.name ?? "Staff",
    createdAt: row.created_at,
  }));

  return (
    <div className={styles.page}>
      <Link href={`/portal/admin/event-tracker/${eventId}/conversations`} className={styles.backLink} aria-label="Back to Conversations">
        ←
      </Link>

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin · Conversation</span>
          <h1 className={styles.title}>
            {Object.values(participantNames).join(", ") || "Conversation"}
          </h1>
        </div>
      </div>

      <div className={styles.card}>
        <ChatView
          conversationId={conversationId}
          basePath={`/portal/admin/event-tracker/${eventId}/conversations/${conversationId}`}
          initialMessages={initialMessages}
          participantNames={participantNames}
        />
      </div>
    </div>
  );
}
