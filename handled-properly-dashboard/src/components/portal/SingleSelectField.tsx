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
}: {
  name: string;
  label: string;
  helperText?: string;
  options: SelectDropdownOption[];
  initialSelectedId?: string;
  placeholder: string;
  searchPlaceholder?: string;
}) {
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const selectedOption = options.find((o) => o.id === selectedId);

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
              onClick={() => setSelectedId("")}
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
        onChange={setSelectedId}
        placeholder={placeholder}
        searchable
        searchPlaceholder={searchPlaceholder}
      />
    </div>
  );
}
