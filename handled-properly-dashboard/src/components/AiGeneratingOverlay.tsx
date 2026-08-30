"use client";

import Spinner from "./Spinner";
import styles from "./AiGeneratingOverlay.module.css";

export default function AiGeneratingOverlay({ message }: { message: string }) {
  return (
    <div className={styles.overlay} role="alert" aria-live="assertive" tabIndex={0}>
      <Spinner size={40} />
      <span className={styles.stage}>{message}</span>
      <p className={styles.warning}>
        Please don&apos;t leave or refresh this page while this is generating.
      </p>
    </div>
  );
}
