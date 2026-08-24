"use client";

import { useState, useTransition } from "react";
import { setContactCategories, addAttendance } from "./actions";
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
  activeEvents,
}: {
  contact: ContactRowData;
  allCategories: { id: string; name: string }[];
  activeEvents: { id: string; name: string }[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(contact.categoryIds);
  const [eventId, setEventId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleCategory = (categoryId: string) => {
    const next = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter((id) => id !== categoryId)
      : [...selectedCategoryIds, categoryId];
    setSelectedCategoryIds(next);
    startTransition(async () => {
      const result = await setContactCategories(contact.id, next);
      if (result?.error) setError(result.error);
    });
  };

  const handleAddAttendance = () => {
    if (!eventId) return;
    setError(null);
    startTransition(async () => {
      const result = await addAttendance(contact.id, eventId);
      if (result?.error) setError(result.error);
      else setEventId("");
    });
  };

  return (
    <>
      <tr>
        <td>{contact.name}</td>
        <td>{contact.email}</td>
        <td>{contact.phone || "—"}</td>
        <td>
          <div className={styles.metaRow}>
            {contact.isClient && <span className={styles.badge}>Client</span>}
            {contact.isStaff && <span className={styles.badge}>Staff</span>}
            {selectedCategoryIds.map((id) => {
              const category = allCategories.find((c) => c.id === id);
              return category ? (
                <span key={id} className={styles.pill}>
                  {category.name}
                </span>
              ) : null;
            })}
          </div>
        </td>
        <td>
          <button type="button" className={styles.secondaryButton} onClick={() => setExpanded((e) => !e)}>
            {expanded ? "Close" : "Manage"}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5}>
            <div className={styles.form}>
              {error && <p className={styles.error}>{error}</p>}

              <div>
                <span className={styles.label}>Categories</span>
                <div className={styles.metaRow} style={{ marginTop: 8 }}>
                  {allCategories.length === 0 && (
                    <span className={styles.emptyState}>No categories yet — add one above.</span>
                  )}
                  {allCategories.map((category) => (
                    <label key={category.id} className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(category.id)}
                        disabled={isPending}
                        onChange={() => toggleCategory(category.id)}
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <span className={styles.label}>Event attendance</span>
                <div className={styles.metaRow} style={{ marginTop: 8 }}>
                  {contact.attendingEventNames.length === 0 ? (
                    <span className={styles.emptyState}>Not tagged as an attendee anywhere yet.</span>
                  ) : (
                    contact.attendingEventNames.map((name) => (
                      <span key={name} className={styles.pill}>
                        {name}
                      </span>
                    ))
                  )}
                </div>
                <div className={styles.formRow} style={{ marginTop: 8 }}>
                  <select
                    className={styles.select}
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                  >
                    <option value="">Tag as attendee of…</option>
                    {activeEvents.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={!eventId || isPending}
                    onClick={handleAddAttendance}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
