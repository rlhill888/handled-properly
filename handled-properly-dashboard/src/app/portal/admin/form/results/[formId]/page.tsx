import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getFormSubmissions } from "@/lib/data/form-submissions";
import SubmissionsView from "@/components/portal/SubmissionsView";
import styles from "@/styles/admin-shared.module.css";

export default async function AdminFormResultsPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const supabase = await createSupabaseServerClient();

  const result = await getFormSubmissions(supabase, formId);
  if (!result) notFound();

  return (
    <div className={styles.page}>
      <Link href="/portal/admin/form" className={styles.backLink} aria-label="Back to Forms">
        ←
      </Link>

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin · Form Results</span>
          <h1 className={styles.title}>{result.formName}</h1>
          <p className={styles.description}>
            {result.submissions.length} submission{result.submissions.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <SubmissionsView
        formName={result.formName}
        columns={result.columns}
        submissions={result.submissions}
      />
    </div>
  );
}
