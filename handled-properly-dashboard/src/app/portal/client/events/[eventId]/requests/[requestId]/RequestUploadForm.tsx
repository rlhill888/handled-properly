"use client";

import { useActionState, useRef, useState } from "react";
import { uploadRequestFile, type ActionState } from "../../actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";
import detailStyles from "./RequestDetail.module.css";

function UploadCloudIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

export default function RequestUploadForm({ requestId }: { requestId: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    uploadRequestFile.bind(null, requestId),
    null
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <form action={formAction} className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}

      <div
        className={isDragOver ? detailStyles.dropzoneActive : detailStyles.dropzone}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file && inputRef.current) {
            inputRef.current.files = e.dataTransfer.files;
            setFileName(file.name);
          }
        }}
      >
        <span className={detailStyles.dropzoneIcon}>
          <UploadCloudIcon />
        </span>
        <p className={detailStyles.dropzoneText}>Drag and drop your file here</p>
        <p className={detailStyles.dropzoneOr}>or</p>
        <button type="button" className={styles.secondaryButton} onClick={() => inputRef.current?.click()}>
          Browse files
        </button>
        <input
          ref={inputRef}
          id="file"
          name="file"
          type="file"
          required
          hidden
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </div>

      <div className={detailStyles.uploadFooter}>
        <span className={detailStyles.fileNamePreview}>{fileName ?? "No file selected"}</span>
        <SubmitButton pendingLabel="Uploading…" disabled={!fileName}>
          Upload file
        </SubmitButton>
      </div>
    </form>
  );
}
