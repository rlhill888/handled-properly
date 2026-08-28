"use client";

import { useMemo, useState } from "react";
import ContactRow, { type ContactRowData } from "./ContactRow";
import styles from "@/styles/admin-shared.module.css";

export default function ContactsList({
  contacts,
  allCategories,
  activeEvents,
}: {
  contacts: ContactRowData[];
  allCategories: { id: string; name: string }[];
  activeEvents: { id: string; name: string }[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(q) || contact.email.toLowerCase().includes(q)
    );
  }, [contacts, query]);

  return (
    <div>
      <div className={styles.searchField}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts by name or email…"
          className={styles.searchInput}
          aria-label="Search contacts"
        />
      </div>

      {filtered.length === 0 ? (
        <p className={styles.emptyState}>No contacts match.</p>
      ) : (
        <div className={styles.accordionList}>
          {filtered.map((contact) => (
            <ContactRow
              key={contact.id}
              contact={contact}
              allCategories={allCategories}
              activeEvents={activeEvents}
            />
          ))}
        </div>
      )}
    </div>
  );
}
