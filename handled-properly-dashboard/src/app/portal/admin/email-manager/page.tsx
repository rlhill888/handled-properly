import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import ComposeForm from "./ComposeForm";
import DeleteTemplateButton from "./DeleteTemplateButton";
import styles from "@/styles/admin-shared.module.css";

export default async function EmailManagerPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template: templateId } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [
    { data: categories },
    { data: contactCategories },
    { data: contacts },
    { data: events },
    { data: rosterRows },
    { data: attendanceRows },
    { data: templates },
    { data: formTemplates },
  ] = await Promise.all([
    supabase.from("categories").select("id, name").order("name", { ascending: true }),
    supabase.from("contact_categories").select("contact_id, category_id"),
    supabase.from("contacts").select("id"),
    supabase.from("events").select("id, name").order("name", { ascending: true }),
    supabase.from("roster_entries").select("event_id, event_staff(contact_id)"),
    supabase.from("event_attendance").select("event_id, contact_id"),
    supabase
      .from("email_templates")
      .select("id, name, subject, body_html, source, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("form_templates").select("id, name").order("name", { ascending: true }),
  ]);

  const contactPreviews = (contacts ?? []).map((c) => ({
    id: c.id,
    categoryIds: (contactCategories ?? [])
      .filter((cc) => cc.contact_id === c.id)
      .map((cc) => cc.category_id),
    staffEventIds: (rosterRows ?? [])
      .filter((r) => r.event_staff?.contact_id === c.id)
      .map((r) => r.event_id),
    attendeeEventIds: (attendanceRows ?? [])
      .filter((a) => a.contact_id === c.id)
      .map((a) => a.event_id),
  }));

  const selectedTemplate = templateId ? templates?.find((t) => t.id === templateId) : undefined;

  return (
    <div className={styles.page}>
      <Link href="/portal/admin/communication" className={styles.backLink} aria-label="Back to Communication">
        ←
      </Link>

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin · Communication</span>
          <h1 className={styles.title}>Mass Email Manager</h1>
          <p className={styles.description}>
            Compose and send an email to your Contacts, filtered by category.
          </p>
        </div>
      </div>

      <div className={styles.card}>
        <ComposeForm
          categories={categories ?? []}
          contacts={contactPreviews}
          events={events ?? []}
          formTemplates={formTemplates ?? []}
          initialSubject={selectedTemplate?.subject ?? ""}
          initialBody={selectedTemplate?.body_html ?? ""}
          key={templateId ?? "blank"}
        />
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Templates ({templates?.length ?? 0})</h2>
        {!templates || templates.length === 0 ? (
          <p className={styles.emptyState}>
            No saved templates yet — compose an email above and save it as one.
          </p>
        ) : (
          <table className={`${styles.table} ${styles.cardRows}`}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Subject</th>
                <th>Source</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id}>
                  <td data-label="Name" className={styles.cardPrimaryCell}>
                    {template.name}
                  </td>
                  <td data-label="Subject">{template.subject}</td>
                  <td data-label="Source">
                    <span className={styles.badgeMuted}>
                      {template.source === "ai_draft" ? "AI draft" : "Manual"}
                    </span>
                  </td>
                  <td className={styles.cardActionCell}>
                    <div className={styles.metaRow}>
                      <Link
                        href={`/portal/admin/email-manager?template=${template.id}`}
                        className={styles.link}
                      >
                        Use
                      </Link>
                      <DeleteTemplateButton templateId={template.id} />
                    </div>
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
