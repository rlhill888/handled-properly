import { notFound } from "next/navigation";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCommentsByRequestIds } from "@/lib/data/request-comments";
import { addRequestComment } from "@/lib/actions/request-comments";
import RequestUploadForm from "./RequestUploadForm";
import RequestTextForm from "./RequestTextForm";
import RequestCheckOffButton from "./RequestCheckOffButton";
import BackButton from "./BackButton";
import CommentsSection from "@/components/portal/CommentsSection";
import CalendarIcon from "@/components/portal/CalendarIcon";
import FileIcon from "@/components/portal/FileIcon";
import styles from "@/styles/admin-shared.module.css";
import detailStyles from "./RequestDetail.module.css";

function ExternalLinkIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6M10 14 21 3" />
    </svg>
  );
}

export default async function ClientRequestDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; requestId: string }>;
}) {
  const { eventId, requestId } = await params;
  const supabase = await createSupabaseServerClient();

  // RLS (client_select_own_requests) scopes this — no row means either the
  // request doesn't exist or it isn't on one of this client's events.
  const { data: request } = await supabase
    .from("requests")
    .select("id, title, description, due_date, request_type, fulfilled_at, fulfillment_setting, file_path, response_text, checked_at")
    .eq("id", requestId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (!request) notFound();

  let fileUrl: string | null = null;
  if (request.file_path) {
    const { data } = await createAdminClient()
      .storage.from("request-attachments")
      .createSignedUrl(request.file_path, 60 * 10);
    fileUrl = data?.signedUrl ?? null;
  }

  const commentsByRequest = await getCommentsByRequestIds(supabase, [request.id]);
  const showAction = !request.fulfilled_at;

  return (
    <div className={styles.page}>
      <BackButton fallbackHref={`/portal/client/events/${eventId}`} />

      <div className={detailStyles.titleRow}>
        <div className={detailStyles.titleGroup}>
          <h1 className={styles.title}>{request.title}</h1>
          <span className={request.fulfilled_at ? detailStyles.statusPillDone : detailStyles.statusPill}>
            {request.fulfilled_at ? "Fulfilled" : "Outstanding"}
          </span>
        </div>
        {request.due_date && (
          <div className={detailStyles.dueDate}>
            <CalendarIcon size={16} />
            Due {new Date(request.due_date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        )}
      </div>

      <div className={detailStyles.card}>
        <div>
          <h2 className={detailStyles.sectionTitle}>Instructions</h2>
          <p className={detailStyles.sectionText}>
            {request.description || "Please complete this request."}
          </p>
        </div>

        <hr className={detailStyles.divider} />

        {request.request_type === "file" && (
          <>
            {fileUrl && (
              <div>
                <h2 className={detailStyles.sectionTitle}>Your file</h2>
                <div className={detailStyles.fileRow}>
                  <span className={detailStyles.fileRowLabel}>
                    <FileIcon size={18} />
                    Uploaded file
                  </span>
                  <a href={fileUrl} target="_blank" rel="noreferrer" className={detailStyles.viewFileLink}>
                    <ExternalLinkIcon />
                    View file
                  </a>
                </div>
              </div>
            )}

            {showAction && (
              <div>
                <h2 className={detailStyles.sectionTitle}>Upload a file</h2>
                <RequestUploadForm requestId={request.id} />
              </div>
            )}

            <hr className={detailStyles.divider} />
          </>
        )}

        {request.request_type === "text" && (
          <>
            <div>
              <h2 className={detailStyles.sectionTitle}>Your response</h2>
              {request.response_text && !showAction ? (
                <p className={detailStyles.sectionText}>{request.response_text}</p>
              ) : (
                showAction && <RequestTextForm requestId={request.id} defaultValue={request.response_text} />
              )}
            </div>

            <hr className={detailStyles.divider} />
          </>
        )}

        {request.request_type === "checkbox" && (
          <>
            <div>
              <h2 className={detailStyles.sectionTitle}>Mark as done</h2>
              {request.checked_at ? (
                <p className={detailStyles.sectionText}>
                  Checked {new Date(request.checked_at).toLocaleString()}
                  {showAction && " — waiting on admin confirmation."}
                </p>
              ) : (
                showAction && <RequestCheckOffButton requestId={request.id} />
              )}
            </div>

            <hr className={detailStyles.divider} />
          </>
        )}

        <CommentsSection
          initialComments={commentsByRequest.get(request.id) ?? []}
          onPost={addRequestComment.bind(null, request.id)}
        />
      </div>
    </div>
  );
}
