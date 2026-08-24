import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/styles/admin-shared.module.css";

export default async function StaffChatPage() {
  const supabase = await createSupabaseServerClient();

  // RLS (staff_select_own_conversations) already scopes this to
  // conversations the signed-in staff member participates in, across
  // every event they're rostered on — no extra filter needed.
  const { data: conversations } = await supabase
    .from("conversations")
    .select(
      "id, created_at, event:events(id, name), conversation_participants(event_staff(contacts(name)))"
    )
    .order("created_at", { ascending: false });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Event Staff</span>
          <h1 className={styles.title}>Chat</h1>
          <p className={styles.description}>Every conversation you're part of, across all events.</p>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Conversations ({conversations?.length ?? 0})</h2>
        {!conversations || conversations.length === 0 ? (
          <p className={styles.emptyState}>
            No conversations yet. Open an event to start or join one.
          </p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Event</th>
                <th>Participants</th>
                <th>Started</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((conversation) => (
                <tr key={conversation.id}>
                  <td>{conversation.event?.name ?? "—"}</td>
                  <td>
                    {conversation.conversation_participants
                      .map((p) => p.event_staff?.contacts?.name)
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </td>
                  <td>{new Date(conversation.created_at).toLocaleString()}</td>
                  <td>
                    {conversation.event && (
                      <Link
                        href={`/portal/staff/events/${conversation.event.id}/conversations/${conversation.id}`}
                        className={styles.link}
                      >
                        Open
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
