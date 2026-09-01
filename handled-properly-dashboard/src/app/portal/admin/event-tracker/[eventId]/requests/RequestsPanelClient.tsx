"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markRequestFulfilled } from "./actions";
import styles from "@/styles/admin-shared.module.css";

export type RequestRowData = {
  id: string;
  title: string;
  dueDate: string | null;
  requiresFile: boolean;
  fulfillmentSetting: string;
  fulfilledAt: string | null;
  fileUrl: string | null;
};

export default function RequestsPanelClient({
  eventId,
  requests,
}: {
  eventId: string;
  requests: RequestRowData[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleMarkFulfilled = (requestId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await markRequestFulfilled(requestId, eventId);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  };

  if (requests.length === 0) {
    return <p className={styles.emptyState}>No requests yet.</p>;
  }

  return (
    <div className={styles.form}>
      {error && <p className={styles.error}>{error}</p>}
      <table className={`${styles.table} ${styles.cardRows}`}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Due</th>
            <th>File</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td data-label="Title" className={styles.cardPrimaryCell}>
                {request.title}
              </td>
              <td data-label="Due">{request.dueDate ? new Date(request.dueDate).toLocaleDateString() : "—"}</td>
              <td data-label="File">
                {request.fileUrl ? (
                  <a href={request.fileUrl} target="_blank" rel="noreferrer" className={styles.link}>
                    Download
                  </a>
                ) : request.requiresFile ? (
                  "Not uploaded"
                ) : (
                  "—"
                )}
              </td>
              <td data-label="Status">
                <span className={request.fulfilledAt ? styles.badge : styles.badgeMuted}>
                  {request.fulfilledAt ? "Fulfilled" : "Outstanding"}
                </span>
              </td>
              <td className={styles.cardActionCell}>
                {!request.fulfilledAt && request.fulfillmentSetting === "manual_review" && (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={isPending}
                    onClick={() => handleMarkFulfilled(request.id)}
                  >
                    Mark Fulfilled
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
