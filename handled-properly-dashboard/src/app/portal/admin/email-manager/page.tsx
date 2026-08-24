import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import ComposeForm from "./ComposeForm";
import styles from "@/styles/admin-shared.module.css";

export default async function EmailManagerPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: categories }, { data: contactCategories }, { data: contacts }, { data: sends }] =
    await Promise.all([
      supabase.from("categories").select("id, name").order("name", { ascending: true }),
      supabase.from("contact_categories").select("contact_id, category_id"),
      supabase.from("contacts").select("id"),
      supabase
        .from("email_sends")
        .select("id, subject, sent_at, email_recipients(count)")
        .order("sent_at", { ascending: false })
        .limit(20),
    ]);

  const contactPreviews = (contacts ?? []).map((c) => ({
    id: c.id,
    categoryIds: (contactCategories ?? [])
      .filter((cc) => cc.contact_id === c.id)
      .map((cc) => cc.category_id),
  }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin</span>
          <h1 className={styles.title}>Mass Email Manager</h1>
          <p className={styles.description}>
            Compose and send an email to your Contacts, filtered by category.
          </p>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Compose</h2>
        <ComposeForm categories={categories ?? []} contacts={contactPreviews} />
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Sent ({sends?.length ?? 0})</h2>
        {!sends || sends.length === 0 ? (
          <p className={styles.emptyState}>No sends yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Recipients</th>
                <th>Sent</th>
              </tr>
            </thead>
            <tbody>
              {sends.map((send) => (
                <tr key={send.id}>
                  <td>{send.subject}</td>
                  <td>{send.email_recipients?.[0]?.count ?? 0}</td>
                  <td>{new Date(send.sent_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
