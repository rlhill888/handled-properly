import styles from "./TrustedBy.module.css";

const PARTNERS = [
  "Bloom Events",
  "Gather & Co.",
  "Venue Studio",
  "Catering House",
  "Lumen Florals",
  "Rivet Rentals",
];

export default function TrustedBy() {
  return (
    <section className={styles.section}>
      <p className={styles.label}>
        TRUSTED BY
        <br />
        EVENT PROFESSIONALS
      </p>
      <ul className={styles.list}>
        {PARTNERS.map((name) => (
          <li key={name} className={styles.item}>
            {name}
          </li>
        ))}
      </ul>
    </section>
  );
}
