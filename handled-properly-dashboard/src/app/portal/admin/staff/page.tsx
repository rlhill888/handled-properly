import NewStaffForm from "./NewStaffForm";
import StaffList from "./StaffList";
import { getStaffPageData } from "./data";
import AddModalButton from "@/components/portal/AddModalButton";
import styles from "@/styles/admin-shared.module.css";

export default async function StaffPage() {
  const { staff, error } = await getStaffPageData();

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

      <StaffList staff={staff} />
    </div>
  );
}
