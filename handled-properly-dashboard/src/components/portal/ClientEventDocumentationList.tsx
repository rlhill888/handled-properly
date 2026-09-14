import DownloadIcon from "@/components/portal/DownloadIcon";
import styles from "@/styles/admin-shared.module.css";

export type ClientEventDocumentationData = {
  id: string;
  title: string;
  description: string | null;
  downloadUrl: string | null;
};

export default function ClientEventDocumentationList({
  docs,
}: {
  docs: ClientEventDocumentationData[];
}) {
  if (docs.length === 0) {
    return <p className={styles.emptyState}>No documentation yet.</p>;
  }

  return (
    <div className={styles.accordionList}>
      {docs.map((doc) => (
        <div key={doc.id} className={styles.card}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <h2 className={styles.cardTitle} style={{ marginBottom: doc.description ? 8 : 0 }}>
              {doc.title}
            </h2>
            {doc.downloadUrl && (
              <a
                href={doc.downloadUrl}
                download
                rel="noreferrer"
                className={styles.secondaryButton}
                style={{ flexShrink: 0 }}
              >
                <DownloadIcon size={14} />
                <span style={{ marginLeft: 6 }}>Download</span>
              </a>
            )}
          </div>
          {doc.description && <p>{doc.description}</p>}
        </div>
      ))}
    </div>
  );
}
