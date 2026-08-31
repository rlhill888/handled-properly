import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/styles/admin-shared.module.css";

export default async function CommunicationHubPage() {
  const supabase = await createSupabaseServerClient();

  const [
    { data: formRows, error: formsError },
    { data: sends, error: sendsError },
  ] = await Promise.all([
    supabase
      .from("forms")
      .select("id, name, created_at, form_fields(count)")
      .order("created_at", { ascending: false }),
    supabase
      .from("email_sends")
      .select("id, subject, sent_at, email_recipients(count)")
      .order("sent_at", { ascending: false })
      .limit(20),
  ]);

  const forms = formRows ?? [];
  const emailSends = sends ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin</span>
          <h1 className={styles.title}>Communication</h1>
          <p className={styles.description}>
            Build reusable forms and send mass emails to your Contacts.
          </p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeaderRow}>
          <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
            Forms
          </h2>
          <Link href="/portal/admin/form/new" className={styles.addButton} aria-label="New Form">
            +
          </Link>
        </div>

        {formsError && (
          <p className={styles.error}>Could not load forms: {formsError.message}</p>
        )}

        {forms.length === 0 ? (
          <p className={styles.emptyState}>No forms yet.</p>
        ) : (
          <table className={`${styles.table} ${styles.cardRows}`}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Fields</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {forms.map((form) => (
                <tr key={form.id}>
                  <td data-label="Name" className={styles.cardPrimaryCell}>
                    {form.name}
                  </td>
                  <td data-label="Fields">{form.form_fields?.[0]?.count ?? 0}</td>
                  <td data-label="Created">{new Date(form.created_at).toLocaleDateString()}</td>
                  <td className={styles.cardActionCell}>
                    <Link href={`/portal/admin/form/${form.id}`} className={styles.link}>
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeaderRow}>
          <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
            Mass Emails ({emailSends.length})
          </h2>
          <Link
            href="/portal/admin/email-manager"
            className={styles.addButton}
            aria-label="Compose Mass Email"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="5" width="15" height="11" rx="2" />
              <path d="m3 6 6.5 5a2 2 0 0 0 2.5 0L18 6" />
              <path d="M19 14v6M16 17h6" />
            </svg>
          </Link>
        </div>
        <p className={styles.description}>
          Compose and send an email to your Contacts, filtered by category.
        </p>

        {sendsError && (
          <p className={styles.error}>Could not load sent emails: {sendsError.message}</p>
        )}

        {emailSends.length === 0 ? (
          <p className={styles.emptyState}>No mass emails sent yet.</p>
        ) : (
          <table className={`${styles.table} ${styles.cardRows}`}>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Recipients</th>
                <th>Sent</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {emailSends.map((send) => (
                <tr key={send.id}>
                  <td data-label="Subject" className={styles.cardPrimaryCell}>
                    {send.subject}
                  </td>
                  <td data-label="Recipients">{send.email_recipients?.[0]?.count ?? 0}</td>
                  <td data-label="Sent">{new Date(send.sent_at).toLocaleString()}</td>
                  <td className={styles.cardActionCell}>
                    <Link href={`/portal/admin/communication/${send.id}`} className={styles.link}>
                      View
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
