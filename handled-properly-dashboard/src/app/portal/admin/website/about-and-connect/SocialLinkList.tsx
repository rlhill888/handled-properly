"use client";

import { useState, useTransition } from "react";
import { deleteSocialLink, moveSocialLink } from "./actions";
import Modal from "@/components/portal/Modal";
import EditSocialLinkForm from "./EditSocialLinkForm";
import styles from "@/styles/admin-shared.module.css";
import type { SocialLink } from "@/lib/data/site-content";

export default function SocialLinkList({ links }: { links: SocialLink[] }) {
  const [editing, setEditing] = useState<SocialLink | null>(null);
  const [, startTransition] = useTransition();

  const handleDelete = (link: SocialLink) => {
    if (!confirm("Remove this social link?")) return;
    startTransition(() => {
      deleteSocialLink(link.id);
    });
  };

  const handleMove = (link: SocialLink, direction: "up" | "down") => {
    startTransition(() => {
      moveSocialLink(link.id, direction);
    });
  };

  if (links.length === 0) {
    return <p className={styles.emptyState}>No social links yet.</p>;
  }

  return (
    <>
      <div className={styles.itemGrid}>
        {links.map((link, index) => (
          <div key={link.id} className={styles.itemCard}>
            <div className={styles.itemCardHeader}>
              <span className={`${styles.itemCardMedia} ${styles.itemCardMediaContain}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={link.iconUrl} alt="" />
              </span>
              <div className={styles.itemCardBody}>
                <p className={styles.itemCardTitle}>{link.url}</p>
              </div>
            </div>
            <div className={styles.itemCardActions}>
              <div className={styles.itemCardReorder}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => handleMove(link, "up")}
                  disabled={index === 0}
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => handleMove(link, "down")}
                  disabled={index === links.length - 1}
                  aria-label="Move down"
                >
                  ↓
                </button>
              </div>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setEditing(link)}
              >
                Edit
              </button>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={() => handleDelete(link)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit Social Link">
        {editing && <EditSocialLinkForm link={editing} />}
      </Modal>
    </>
  );
}
