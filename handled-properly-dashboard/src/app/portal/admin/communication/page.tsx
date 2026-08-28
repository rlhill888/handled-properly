import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/styles/admin-shared.module.css";

export default async function CommunicationHubPage() {
  const supabase = await createSupabaseServerClient();

  const [
    { data: templates, error: templatesError },
    { data: sends, error: sendsError },
  ] = await Promise.all([
    supabase
      .from("form_templates")
      .select("id, name, created_at, form_fields(count)")
      .order("created_at", { ascending: false }),
    supabase
      .from("email_sends")
      .select("id, subject, sent_at, email_recipients(count)")
      .order("sent_at", { ascending: false })
      .limit(20),
  ]);

  const formTemplates = templates ?? [];
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
          <Link href="/portal/admin/form/new" className={styles.addButton} aria-label="New Template">
            +
          </Link>
        </div>

        {templatesError && (
          <p className={styles.error}>Could not load templates: {templatesError.message}</p>
        )}

        {formTemplates.length === 0 ? (
          <p className={styles.emptyState}>No form templates yet.</p>
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
              {formTemplates.map((template) => (
                <tr key={template.id}>
                  <td data-label="Name" className={styles.cardPrimaryCell}>
                    {template.name}
                  </td>
                  <td data-label="Fields">{template.form_fields?.[0]?.count ?? 0}</td>
                  <td data-label="Created">{new Date(template.created_at).toLocaleDateString()}</td>
                  <td className={styles.cardActionCell}>
                    <Link href={`/portal/admin/form/${template.id}`} className={styles.link}>
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
            Mass Email
          </h2>
          <Link
            href="/portal/admin/email-manager"
            className={styles.addButton}
            aria-label="Compose Mass Email"
          >
            +
          </Link>
        </div>
        <p className={styles.description}>
          Compose and send an email to your Contacts, filtered by category.
        </p>
        <div className={styles.actions} style={{ marginTop: 16 }}>
          <Link href="/portal/admin/email-manager" className={styles.secondaryButton}>
            Open Mass Email
          </Link>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Sent ({emailSends.length})</h2>

        {sendsError && (
          <p className={styles.error}>Could not load sent emails: {sendsError.message}</p>
        )}

        {emailSends.length === 0 ? (
          <p className={styles.emptyState}>No sends yet.</p>
        ) : (
          <table className={`${styles.table} ${styles.cardRows}`}>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Recipients</th>
                <th>Sent</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
