import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.brand}>
        <span className={styles.logoMark} aria-hidden="true" />
        <span className={styles.logoText}>HANDLED PROPERLY</span>
      </div>
      <p className={styles.copy}>
        © {new Date().getFullYear()} Handled Properly. All rights reserved.
      </p>
    </footer>
  );
}
