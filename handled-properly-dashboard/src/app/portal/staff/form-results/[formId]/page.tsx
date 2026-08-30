import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getFormSubmissions } from "@/lib/data/form-submissions";
import SubmissionsView from "@/components/portal/SubmissionsView";
import styles from "@/styles/admin-shared.module.css";

export default async function StaffFormResultsPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const supabase = await createSupabaseServerClient();

  // getFormSubmissions runs every query through this staff member's own
  // session — RLS (can_staff_view_form: staff_visible + rostered/assigned)
  // is what actually decides whether anything comes back, not a check here.
  // Not staff-visible, or not their roster, means the form lookup itself
  // returns no row.
  const result = await getFormSubmissions(supabase, formId);
  if (!result) notFound();

  return (
    <div className={styles.page}>
      <Link href="/portal/staff/events" className={styles.backLink} aria-label="Back to My Events">
        ←
      </Link>

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Event Staff · Form Results</span>
          <h1 className={styles.title}>{result.formName}</h1>
          <p className={styles.description}>
            {result.submissions.length} submission{result.submissions.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <SubmissionsView submissions={result.submissions} />
    </div>
  );
}
