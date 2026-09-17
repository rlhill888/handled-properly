"use client";

import { useState, useTransition } from "react";
import { deleteFeaturedItem, moveFeaturedItem } from "./actions";
import Modal from "@/components/portal/Modal";
import EditFeaturedItemForm from "./EditFeaturedItemForm";
import styles from "@/styles/admin-shared.module.css";
import type { FeaturedItem } from "@/lib/data/site-content";

export default function FeaturedItemList({ items }: { items: FeaturedItem[] }) {
  const [editing, setEditing] = useState<FeaturedItem | null>(null);
  const [, startTransition] = useTransition();

  const handleDelete = (item: FeaturedItem) => {
    if (!confirm(`Remove "${item.title}"?`)) return;
    startTransition(() => {
      deleteFeaturedItem(item.id);
    });
  };

  const handleMove = (item: FeaturedItem, direction: "up" | "down") => {
    startTransition(() => {
      moveFeaturedItem(item.id, direction);
    });
  };

  if (items.length === 0) {
    return <p className={styles.emptyState}>No featured items yet.</p>;
  }

  return (
    <>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Image</th>
            <th>Title</th>
            <th>Link</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id}>
              <td>
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" style={{ height: 36, width: 36, objectFit: "cover" }} />
                ) : (
                  <span className={styles.emptyState}>—</span>
                )}
              </td>
              <td>{item.title}</td>
              <td>{item.linkUrl ?? <span className={styles.emptyState}>—</span>}</td>
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
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setEditing(item)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={styles.dangerButton}
                    onClick={() => handleDelete(item)}
                  >
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit Featured Item">
        {editing && <EditFeaturedItemForm item={editing} />}
      </Modal>
    </>
  );
}
