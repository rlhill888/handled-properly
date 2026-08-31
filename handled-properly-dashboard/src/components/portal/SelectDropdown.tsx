"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./SelectDropdown.module.css";

// searchText is extra text matched by the search box but never displayed —
// e.g. a staff member's roster tags, so "Catering" finds them by skill even
// though their label is just their name.
export type SelectDropdownOption = { id: string; label: string; searchText?: string };

export default function SelectDropdown({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  createLabel,
  createHref,
  onCreate,
  searchable,
  searchPlaceholder = "Search…",
}: {
  options: SelectDropdownOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  disabled?: boolean;
  createLabel?: string;
  createHref?: string;
  onCreate?: () => void;
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Closes the menu and clears any in-progress search, so reopening starts
  // fresh rather than showing a stale filter.
  const closeMenu = () => {
    setOpen(false);
    setSearch("");
  };

  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const selected = options.find((o) => o.id === value);
  const query = search.trim().toLowerCase();
  const visibleOptions =
    searchable && query
      ? options.filter(
          (o) =>
            o.label.toLowerCase().includes(query) || o.searchText?.toLowerCase().includes(query)
        )
      : options;

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
        disabled={disabled}
        onClick={() => (open ? closeMenu() : setOpen(true))}
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
        <div className={styles.menu}>
          {searchable && (
            <input
              type="search"
              className={styles.searchInput}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          )}
          <ul className={styles.optionList} role="listbox" id={listboxId}>
            {visibleOptions.length === 0 && (
              <li className={styles.empty}>
                {query ? `No matches for "${search.trim()}"` : "Nothing available"}
              </li>
            )}
            {visibleOptions.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  className={`${styles.option} ${option.id === value ? styles.optionActive : ""}`}
                  role="option"
                  aria-selected={option.id === value}
                  onClick={() => {
                    onChange(option.id);
                    closeMenu();
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
                      closeMenu();
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
        </div>
      )}
    </div>
  );
}
