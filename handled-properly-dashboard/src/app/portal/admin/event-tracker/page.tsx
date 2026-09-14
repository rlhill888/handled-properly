import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import NewEventForm from "./NewEventForm";
import AddModalButton from "@/components/portal/AddModalButton";
import ActiveEventsList from "@/components/portal/ActiveEventsList";
import styles from "@/styles/admin-shared.module.css";

export default async function EventTrackerPage() {
  const supabase = await createSupabaseServerClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, company_name, contacts(name)");

  const clientOptions = (clients ?? [])
    .filter((c) => c.contacts !== null)
    .map((c) => ({
      id: c.id,
      name: c.company_name || c.contacts!.name,
    }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin</span>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Events</h1>
            <AddModalButton label="New Event" modalTitle="New Event">
              <NewEventForm clients={clientOptions} />
            </AddModalButton>
          </div>
          <p className={styles.description}>Active events. Completed events move to History.</p>
        </div>
        <Link href="/portal/admin/event-tracker/history" className={styles.secondaryButton}>
          View History
        </Link>
      </div>

      <h2 className={styles.cardTitle}>Active Events</h2>
      <ActiveEventsList linkBase="/portal/admin/event-tracker" />
    </div>
  );
}
