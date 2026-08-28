"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./SelectDropdown.module.css";

export type SelectDropdownOption = { id: string; label: string };

export default function SelectDropdown({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  createLabel,
  createHref,
  onCreate,
}: {
  options: SelectDropdownOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  disabled?: boolean;
  createLabel?: string;
  createHref?: string;
  onCreate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const selected = options.find((o) => o.id === value);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
      >
        <span className={selected ? styles.triggerValue : styles.triggerPlaceholder}>
          {selected ? selected.label : placeholder}
        </span>
        <span className={styles.chevron} aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <ul className={styles.menu} role="listbox" id={listboxId}>
          {options.length === 0 && (
            <li className={styles.empty}>Nothing available</li>
          )}
          {options.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                className={`${styles.option} ${option.id === value ? styles.optionActive : ""}`}
                role="option"
                aria-selected={option.id === value}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}

          {createLabel && (
            <li className={styles.createRow}>
              {createHref ? (
                <a href={createHref} className={styles.createOption}>
                  <span className={styles.createPlus} aria-hidden="true">
                    +
                  </span>
                  {createLabel}
                </a>
              ) : (
                <button
                  type="button"
                  className={styles.createOption}
                  onClick={() => {
                    setOpen(false);
                    onCreate?.();
                  }}
                >
                  <span className={styles.createPlus} aria-hidden="true">
                    +
                  </span>
                  {createLabel}
                </button>
              )}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
