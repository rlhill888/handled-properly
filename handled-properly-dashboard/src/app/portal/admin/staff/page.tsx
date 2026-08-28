import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import NewStaffForm from "./NewStaffForm";
import AddModalButton from "@/components/portal/AddModalButton";
import styles from "@/styles/admin-shared.module.css";

export default async function StaffPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("event_staff")
    .select("id, invite_status, invited_at, contacts(name, email, phone)")
    .order("invited_at", { ascending: false });

  const staff = (data ?? []).filter((row) => row.contacts !== null);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin</span>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Event Staff</h1>
            <AddModalButton label="Invite Staff" modalTitle="Invite Staff">
              <NewStaffForm />
            </AddModalButton>
          </div>
          <p className={styles.description}>
            Invite someone to give them portal access. They&apos;ll get an email to set their
            password before they can sign in.
          </p>
        </div>
      </div>

      {error && <p className={styles.error}>Could not load staff: {error.message}</p>}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>All Event Staff ({staff.length})</h2>
        {staff.length === 0 ? (
          <p className={styles.emptyState}>No staff invited yet.</p>
        ) : (
          <table className={`${styles.table} ${styles.cardRows}`}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((row) => (
                <tr key={row.id}>
                  <td data-label="Name" className={styles.cardPrimaryCell}>
                    {row.contacts!.name}
                  </td>
                  <td data-label="Email">{row.contacts!.email}</td>
                  <td data-label="Phone">{row.contacts!.phone || "—"}</td>
                  <td data-label="Status">
                    <span
                      className={
                        row.invite_status === "active" ? styles.badge : styles.badgeMuted
                      }
                    >
                      {row.invite_status}
                    </span>
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
