"use client";

import { useState } from "react";
import SelectDropdown, { type SelectDropdownOption } from "./SelectDropdown";
import styles from "@/styles/admin-shared.module.css";

// A searchable "add one at a time" multi-select — same SelectDropdown +
// pending-value + Add-button pattern used for Forms in ComposeForm.tsx,
// generalized so it can also submit as plain repeated-name form fields
// (FormData.getAll(name)), which is what the plain <form action={...}>
// server actions here already expect from what used to be checkboxes.
export default function MultiSelectField({
  name,
  label,
  helperText,
  options,
  initialSelectedIds = [],
  placeholder,
  searchPlaceholder = "Search…",
}: {
  name: string;
  label: string;
  helperText?: string;
  options: SelectDropdownOption[];
  initialSelectedIds?: string[];
  placeholder: string;
  searchPlaceholder?: string;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [pendingId, setPendingId] = useState("");

  const remove = (id: string) => setSelectedIds((current) => current.filter((i) => i !== id));

  const add = () => {
    if (!pendingId || selectedIds.includes(pendingId)) return;
    setSelectedIds((current) => [...current, pendingId]);
    setPendingId("");
  };

  return (
    <div className={styles.field}>
      <span className={styles.label}>
        {label} {helperText && <span className={styles.optional}>{helperText}</span>}
      </span>

      {selectedIds.length > 0 && (
        <div className={styles.metaRow}>
          {selectedIds.map((id) => {
            const option = options.find((o) => o.id === id);
            return (
              <span key={id} className={styles.pill}>
                {option?.label ?? id}
                <button
                  type="button"
                  className={styles.pillDelete}
                  aria-label={`Remove ${option?.label ?? id}`}
                  onClick={() => remove(id)}
                >
                  ×
                </button>
                <input type="hidden" name={name} value={id} />
              </span>
            );
          })}
        </div>
      )}

      <div className={styles.formRow}>
        <SelectDropdown
          options={options.filter((o) => !selectedIds.includes(o.id))}
          value={pendingId}
          onChange={setPendingId}
          placeholder={placeholder}
          searchable
          searchPlaceholder={searchPlaceholder}
        />
        <button type="button" className={styles.secondaryButton} disabled={!pendingId} onClick={add}>
          Add
        </button>
      </div>
    </div>
  );
}
