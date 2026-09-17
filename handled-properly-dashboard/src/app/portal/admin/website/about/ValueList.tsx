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
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id}>
              <td>{item.title}</td>
              <td>{item.description || <span className={styles.emptyState}>—</span>}</td>
              <td>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => handleMove(item, "up")}
                    disabled={index === 0}
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => handleMove(item, "down")}
                    disabled={index === items.length - 1}
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button type="button" className={styles.secondaryButton} onClick={() => setEditing(item)}>
                    Edit
                  </button>
                  <button type="button" className={styles.dangerButton} onClick={() => handleDelete(item)}>
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit Value">
        {editing && <EditValueForm item={editing} />}
      </Modal>
    </>
  );
}
