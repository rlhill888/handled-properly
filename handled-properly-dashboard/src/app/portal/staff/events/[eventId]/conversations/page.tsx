import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import NewConversationForm from "@/components/portal/NewConversationForm";
import styles from "@/styles/admin-shared.module.css";

export default async function StaffEventConversationsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, name, staff_can_start_conversations")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) notFound();

  const [{ data: rosterRows }, { data: conversations }] = await Promise.all([
    supabase
      .from("roster_entries")
      .select("event_staff(id, contacts(name))")
      .eq("event_id", eventId),
    // RLS (staff_select_own_conversations) scopes this to conversations
    // this staff member is actually a participant of.
    supabase
      .from("conversations")
      .select("id, created_at, conversation_participants(event_staff(contacts(name)))")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false }),
  ]);

  const rosterStaff = (rosterRows ?? [])
    .filter((r) => r.event_staff?.contacts)
    .map((r) => ({ id: r.event_staff!.id, name: r.event_staff!.contacts!.name }));

  return (
    <div className={styles.page}>
      <Link href={`/portal/staff/events/${eventId}`} className={styles.backLink} aria-label={`Back to ${event.name}`}>
        ←
      </Link>

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Event Staff · Conversations</span>
          <h1 className={styles.title}>{event.name}</h1>
        </div>
      </div>

      {event.staff_can_start_conversations ? (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Start Conversation</h2>
          <NewConversationForm
            eventId={eventId}
            basePath={`/portal/staff/events/${eventId}/conversations`}
            rosterStaff={rosterStaff}
          />
        </div>
      ) : (
        <p className={styles.description}>
          Only the admin can start new conversations for this event. You can still participate in
          any you're added to below.
        </p>
      )}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Your Conversations ({conversations?.length ?? 0})</h2>
        {!conversations || conversations.length === 0 ? (
          <p className={styles.emptyState}>You're not part of any conversations for this event yet.</p>
        ) : (
          <table className={`${styles.table} ${styles.cardRows}`}>
            <thead>
              <tr>
                <th>Participants</th>
                <th>Started</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((conversation) => (
                <tr key={conversation.id}>
                  <td data-label="Participants" className={styles.cardPrimaryCell}>
                    {conversation.conversation_participants
                      .map((p) => p.event_staff?.contacts?.name)
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </td>
                  <td data-label="Started">{new Date(conversation.created_at).toLocaleString()}</td>
                  <td className={styles.cardActionCell}>
                    <Link
                      href={`/portal/staff/events/${eventId}/conversations/${conversation.id}`}
                      className={styles.link}
                    >
                      Open
                    </Link>
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
