"use client";

import styles from "./Spinner.module.css";

export default function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      className={styles.spinner}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
