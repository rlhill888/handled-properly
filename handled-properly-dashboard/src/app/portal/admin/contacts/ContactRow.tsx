"use client";

import { useState, useTransition } from "react";
import { setContactCategories } from "./actions";
import SelectDropdown from "@/components/portal/SelectDropdown";
import styles from "@/styles/admin-shared.module.css";

export type ContactRowData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isClient: boolean;
  isStaff: boolean;
  categoryIds: string[];
  attendingEventNames: string[];
};

export default function ContactRow({
  contact,
  allCategories,
}: {
  contact: ContactRowData;
  allCategories: { id: string; name: string }[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(contact.categoryIds);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const saveCategories = (next: string[]) => {
    setSelectedCategoryIds(next);
    startTransition(async () => {
      const result = await setContactCategories(contact.id, next);
      if (result?.error) setError(result.error);
    });
  };

  const addCategory = (categoryId: string) => {
    if (!categoryId || selectedCategoryIds.includes(categoryId)) return;
    saveCategories([...selectedCategoryIds, categoryId]);
  };

  const removeCategory = (categoryId: string) => {
    saveCategories(selectedCategoryIds.filter((id) => id !== categoryId));
  };

  return (
    <div className={styles.accordionItem}>
      <button
        type="button"
        className={styles.accordionHeader}
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <span className={styles.accordionTitle}>{contact.name}</span>
        <div className={styles.metaRow} style={{ marginLeft: "auto", marginRight: 8 }}>
          {contact.isStaff && <span className={styles.badge}>Staff</span>}
          {contact.isClient && <span className={styles.badgeMuted}>Client</span>}
        </div>
        <span
          className={`${styles.accordionChevron} ${expanded ? styles.accordionChevronOpen : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {expanded && (
        <div className={styles.accordionBody}>
          {error && <p className={styles.error}>{error}</p>}

          <table className={`${styles.table} ${styles.keyValueTable}`}>
            <tbody>
              <tr>
                <td>Email</td>
                <td>{contact.email}</td>
              </tr>
              <tr>
                <td>Phone</td>
                <td>{contact.phone || "—"}</td>
              </tr>
            </tbody>
          </table>

          {(contact.isClient || contact.isStaff) && (
            <div className={styles.metaRow}>
              {contact.isClient && <span className={styles.badge}>Client</span>}
              {contact.isStaff && <span className={styles.badge}>Staff</span>}
            </div>
          )}

          <div>
            <span className={styles.label}>Categories</span>
            {selectedCategoryIds.length > 0 && (
              <div className={styles.metaRow} style={{ marginTop: 8 }}>
                {selectedCategoryIds.map((categoryId) => {
                  const category = allCategories.find((c) => c.id === categoryId);
                  return category ? (
                    <span key={category.id} className={styles.pill}>
                      {category.name}
                      <button
                        type="button"
                        className={styles.pillDelete}
                        aria-label={`Remove ${category.name}`}
                        disabled={isPending}
                        onClick={() => removeCategory(category.id)}
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
            {allCategories.length === 0 ? (
              <p className={styles.emptyState} style={{ marginTop: 8 }}>
                No categories yet — add one above.
              </p>
            ) : (
              <div style={{ marginTop: 8 }}>
                <SelectDropdown
                  options={allCategories
                    .filter((c) => !selectedCategoryIds.includes(c.id))
                    .map((c) => ({ id: c.id, label: c.name }))}
                  value=""
                  onChange={addCategory}
                  placeholder="Add a category…"
                  searchable
                  searchPlaceholder="Search categories…"
                />
              </div>
            )}
          </div>

          {contact.attendingEventNames.length > 0 && (
            <div>
              <span className={styles.label}>Event attendance</span>
              <div className={styles.metaRow} style={{ marginTop: 8 }}>
                {contact.attendingEventNames.map((name) => (
                  <span key={name} className={styles.pill}>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
