"use client";

import { useState } from "react";
import SelectDropdown, { type SelectDropdownOption } from "./SelectDropdown";
import styles from "@/styles/admin-shared.module.css";

// A searchable multi-select — same SelectDropdown pattern used for Forms in
// ComposeForm.tsx, generalized so it can also submit as plain repeated-name
// form fields (FormData.getAll(name)), which is what the plain
// <form action={...}> server actions here already expect from what used to
// be checkboxes. Picking an option adds it immediately (no separate Add
// step) — the dropdown always shows `placeholder` rather than a pending
// selection, since there's nothing left pending once picked.
export default function MultiSelectField({
  name,
  label,
  helperText,
  options,
  initialSelectedIds = [],
  placeholder,
  searchPlaceholder = "Search…",
  onSelectionChange,
}: {
  name: string;
  label: string;
  helperText?: string;
  options: SelectDropdownOption[];
  initialSelectedIds?: string[];
  placeholder: string;
  searchPlaceholder?: string;
  // Fires with the full new selection on every add/remove — for callers
  // that want to persist immediately (no separate Save step) instead of
  // relying on this field's hidden inputs being read from a surrounding
  // <form> on submit.
  onSelectionChange?: (selectedIds: string[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  const remove = (id: string) => {
    setSelectedIds((current) => {
      const next = current.filter((i) => i !== id);
      onSelectionChange?.(next);
      return next;
    });
  };

  const add = (id: string) => {
    if (selectedIds.includes(id)) return;
    setSelectedIds((current) => {
      const next = [...current, id];
      onSelectionChange?.(next);
      return next;
    });
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

      <SelectDropdown
        options={options.filter((o) => !selectedIds.includes(o.id))}
        value=""
        onChange={add}
        placeholder={placeholder}
        searchable
        searchPlaceholder={searchPlaceholder}
      />
    </div>
  );
}
