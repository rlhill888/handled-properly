import { getTrustedPartners } from "@/lib/data/site-content";
import AddModalButton from "@/components/portal/AddModalButton";
import NewTrustedPartnerForm from "./NewTrustedPartnerForm";
import TrustedPartnerList from "./TrustedPartnerList";
import styles from "@/styles/admin-shared.module.css";

export default async function TrustedByPage() {
  const partners = await getTrustedPartners();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Website</span>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Trusted By</h1>
            <AddModalButton label="New Partner" modalTitle="New Trusted Partner">
              <NewTrustedPartnerForm />
            </AddModalButton>
          </div>
          <p className={styles.description}>
            Shown in the homepage&apos;s &ldquo;Trusted By Event Professionals&rdquo; strip.
          </p>
        </div>
      </div>

      <TrustedPartnerList partners={partners} />
    </div>
  );
}
