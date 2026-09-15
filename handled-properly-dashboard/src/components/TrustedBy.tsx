import styles from "./TrustedBy.module.css";
import type { TrustedPartner } from "@/lib/data/site-content";

export default function TrustedBy({ partners }: { partners: TrustedPartner[] }) {
  if (partners.length === 0) return null;

  return (
    <section className={styles.section}>
      <p className={styles.label}>
        TRUSTED BY
        <br />
        EVENT PROFESSIONALS
      </p>
      <ul className={styles.list}>
        {partners.map((partner) =>
          partner.logoUrl ? (
            <li key={partner.id} className={styles.item}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={partner.logoUrl} alt={partner.name} className={styles.logo} />
            </li>
          ) : (
            <li key={partner.id} className={styles.item}>
              {partner.name}
            </li>
          )
        )}
      </ul>
    </section>
  );
}
