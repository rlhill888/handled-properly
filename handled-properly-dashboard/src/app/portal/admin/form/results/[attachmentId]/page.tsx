import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getAttachmentSubmissions } from "@/lib/data/form-submissions";
import SubmissionsView from "@/components/portal/SubmissionsView";
import styles from "@/styles/admin-shared.module.css";

export default async function AdminFormResultsPage({
  params,
}: {
  params: Promise<{ attachmentId: string }>;
}) {
  const { attachmentId } = await params;
  const supabase = await createSupabaseServerClient();

  const result = await getAttachmentSubmissions(supabase, attachmentId);
  if (!result) notFound();

  return (
    <div className={styles.page}>
      <Link href="/portal/admin/form" className={styles.link}>
        ← Back to Forms
      </Link>

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin · Form Results</span>
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
