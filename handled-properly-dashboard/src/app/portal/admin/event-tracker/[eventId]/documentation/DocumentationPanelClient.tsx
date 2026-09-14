"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteDocumentation } from "./actions";
import TrashIcon from "@/components/portal/TrashIcon";
import DownloadIcon from "@/components/portal/DownloadIcon";
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        {docs.map((doc) => {
          const expanded = expandedId === doc.id;
          return (
            <div key={doc.id} className={styles.accordionItem}>
              <button
                type="button"
                className={styles.accordionHeader}
                onClick={() => setExpandedId(expanded ? null : doc.id)}
                aria-expanded={expanded}
              >
                <span className={styles.accordionTitle}>{doc.title}</span>
                <span
                  className={`${styles.accordionChevron} ${expanded ? styles.accordionChevronOpen : ""}`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>

              {expanded && (
                <div className={styles.accordionBody}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div>{doc.description && <p>{doc.description}</p>}</div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.iconButton}
                          aria-label={`Download ${doc.title}`}
                        >
                          <DownloadIcon />
                        </a>
                      )}
                      <button
                        type="button"
                        className={styles.iconButtonDanger}
                        aria-label={`Delete ${doc.title}`}
                        disabled={isPending}
                        onClick={() => handleDelete(doc.id, doc.title)}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
