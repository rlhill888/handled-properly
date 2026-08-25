import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getAttachmentSubmissions } from "@/lib/data/form-submissions";
import SubmissionsView from "@/components/portal/SubmissionsView";
import styles from "@/styles/admin-shared.module.css";

export default async function StaffFormResultsPage({
  params,
}: {
  params: Promise<{ attachmentId: string }>;
}) {
  const { attachmentId } = await params;
  const supabase = await createSupabaseServerClient();

  // getAttachmentSubmissions runs every query through this staff member's
  // own session — RLS (can_staff_view_form_attachment: staff_visible +
  // rostered/assigned) is what actually decides whether anything comes
  // back, not a check here. Not staff-visible, or not their roster, means
  // the attachment lookup itself returns no row.
  const result = await getAttachmentSubmissions(supabase, attachmentId);
  if (!result) notFound();

  return (
    <div className={styles.page}>
      <Link href="/portal/staff/events" className={styles.link}>
        ← Back to My Events
      </Link>

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Event Staff · Form Results</span>
          <h1 className={styles.title}>{result.templateName}</h1>
          <p className={styles.description}>
            {result.submissions.length} submission{result.submissions.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <SubmissionsView submissions={result.submissions} />
    </div>
  );
}
