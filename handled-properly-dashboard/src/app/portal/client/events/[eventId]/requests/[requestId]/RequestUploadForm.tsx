"use client";

import { useActionState } from "react";
import { uploadRequestFile, type ActionState } from "../../actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";

export default function RequestUploadForm({ requestId }: { requestId: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    uploadRequestFile.bind(null, requestId),
    null
  );

  return (
    <form action={formAction} className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="file">
          File
        </label>
        <input id="file" name="file" type="file" required className={styles.input} />
      </div>
      <div className={styles.actions}>
        <SubmitButton pendingLabel="Uploading…">Upload</SubmitButton>
      </div>
    </form>
  );
}
