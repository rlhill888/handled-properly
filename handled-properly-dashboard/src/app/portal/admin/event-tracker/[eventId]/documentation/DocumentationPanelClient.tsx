"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteDocumentation } from "./actions";
import styles from "@/styles/admin-shared.module.css";

export type DocumentationRowData = {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
};

export default function DocumentationPanelClient({
  eventId,
  docs,
}: {
  eventId: string;
  docs: DocumentationRowData[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (documentationId: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteDocumentation(documentationId, eventId);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  };

  if (docs.length === 0) {
    return <p className={styles.emptyState}>No documentation yet.</p>;
  }

  return (
    <div className={styles.form}>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.accordionList}>
        {docs.map((doc) => (
          <div key={doc.id} className={styles.accordionItem} style={{ padding: "14px 16px" }}>
            <div className={styles.cardHeaderRow}>
              <span className={styles.accordionTitle}>{doc.title}</span>
              <button
                type="button"
                className={styles.dangerButton}
                disabled={isPending}
                onClick={() => handleDelete(doc.id, doc.title)}
              >
                Delete
              </button>
            </div>
            {doc.description && <p>{doc.description}</p>}
            {doc.fileUrl && (
              <p>
                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className={styles.link}>
                  Download
                </a>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
