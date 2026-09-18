"use client";

import { useState, useTransition } from "react";
import { deleteValue, moveValue } from "./actions";
import Modal from "@/components/portal/Modal";
import EditValueForm from "./EditValueForm";
import styles from "@/styles/admin-shared.module.css";
import type { AboutValue } from "@/lib/data/site-content";

export default function ValueList({ items }: { items: AboutValue[] }) {
  const [editing, setEditing] = useState<AboutValue | null>(null);
  const [, startTransition] = useTransition();

  const handleDelete = (item: AboutValue) => {
    if (!confirm(`Remove "${item.title}"?`)) return;
    startTransition(() => {
      deleteValue(item.id);
    });
  };

  const handleMove = (item: AboutValue, direction: "up" | "down") => {
    startTransition(() => {
      moveValue(item.id, direction);
    });
  };

  if (items.length === 0) {
    return <p className={styles.emptyState}>No values yet.</p>;
  }

  return (
    <>
      <div className={styles.itemGrid}>
        {items.map((item, index) => (
          <div key={item.id} className={styles.itemCard}>
            <div className={styles.itemCardBody}>
              <p className={styles.itemCardTitle}>{item.title}</p>
              {item.description && <p className={styles.itemCardDescription}>{item.description}</p>}
            </div>
            <div className={styles.itemCardActions}>
              <div className={styles.itemCardReorder}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => handleMove(item, "up")}
                  disabled={index === 0}
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => handleMove(item, "down")}
                  disabled={index === items.length - 1}
                  aria-label="Move down"
                >
                  ↓
                </button>
              </div>
              <button type="button" className={styles.secondaryButton} onClick={() => setEditing(item)}>
                Edit
              </button>
              <button type="button" className={styles.dangerButton} onClick={() => handleDelete(item)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit Value">
        {editing && <EditValueForm item={editing} />}
      </Modal>
    </>
  );
}
