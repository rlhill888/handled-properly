"use client";

import { useState, type ReactNode } from "react";
import SelectDropdown, { type SelectDropdownOption } from "./SelectDropdown";
import { getInitials } from "@/lib/get-initials";
import styles from "@/styles/admin-shared.module.css";
import cardStyles from "@/styles/assignments-board.module.css";

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
  icon,
  helperText,
  options,
  initialSelectedIds = [],
  placeholder,
  searchPlaceholder = "Search…",
  onSelectionChange,
  chipVariant = "pill",
}: {
  name: string;
  label: string;
  // Renders before the label, using the same icon-labeled-row look as the
  // Assignment cards' display fields — opt-in, unset by every existing
  // caller, so nothing else in the app changes visually.
  icon?: ReactNode;
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
  // "avatar" renders each selection the same way Assigned-to chips read
  // elsewhere in the portal (initials circle + name) instead of a plain
  // text pill — for selecting people specifically, e.g. Assignees.
  chipVariant?: "pill" | "avatar";
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
      <span className={icon ? cardStyles.fieldRowLabel : styles.label}>
        {icon}
        {label} {helperText && <span className={styles.optional}>{helperText}</span>}
      </span>

      {selectedIds.length > 0 && (
        // metaRow (not cardStyles.avatarRow) even for avatar chips — that
        // row is right-aligned for its own use nested in a display field's
        // value column, which doesn't fit this field's plain left-aligned,
        // full-width layout above the picker.
        <div className={styles.metaRow}>
          {selectedIds.map((id) => {
            const option = options.find((o) => o.id === id);
            const chipLabel = option?.label ?? id;
            return chipVariant === "avatar" ? (
              <span key={id} className={cardStyles.avatarChip}>
                <span className={cardStyles.avatarCircle}>{getInitials(chipLabel)}</span>
                <span className={cardStyles.avatarName}>{chipLabel}</span>
                <button
                  type="button"
                  className={styles.pillDelete}
                  aria-label={`Remove ${chipLabel}`}
                  onClick={() => remove(id)}
                >
                  ×
                </button>
                <input type="hidden" name={name} value={id} />
              </span>
            ) : (
              <span key={id} className={styles.pill}>
                {chipLabel}
                <button
                  type="button"
                  className={styles.pillDelete}
                  aria-label={`Remove ${chipLabel}`}
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
