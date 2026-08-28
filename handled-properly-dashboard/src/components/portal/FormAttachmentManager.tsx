"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  attachFormTemplate,
  setAttachmentStaffVisible,
  removeFormAttachment,
} from "@/lib/actions/form-attachments";
import SelectDropdown from "./SelectDropdown";
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
        <table className={`${styles.table} ${styles.cardRows}`}>
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
                <td data-label="Template" className={styles.cardPrimaryCell}>
                  {a.templateName}
                </td>
                <td data-label="Fill link">
                  <code style={{ fontSize: 12, wordBreak: "break-all" }}>{`${siteUrl}/forms/fill/${a.id}`}</code>
                </td>
                {showStaffToggle && (
                  <td data-label="Staff visible">
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
                <td data-label="Results">
                  <Link href={`/portal/admin/form/results/${a.id}`} className={styles.link}>
                    View results
                  </Link>
                </td>
                <td className={styles.cardActionCell}>
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
        <SelectDropdown
          options={attachableTemplates.map((t) => ({ id: t.id, label: t.name }))}
          value={selectedTemplateId}
          onChange={setSelectedTemplateId}
          placeholder="Attach a form template…"
          createLabel="New Form Template"
          createHref="/portal/admin/form/new"
        />
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
