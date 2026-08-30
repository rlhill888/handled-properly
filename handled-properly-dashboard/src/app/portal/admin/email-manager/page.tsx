import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import ComposeForm from "./ComposeForm";
import styles from "@/styles/admin-shared.module.css";

export default async function EmailManagerPage() {
  const supabase = await createSupabaseServerClient();

  const [
    { data: categories },
    { data: contactCategories },
    { data: contacts },
    { data: events },
    { data: rosterRows },
    { data: attendanceRows },
    { data: availableForms },
  ] = await Promise.all([
    supabase.from("categories").select("id, name").order("name", { ascending: true }),
    supabase.from("contact_categories").select("contact_id, category_id"),
    supabase.from("contacts").select("id"),
    supabase.from("events").select("id, name").order("name", { ascending: true }),
    supabase.from("roster_entries").select("event_id, event_staff(contact_id)"),
    supabase.from("event_attendance").select("event_id, contact_id"),
    supabase.from("forms").select("id, name").order("name", { ascending: true }),
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
          availableForms={availableForms ?? []}
        />
      </div>
    </div>
  );
}
