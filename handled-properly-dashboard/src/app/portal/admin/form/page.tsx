import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/styles/admin-shared.module.css";

const TARGET_LABEL = {
  event: "Event",
  assignment: "Assignment",
  email_send: "Email Send",
} as const;

export default async function FormsPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("forms")
    .select("id, name, created_at, target_type, form_fields(count)")
    .order("created_at", { ascending: false });

  const forms = data ?? [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return (
    <div className={styles.page}>
      <Link href="/portal/admin/communication" className={styles.backLink} aria-label="Back to Communication">
        ←
      </Link>

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin · Communication</span>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Forms</h1>
            <Link href="/portal/admin/form/new" className={styles.addButton} aria-label="New Form">
              +
            </Link>
          </div>
          <p className={styles.description}>
            Every Form gets its own fill link the moment it&apos;s created — optionally scope one to an
            Event, Assignment, or Email Send from that item&apos;s own page.
          </p>
        </div>
      </div>

      {error && <p className={styles.error}>Could not load forms: {error.message}</p>}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>All Forms ({forms.length})</h2>
        {forms.length === 0 ? (
          <p className={styles.emptyState}>No forms yet.</p>
        ) : (
          <table className={`${styles.table} ${styles.cardRows}`}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Fields</th>
                <th>Scope</th>
                <th>Fill link</th>
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
                  <td data-label="Scope">
                    <span className={styles.badgeMuted}>
                      {form.target_type ? TARGET_LABEL[form.target_type] : "Standalone"}
                    </span>
                  </td>
                  <td data-label="Fill link">
                    <code style={{ fontSize: 12, wordBreak: "break-all" }}>{`${siteUrl}/forms/fill/${form.id}`}</code>
                  </td>
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
    </div>
  );
}
