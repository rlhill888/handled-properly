import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import ClientRow, { type ClientRowData } from "./ClientRow";
import NewClientForm from "./NewClientForm";
import ApplicationRow, { type ApplicationRowData } from "./ApplicationRow";
import AddModalButton from "@/components/portal/AddModalButton";
import styles from "@/styles/admin-shared.module.css";

export default async function ClientsPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("clients")
    .select("id, company_name, notes, contacts(id, name, email, phone)")
    .order("created_at", { ascending: false });

  const clients: ClientRowData[] = (data ?? [])
    .filter((row) => row.contacts !== null)
    .map((row) => ({
      clientId: row.id,
      contactId: row.contacts!.id,
      name: row.contacts!.name,
      email: row.contacts!.email,
      phone: row.contacts!.phone,
      companyName: row.company_name,
      notes: row.notes,
    }));

  const { data: applicationRows, error: applicationsError } = await supabase
    .from("client_applications")
    .select(
      "id, name, email, phone, company_name, event_date, guest_count, location, budget, message, status, ai_summary, submitted_at",
    )
    .neq("status", "converted")
    .order("submitted_at", { ascending: false });

  const applications: ApplicationRowData[] = (applicationRows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    companyName: row.company_name,
    eventDate: row.event_date,
    guestCount: row.guest_count,
    location: row.location,
    budget: row.budget,
    message: row.message,
    status: row.status,
    aiSummary: row.ai_summary,
    submittedAt: row.submitted_at,
  }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin</span>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Clients</h1>
            <AddModalButton label="Add Client" modalTitle="Add Client">
              <NewClientForm />
            </AddModalButton>
          </div>
          <p className={styles.description}>
            People who hire Handled Properly for events. Add a client here before creating events
            for them.
          </p>
        </div>
      </div>

      {error && <p className={styles.error}>Could not load clients: {error.message}</p>}
      {applicationsError && (
        <p className={styles.error}>Could not load applications: {applicationsError.message}</p>
      )}

      <div className={styles.card}>
        <div className={styles.cardHeaderRow}>
          <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
            Client Applications
          </h2>
          <span className={styles.badgeMuted}>{applications.length}</span>
        </div>
        {applications.length === 0 ? (
          <p className={styles.emptyState}>
            No applications yet. People requesting your services through the get-started page will
            show up here for review before becoming Clients.
          </p>
        ) : (
          <div className={styles.accordionList}>
            {applications.map((application) => (
              <ApplicationRow key={application.id} application={application} />
            ))}
          </div>
        )}
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>All Clients ({clients.length})</h2>
        {clients.length === 0 ? (
          <p className={styles.emptyState}>No clients yet.</p>
        ) : (
          <div className={styles.accordionList}>
            {clients.map((client) => (
              <ClientRow key={client.clientId} client={client} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
