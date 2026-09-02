"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkOffRequest } from "../../actions";
import styles from "@/styles/admin-shared.module.css";

export default function RequestCheckOffButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await checkOffRequest(requestId);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  };

  return (
    <div className={styles.actions}>
      {error && <p className={styles.error}>{error}</p>}
      <button type="button" className={styles.primaryButton} disabled={isPending} onClick={handleClick}>
        {isPending ? "Marking…" : "Mark as done"}
      </button>
    </div>
  );
}
