"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  attachFormTemplate,
  setAttachmentStaffVisible,
  removeFormAttachment,
} from "@/lib/actions/form-attachments";
import styles from "@/styles/admin-shared.module.css";

export type FormAttachmentTargetType = "event" | "assignment" | "email_send";

export type AttachedForm = {
  id: string;
  templateId: string;
  templateName: string;
  staffVisible: boolean;
};

export default function FormAttachmentManager({
  targetType,
  targetId,
  basePath,
  availableTemplates,
  attached,
  siteUrl,
  showStaffToggle = true,
}: {
  targetType: FormAttachmentTargetType;
  targetId: string;
  basePath: string;
  availableTemplates: { id: string; name: string }[];
  attached: AttachedForm[];
  siteUrl: string;
  showStaffToggle?: boolean;
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const attachedTemplateIds = new Set(attached.map((a) => a.templateId));
  const attachableTemplates = availableTemplates.filter((t) => !attachedTemplateIds.has(t.id));

  const handleAttach = () => {
    if (!selectedTemplateId) return;
    setError(null);
    startTransition(async () => {
      const result = await attachFormTemplate(targetType, targetId, selectedTemplateId, basePath);
      if (result?.error) setError(result.error);
      else setSelectedTemplateId("");
    });
  };

  const handleToggle = (attachmentId: string, next: boolean) => {
    startTransition(() => {
      setAttachmentStaffVisible(attachmentId, next, basePath);
    });
  };

  const handleRemove = (attachmentId: string) => {
    if (!confirm("Remove this form attachment?")) return;
    startTransition(() => {
      removeFormAttachment(attachmentId, basePath);
    });
  };

  return (
    <div className={styles.form}>
      {error && <p className={styles.error}>{error}</p>}

      {attached.length === 0 ? (
        <p className={styles.emptyState}>No forms attached yet.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Template</th>
              <th>Fill link</th>
              {showStaffToggle && <th>Staff visible</th>}
              <th>Results</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {attached.map((a) => (
              <tr key={a.id}>
                <td>{a.templateName}</td>
                <td>
                  <code style={{ fontSize: 12 }}>{`${siteUrl}/forms/fill/${a.id}`}</code>
                </td>
                {showStaffToggle && (
                  <td>
                    {/* Uncontrolled + keyed on the server value: toggles
                        instantly without the controlled-input snap-back
                        (no local state to reconcile with the prop until
                        revalidation lands), then self-corrects to the real
                        value by remounting if the key changes. */}
                    <input
                      key={`${a.id}-${a.staffVisible}`}
                      type="checkbox"
                      defaultChecked={a.staffVisible}
                      disabled={isPending}
                      onChange={(e) => handleToggle(a.id, e.target.checked)}
                    />
                  </td>
                )}
                <td>
                  <Link href={`/portal/admin/form/results/${a.id}`} className={styles.link}>
                    View results
                  </Link>
                </td>
                <td>
                  <button
                    type="button"
                    className={styles.dangerButton}
                    disabled={isPending}
                    onClick={() => handleRemove(a.id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className={styles.formRow}>
        <select
          className={styles.select}
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
        >
          <option value="">Attach a form template…</option>
          {attachableTemplates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={!selectedTemplateId || isPending}
          onClick={handleAttach}
        >
          Attach
        </button>
      </div>
    </div>
  );
}
