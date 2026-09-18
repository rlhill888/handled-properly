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
      <div className={styles.itemGrid}>
        {items.map((item, index) => (
          <div key={item.id} className={styles.itemCard}>
            <div className={styles.itemCardHeader}>
              <span className={styles.itemCardMedia}>
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" />
                ) : (
                  "No image"
                )}
              </span>
              <div className={styles.itemCardBody}>
                <p className={styles.itemCardTitle}>{item.title}</p>
                <p className={styles.itemCardSubtitle}>{item.linkUrl ?? "No link"}</p>
              </div>
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
          </div>
        ))}
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit Featured Item">
        {editing && <EditFeaturedItemForm item={editing} />}
      </Modal>
    </>
  );
}
