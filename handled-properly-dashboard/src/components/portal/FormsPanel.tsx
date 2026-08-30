"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { assignFormToTarget, setFormStaffVisible } from "@/lib/actions/forms";
import { deleteForm } from "@/app/portal/admin/form/actions";
import SelectDropdown from "./SelectDropdown";
import styles from "@/styles/admin-shared.module.css";

export type FormTargetType = "event" | "assignment" | "email_send";

export type ScopedForm = {
  id: string;
  name: string;
  staffVisible: boolean;
};

export default function FormsPanel({
  targetType,
  targetId,
  basePath,
  availableForms,
  forms,
  siteUrl,
  showStaffToggle = true,
}: {
  targetType: FormTargetType;
  targetId: string;
  basePath: string;
  availableForms: { id: string; name: string }[];
  forms: ScopedForm[];
  siteUrl: string;
  showStaffToggle?: boolean;
}) {
  const [selectedFormId, setSelectedFormId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAssign = () => {
    if (!selectedFormId) return;
    setError(null);
    startTransition(async () => {
      const result = await assignFormToTarget(selectedFormId, targetType, targetId, basePath);
      if (result?.error) setError(result.error);
      else setSelectedFormId("");
    });
  };

  const handleToggle = (formId: string, next: boolean) => {
    startTransition(() => {
      setFormStaffVisible(formId, next, basePath);
    });
  };

  const handleRemove = (formId: string) => {
    if (!confirm("Delete this form? Its submissions will be lost too.")) return;
    startTransition(() => {
      deleteForm(formId, basePath);
    });
  };

  const newFormHref = `/portal/admin/form/new?targetType=${targetType}&targetId=${targetId}&basePath=${encodeURIComponent(basePath)}`;

  return (
    <div className={styles.form}>
      {error && <p className={styles.error}>{error}</p>}

      {forms.length === 0 ? (
        <p className={styles.emptyState}>No forms yet.</p>
      ) : (
        <table className={`${styles.table} ${styles.cardRows}`}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Fill link</th>
              {showStaffToggle && <th>Staff visible</th>}
              <th>Results</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {forms.map((f) => (
              <tr key={f.id}>
                <td data-label="Name" className={styles.cardPrimaryCell}>
                  {f.name}
                </td>
                <td data-label="Fill link">
                  <code style={{ fontSize: 12, wordBreak: "break-all" }}>{`${siteUrl}/forms/fill/${f.id}`}</code>
                </td>
                {showStaffToggle && (
                  <td data-label="Staff visible">
                    {/* Uncontrolled + keyed on the server value: toggles
                        instantly without the controlled-input snap-back
                        (no local state to reconcile with the prop until
                        revalidation lands), then self-corrects to the real
                        value by remounting if the key changes. */}
                    <input
                      key={`${f.id}-${f.staffVisible}`}
                      type="checkbox"
                      defaultChecked={f.staffVisible}
                      disabled={isPending}
                      onChange={(e) => handleToggle(f.id, e.target.checked)}
                    />
                  </td>
                )}
                <td data-label="Results">
                  <Link href={`/portal/admin/form/results/${f.id}`} className={styles.link}>
                    View results
                  </Link>
                </td>
                <td className={styles.cardActionCell}>
                  <button
                    type="button"
                    className={styles.dangerButton}
                    disabled={isPending}
                    onClick={() => handleRemove(f.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className={styles.formRow}>
        <SelectDropdown
          options={availableForms.map((f) => ({ id: f.id, label: f.name }))}
          value={selectedFormId}
          onChange={setSelectedFormId}
          placeholder="Use an existing unassigned form…"
          createLabel="New Form"
          createHref={newFormHref}
        />
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={!selectedFormId || isPending}
          onClick={handleAssign}
        >
          Use
        </button>
      </div>
    </div>
  );
}
