import { type CSSProperties } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import styles from "./TrustedBy.module.css";
import type { TrustedPartner } from "@/lib/data/site-content";

function PartnerItem({ partner, hidden }: { partner: TrustedPartner; hidden?: boolean }) {
  return (
    <li className={styles.item} aria-hidden={hidden || undefined}>
      {partner.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={partner.logoUrl} alt={partner.name} className={styles.logo} />
      ) : (
        partner.name
      )}
    </li>
  );
}

export default function TrustedBy({ partners }: { partners: TrustedPartner[] }) {
  if (partners.length === 0) return null;

  return (
    <section className={styles.section}>
      <ScrollReveal className={styles.label}>
        <span className={styles.labelLine} aria-hidden="true" />
        <span>
          TRUSTED BY
          <br />
          EVENT PROFESSIONALS
        </span>
      </ScrollReveal>

      {/* Continuously-scrolling marquee, same technique as the desktop
          Featured Events track: the list renders twice back to back and
          the whole thing animates left by exactly 50% of its own width,
          so the loop point is seamless -- the visible names never jump or
          reset. The duplicate copy is aria-hidden since it's the same
          partners again, purely for the visual loop. */}
      <div className={styles.carousel}>
        <ul
          className={styles.track}
          style={{ "--marquee-duration": `${partners.length * 4}s` } as CSSProperties}
        >
          {partners.map((partner) => (
            <PartnerItem key={partner.id} partner={partner} />
          ))}
          {partners.map((partner) => (
            <PartnerItem key={`dup-${partner.id}`} partner={partner} hidden />
          ))}
        </ul>
      </div>
    </section>
  );
}
