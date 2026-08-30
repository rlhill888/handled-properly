import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import ClientRow, { type ClientRowData } from "./ClientRow";
import NewClientForm from "./NewClientForm";
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

      <div className={styles.card}>
        <div className={styles.cardHeaderRow}>
          <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
            Client Applications
          </h2>
          <span className={styles.badgeMuted}>Coming soon</span>
        </div>
        <p className={styles.emptyState}>
          No applications yet. Once the application workflow is set up, people requesting your
          services will show up here for review before becoming Clients.
        </p>
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
