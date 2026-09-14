"use client";

import { useState } from "react";
import SelectDropdown, { type SelectDropdownOption } from "./SelectDropdown";
import styles from "@/styles/admin-shared.module.css";

// Same searchable-dropdown-plus-pill look as MultiSelectField, capped at a
// single selection — for the plain <form action={...}> server actions here,
// which read this back via FormData.get(name) rather than getAll.
export default function SingleSelectField({
  name,
  label,
  helperText,
  options,
  initialSelectedId = "",
  placeholder,
  searchPlaceholder = "Search…",
  onChange,
}: {
  name: string;
  label: string;
  helperText?: string;
  options: SelectDropdownOption[];
  initialSelectedId?: string;
  placeholder: string;
  searchPlaceholder?: string;
  // Opt-in — lets a caller mirror the selection into its own state (e.g. to
  // disable a submit button until something's chosen) without every
  // existing caller needing to pass one.
  onChange?: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const selectedOption = options.find((o) => o.id === selectedId);

  const select = (id: string) => {
    setSelectedId(id);
    onChange?.(id);
  };

  return (
    <div className={styles.field}>
      <span className={styles.label}>
        {label} {helperText && <span className={styles.optional}>{helperText}</span>}
      </span>

      {selectedOption && (
        <div className={styles.metaRow}>
          <span className={styles.pill}>
            {selectedOption.label}
            <button
              type="button"
              className={styles.pillDelete}
              aria-label={`Remove ${selectedOption.label}`}
              onClick={() => select("")}
            >
              ×
            </button>
          </span>
        </div>
      )}

      <input type="hidden" name={name} value={selectedId} />

      <SelectDropdown
        options={options.filter((o) => o.id !== selectedId)}
        value=""
        onChange={select}
        placeholder={placeholder}
        searchable
        searchPlaceholder={searchPlaceholder}
      />
    </div>
  );
}
