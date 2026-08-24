import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/styles/admin-shared.module.css";

export default async function FormTemplatesPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("form_templates")
    .select("id, name, created_at, form_fields(count)")
    .order("created_at", { ascending: false });

  const templates = data ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin</span>
          <h1 className={styles.title}>Form Templates</h1>
          <p className={styles.description}>
            Build reusable forms once, then attach them to events, assignments, or emails.
          </p>
        </div>
        <Link href="/portal/admin/form/new" className={styles.primaryButton}>
          New Template
        </Link>
      </div>

      {error && <p className={styles.error}>Could not load templates: {error.message}</p>}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>All Templates ({templates.length})</h2>
        {templates.length === 0 ? (
          <p className={styles.emptyState}>No form templates yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Fields</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id}>
                  <td>{template.name}</td>
                  <td>{template.form_fields?.[0]?.count ?? 0}</td>
                  <td>{new Date(template.created_at).toLocaleDateString()}</td>
                  <td>
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
    </div>
  );
}
