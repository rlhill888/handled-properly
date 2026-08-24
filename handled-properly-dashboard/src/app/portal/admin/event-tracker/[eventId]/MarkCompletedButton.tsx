"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markEventCompleted } from "../actions";
import styles from "@/styles/admin-shared.module.css";

export default function MarkCompletedButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    if (!confirm("Mark this event Completed? It will move to History and lock.")) return;
    setError(null);
    startTransition(async () => {
      const result = await markEventCompleted(eventId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div>
      {error && <p className={styles.error}>{error}</p>}
      <button
        type="button"
        className={styles.primaryButton}
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? "Marking Completed…" : "Mark Completed"}
      </button>
    </div>
  );
}
