import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/styles/admin-shared.module.css";

export default async function EmailSendDetailPage({
  params,
}: {
  params: Promise<{ emailSendId: string }>;
}) {
  const { emailSendId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: emailSend } = await supabase
    .from("email_sends")
    .select("id, subject, body_html, sent_at, email_recipients(contacts(id, name, email))")
    .eq("id", emailSendId)
    .maybeSingle();

  if (!emailSend) notFound();

  const recipients = emailSend.email_recipients
    .map((r) => r.contacts)
    .filter((c): c is { id: string; name: string; email: string } => c !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={styles.page}>
      <Link
        href="/portal/admin/communication"
        className={styles.backLink}
        aria-label="Back to Communication"
      >
        ←
      </Link>

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin · Mass Email</span>
          <h1 className={styles.title}>{emailSend.subject}</h1>
          <p className={styles.description}>
            Sent {new Date(emailSend.sent_at).toLocaleString()} to {recipients.length} recipient
            {recipients.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Content</h2>
        {/* Admin-authored via the mass-email compose editor (ComposeForm's
            richBody), not user-submitted — safe to render directly, same
            trust boundary as the editor that produced it. */}
        <div className={styles.richBody} dangerouslySetInnerHTML={{ __html: emailSend.body_html }} />
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Recipients ({recipients.length})</h2>
        {recipients.length === 0 ? (
          <p className={styles.emptyState}>No recipients recorded.</p>
        ) : (
          <table className={`${styles.table} ${styles.cardRows}`}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((contact) => (
                <tr key={contact.id}>
                  <td data-label="Name" className={styles.cardPrimaryCell}>
                    {contact.name}
                  </td>
                  <td data-label="Email">{contact.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
