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
          <h2 className={styles.cardTitle}>{doc.title}</h2>
          {doc.description && <p>{doc.description}</p>}
          {doc.downloadUrl && (
            <p>
              <a href={doc.downloadUrl} target="_blank" rel="noreferrer" className={styles.link}>
                Download
              </a>
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
