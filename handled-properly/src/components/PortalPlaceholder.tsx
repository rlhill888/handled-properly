import styles from "./PortalPlaceholder.module.css";

export default function PortalPlaceholder({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className={styles.placeholder}>
      <span className={styles.eyebrow}>{eyebrow}</span>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      <span className={styles.badge}>Coming soon</span>
    </div>
  );
}
