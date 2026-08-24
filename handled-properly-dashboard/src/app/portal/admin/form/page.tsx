import styles from "./form.module.css";

type Submission = {
  id: string;
  name: string;
  tag: string;
  eventDate: string;
  submittedAt: string;
  status: "pending" | "reviewed";
};

const CLIENT_SUBMISSIONS: Submission[] = [
  {
    id: "1",
    name: "Emily & James Carter",
    tag: "Wedding",
    eventDate: "2026-09-12",
    submittedAt: "2026-06-02",
    status: "pending",
  },
  {
    id: "2",
    name: "Priya Raman",
    tag: "Corporate Gala",
    eventDate: "2026-08-21",
    submittedAt: "2026-06-10",
    status: "pending",
  },
  {
    id: "3",
    name: "Marcus Lee",
    tag: "Birthday Party",
    eventDate: "2026-07-04",
    submittedAt: "2026-06-15",
    status: "reviewed",
  },
];

const STAFF_VENDOR_SUBMISSIONS: Submission[] = [
  {
    id: "1",
    name: "Jordan Smith",
    tag: "Staff",
    eventDate: "2026-07-18",
    submittedAt: "2026-06-08",
    status: "pending",
  },
  {
    id: "2",
    name: "Blossom Floral Co.",
    tag: "Vendor",
    eventDate: "2026-08-02",
    submittedAt: "2026-06-12",
    status: "reviewed",
  },
];

function IntakeCardList({ submissions }: { submissions: Submission[] }) {
  return (
    <div className={styles.cardGrid}>
      {submissions.map((submission) => (
        <article key={submission.id} className={styles.card}>
          <span className={styles.cardEventType}>{submission.tag}</span>
          <h3 className={styles.cardName}>{submission.name}</h3>
          <dl className={styles.cardMeta}>
            <div>
              <dt>Event Date</dt>
              <dd>{submission.eventDate}</dd>
            </div>
            <div>
              <dt>Submitted</dt>
              <dd>{submission.submittedAt}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}

export default function FormPage() {
  const pendingSubmissions = CLIENT_SUBMISSIONS.filter(
    (submission) => submission.status === "pending"
  );
  const reviewedSubmissions = CLIENT_SUBMISSIONS.filter(
    (submission) => submission.status === "reviewed"
  );

  const pendingStaffVendorSubmissions = STAFF_VENDOR_SUBMISSIONS.filter(
    (submission) => submission.status === "pending"
  );
  const reviewedStaffVendorSubmissions = STAFF_VENDOR_SUBMISSIONS.filter(
    (submission) => submission.status === "reviewed"
  );

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Forms</h1>

      <div className={styles.sections}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>New Client Intake Form</h2>
            <a
              href="/portal/admin/form/edit-client-intake-form"
              className={styles.editButton}
            >
              Edit Form
            </a>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Pending Intake Forms</h3>
            <IntakeCardList submissions={pendingSubmissions} />
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Reviewed Intake Forms</h3>
            <IntakeCardList submissions={reviewedSubmissions} />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Staff & Vendor Forms</h2>
            <button type="button" className={styles.editButton}>
              View All Forms
            </button>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Pending Forms</h3>
            <IntakeCardList submissions={pendingStaffVendorSubmissions} />
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Reviewed Forms</h3>
            <IntakeCardList submissions={reviewedStaffVendorSubmissions} />
          </div>
        </section>
      </div>
    </div>
  );
}
