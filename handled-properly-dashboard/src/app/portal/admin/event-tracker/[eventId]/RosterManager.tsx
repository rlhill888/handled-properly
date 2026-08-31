"use client";

import { useState, useTransition } from "react";
import {
  addToRoster,
  removeFromRoster,
  deleteRosterCategory,
  setRosterEntryCategories,
} from "../actions";
import AddModalButton from "@/components/portal/AddModalButton";
import NewRosterCategoryForm from "./NewRosterCategoryForm";
import SelectDropdown from "@/components/portal/SelectDropdown";
import Modal from "@/components/portal/Modal";
import NewStaffForm from "@/app/portal/admin/staff/NewStaffForm";
import { useRouter } from "next/navigation";
import styles from "@/styles/admin-shared.module.css";

export type StaffOption = { id: string; name: string; email: string; tagNames: string[] };
export type RosterCategoryOption = { id: string; name: string };
export type RosterMemberData = StaffOption & { categoryIds: string[] };

export default function RosterManager({
  eventId,
  rosterMembers,
  availableStaff,
  categories,
  isLocked,
}: {
  eventId: string;
  rosterMembers: RosterMemberData[];
  availableStaff: StaffOption[];
  categories: RosterCategoryOption[];
  isLocked: boolean;
}) {
  const router = useRouter();
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberCategoryIds, setMemberCategoryIds] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(rosterMembers.map((m) => [m.id, m.categoryIds]))
  );

  const editingMember = rosterMembers.find((m) => m.id === editingMemberId) ?? null;

  const handleAdd = () => {
    if (!selectedStaffId) return;
    setError(null);
    startTransition(async () => {
      const result = await addToRoster(eventId, selectedStaffId);
      if (result?.error) setError(result.error);
      else setSelectedStaffId("");
    });
  };

  const handleRemove = (staffId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await removeFromRoster(eventId, staffId);
      if (result?.error) setError(result.error);
    });
  };

  const handleDeleteCategory = (categoryId: string, name: string) => {
    if (!confirm(`Delete "${name}"? It will be removed from any staff tagged with it.`)) return;
    startTransition(() => {
      deleteRosterCategory(eventId, categoryId);
    });
  };

  const toggleMemberCategory = (staffId: string, categoryId: string) => {
    const current = memberCategoryIds[staffId] ?? [];
    const next = current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId];
    setMemberCategoryIds((prev) => ({ ...prev, [staffId]: next }));
    setError(null);
    startTransition(async () => {
      const result = await setRosterEntryCategories(eventId, staffId, next);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className={styles.form}>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.cardHeaderRow}>
        <span className={styles.label} style={{ marginBottom: 0 }}>
          Categories
        </span>
        {!isLocked && (
          <AddModalButton label="Add Category" modalTitle="Add Roster Category">
            <NewRosterCategoryForm eventId={eventId} />
          </AddModalButton>
        )}
      </div>

      {categories.length === 0 ? (
        <p className={styles.emptyState}>No categories yet.</p>
      ) : (
        <div className={styles.metaRow}>
          {categories.map((category) => (
            <span key={category.id} className={styles.pill}>
              {category.name}
              {!isLocked && (
                <button
                  type="button"
                  className={styles.pillDelete}
                  onClick={() => handleDeleteCategory(category.id, category.name)}
                  aria-label={`Delete ${category.name}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {rosterMembers.length === 0 ? (
        <p className={styles.emptyState}>No staff on this event's roster yet.</p>
      ) : (
        <table className={`${styles.table} ${styles.cardRows}`}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Categories</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rosterMembers.map((member) => (
              <tr key={member.id}>
                <td data-label="Name" className={styles.cardPrimaryCell}>
                  {member.name}
                </td>
                <td data-label="Email">{member.email}</td>
                <td data-label="Categories">
                  <div className={styles.metaRow} style={{ alignItems: "center" }}>
                    {(memberCategoryIds[member.id] ?? []).map((categoryId) => {
                      const category = categories.find((c) => c.id === categoryId);
                      return category ? (
                        <span key={category.id} className={styles.pill}>
                          {category.name}
                        </span>
                      ) : null;
                    })}
                    {!isLocked && categories.length > 0 && (
                      <button
                        type="button"
                        className={styles.backLink}
                        aria-label={`Edit categories for ${member.name}`}
                        onClick={() => setEditingMemberId(member.id)}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
                <td className={styles.cardActionCell}>
                  {!isLocked && (
                    <button
                      type="button"
                      className={styles.dangerButton}
                      disabled={isPending}
                      onClick={() => handleRemove(member.id)}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!isLocked && (
        <div className={styles.formRow}>
          <SelectDropdown
            options={availableStaff.map((staff) => ({
              id: staff.id,
              label: `${staff.name} (${staff.email})`,
              searchText: staff.tagNames.join(" "),
            }))}
            value={selectedStaffId}
            onChange={setSelectedStaffId}
            placeholder="Add staff to roster…"
            searchable
            searchPlaceholder="Search staff or tag…"
            createLabel="Invite New Staff"
            onCreate={() => setInviteOpen(true)}
          />
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={!selectedStaffId || isPending}
            onClick={handleAdd}
          >
            Add
          </button>
        </div>
      )}

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Staff">
        <NewStaffForm
          onCreated={() => {
            setInviteOpen(false);
            router.refresh();
          }}
        />
      </Modal>

      <Modal
        open={editingMemberId !== null}
        onClose={() => setEditingMemberId(null)}
        title={editingMember ? `Categories — ${editingMember.name}` : "Categories"}
      >
        {editingMember && (
          <div className={styles.metaRow}>
            {categories.map((category) => {
              const assigned = (memberCategoryIds[editingMember.id] ?? []).includes(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  className={assigned ? styles.badge : styles.badgeMuted}
                  disabled={isPending}
                  onClick={() => toggleMemberCategory(editingMember.id, category.id)}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
