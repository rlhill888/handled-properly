"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAssignment } from "../assignments/actions";
import { linkVendorNeedsToAssignment } from "./actions";
import ModalButton from "@/components/portal/ModalButton";
import MultiSelectField from "@/components/portal/MultiSelectField";
import SingleSelectField from "@/components/portal/SingleSelectField";
import LinkIcon from "@/components/portal/LinkIcon";
import PackageIcon from "@/components/portal/PackageIcon";
import type { VendorEventDetailData } from "./data";
import styles from "@/styles/admin-shared.module.css";

type View = "list" | "create" | "associate";

// The admin's rollup of every vendor's requested items, opened from a
// button on the Vendor Details card — the same `needs` data VendorDetailRow
// shows per-vendor, just all in one place so the admin doesn't have to open
// every vendor's row to see what's outstanding. "Associate items with
// assignments" reveals a checkbox per item; selecting any surfaces two
// actions — spin up a new Assignment for them, or fold them into one that
// already exists — so a requested item turns into staff-side work without
// the admin retyping it on the Assignments board.
export default function VendorRequestedItemsList({
  eventId,
  vendors,
  existingAssignments,
  rosterStaff,
}: {
  eventId: string;
  vendors: VendorEventDetailData[];
  existingAssignments: { id: string; title: string }[];
  rosterStaff: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<View>("list");
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedVendorIds, setExpandedVendorIds] = useState<Set<string>>(
    () => new Set(vendors.filter((v) => v.needs.length > 0).map((v) => v.contactId))
  );
  const [title, setTitle] = useState("");
  const [assignmentId, setAssignmentId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const allNeeds = vendors.flatMap((v) => v.needs.map((n) => ({ ...n, vendorName: v.name })));
  const selectedNeeds = allNeeds.filter((n) => selectedIds.has(n.id));
  // Selected items grouped under their vendor, in first-seen order — for the
  // "Selected items" card shown on the create/associate sub-views.
  const selectedByVendor: { vendorName: string; needs: typeof selectedNeeds }[] = [];
  for (const need of selectedNeeds) {
    const group = selectedByVendor.find((g) => g.vendorName === need.vendorName);
    if (group) group.needs.push(need);
    else selectedByVendor.push({ vendorName: need.vendorName, needs: [need] });
  }
  const vendorsWithNeeds = vendors.filter((v) => v.needs.length > 0);
  const vendorsWithoutNeeds = vendors.filter((v) => v.needs.length === 0);

  const toggleSelecting = () => {
    if (selecting) setSelectedIds(new Set());
    setSelecting((s) => !s);
  };

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpanded = (contactId: string) => {
    setExpandedVendorIds((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) next.delete(contactId);
      else next.add(contactId);
      return next;
    });
  };

  const resetToList = () => {
    setView("list");
    setSelecting(false);
    setSelectedIds(new Set());
    setTitle("");
    setAssignmentId("");
    setError(null);
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createAssignment(eventId, null, null, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
        resetToList();
      }
    });
  };

  const handleAssociate = () => {
    if (!assignmentId) return;
    setError(null);
    startTransition(async () => {
      const result = await linkVendorNeedsToAssignment(eventId, assignmentId, Array.from(selectedIds));
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
        resetToList();
      }
    });
  };

  const selectedItemsCard = (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <h3 className={styles.sectionHeading} style={{ marginBottom: 0 }}>
          Selected items
        </h3>
        <span className={styles.pill}>{selectedIds.size}</span>
      </div>
      <div className={styles.accordionItem}>
        {selectedByVendor.map((group) => (
          <div key={group.vendorName}>
            <div
              style={{
                padding: "10px 16px",
                background: "var(--surface)",
                borderBottom: "1px solid var(--border)",
                fontSize: 14,
                fontWeight: 700,
                color: "var(--foreground)",
              }}
            >
              {group.vendorName}
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {group.needs.map((need) => (
                <li
                  key={need.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 16px",
                    borderBottom: "1px solid var(--border)",
                    fontSize: 13,
                  }}
                >
                  <span style={{ display: "flex", color: "var(--muted)" }}>
                    <PackageIcon size={16} />
                  </span>
                  {need.item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );

  let content: React.ReactNode;

  if (view === "create") {
    content = (
      <form onSubmit={handleCreate} className={styles.form}>
        <h2 className={styles.cardHeading} style={{ marginBottom: 0 }}>
          Create assignment
        </h2>
        <p className={styles.description} style={{ margin: 0 }}>
          Give the new assignment a title — the selected items will be linked to it.
        </p>
        {error && <p className={styles.error}>{error}</p>}
        {selectedItemsCard}
        {selectedIds.size > 0 &&
          Array.from(selectedIds).map((id) => <input key={id} type="hidden" name="vendor_need_ids" value={id} />)}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="new-assignment-title">
            Title
          </label>
          <input
            id="new-assignment-title"
            name="title"
            required
            className={styles.input}
            placeholder="Set up chairs"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="new-assignment-description">
            Description <span className={styles.optional}>(optional)</span>
          </label>
          <textarea id="new-assignment-description" name="description" className={styles.textarea} />
        </div>
        {rosterStaff.length > 0 && (
          <MultiSelectField
            name="assignee_ids"
            label="Assignees"
            helperText="(optional)"
            options={rosterStaff.map((staff) => ({ id: staff.id, label: staff.name }))}
            placeholder="Add an assignee…"
            searchPlaceholder="Search staff…"
          />
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            borderTop: "1px solid var(--border)",
            paddingTop: 16,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            {selectedIds.size} item{selectedIds.size === 1 ? "" : "s"} selected
          </span>
          <button
            type="submit"
            className={styles.primaryButton}
            style={{ borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 8 }}
            disabled={!title.trim() || isPending}
          >
            {isPending ? "Creating…" : "+ Create assignment"}
          </button>
        </div>
      </form>
    );
  } else if (view === "associate") {
    content = (
      <div className={styles.form}>
        <h2 className={styles.cardHeading} style={{ marginBottom: 0 }}>
          Link items to assignment
        </h2>
        <p className={styles.description} style={{ margin: 0 }}>
          Choose an assignment for the selected vendor items.
        </p>
        {error && <p className={styles.error}>{error}</p>}
        {selectedItemsCard}
        <SingleSelectField
          name="assignment_id"
          label="Assignment"
          options={existingAssignments.map((a) => ({ id: a.id, label: a.title }))}
          placeholder="Choose an assignment…"
          searchPlaceholder="Search assignments…"
          onChange={setAssignmentId}
        />
        <p className={styles.description} style={{ margin: 0 }}>
          {selectedIds.size === 1 ? "This item" : `All ${selectedIds.size} items`} will be linked to this
          assignment.
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            borderTop: "1px solid var(--border)",
            paddingTop: 16,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            {selectedIds.size} item{selectedIds.size === 1 ? "" : "s"} selected
          </span>
          <button
            type="button"
            className={styles.primaryButton}
            style={{ borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 8 }}
            disabled={!assignmentId || isPending}
            onClick={handleAssociate}
          >
            <LinkIcon size={14} />
            {isPending ? "Linking…" : `Link ${selectedIds.size} item${selectedIds.size === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    );
  } else if (vendors.length === 0) {
    content = <p className={styles.emptyState}>No vendors on this event yet.</p>;
  } else {
    content = (
      <div className={styles.form}>
        {error && <p className={styles.error}>{error}</p>}

        <p className={styles.description} style={{ margin: 0 }}>
          {allNeeds.length} item{allNeeds.length === 1 ? "" : "s"} • {vendorsWithNeeds.length} vendor
          {vendorsWithNeeds.length === 1 ? "" : "s"} requesting • {vendors.length} vendor
          {vendors.length === 1 ? "" : "s"} total
        </p>

        {vendorsWithNeeds.length > 0 && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div>
                <h3 className={styles.sectionHeading} style={{ marginBottom: selecting ? 4 : 0 }}>
                  {selecting ? "Select items" : "Requested items"}
                </h3>
                {selecting && (
                  <p className={styles.description} style={{ margin: 0 }}>
                    Choose items to link to an assignment.
                  </p>
                )}
              </div>
              {selecting ? (
                <button
                  type="button"
                  className={styles.link}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit" }}
                  onClick={toggleSelecting}
                >
                  Cancel selection
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.primaryButton}
                  style={{ borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 8 }}
                  onClick={toggleSelecting}
                >
                  <LinkIcon size={14} /> Associate items with assignments
                </button>
              )}
            </div>

            <div className={styles.accordionList}>
              {vendorsWithNeeds.map((vendor) => {
                const expanded = expandedVendorIds.has(vendor.contactId);
                return (
                  <div key={vendor.contactId} className={styles.accordionItem}>
                    <button
                      type="button"
                      className={styles.accordionHeader}
                      onClick={() => toggleExpanded(vendor.contactId)}
                      aria-expanded={expanded}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className={styles.accordionTitle}>{vendor.name}</span>
                        <span className={styles.pill}>
                          {vendor.needs.length} item{vendor.needs.length === 1 ? "" : "s"}
                        </span>
                      </span>
                      <span
                        className={`${styles.accordionChevron} ${expanded ? styles.accordionChevronOpen : ""}`}
                        aria-hidden="true"
                      >
                        ▾
                      </span>
                    </button>
                    {expanded && (
                      <div className={styles.accordionBody}>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                          {vendor.needs.map((need) => (
                            <li
                              key={need.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 8,
                                padding: "8px 10px",
                                margin: "0 -10px",
                                borderBottom: "1px solid var(--border)",
                                borderRadius: 4,
                                fontSize: 13,
                                background: selecting && selectedIds.has(need.id) ? "var(--surface)" : "transparent",
                              }}
                            >
                              <label
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  cursor: selecting ? "pointer" : "default",
                                }}
                              >
                                {selecting ? (
                                  <input
                                    type="checkbox"
                                    checked={selectedIds.has(need.id)}
                                    onChange={() => toggle(need.id)}
                                  />
                                ) : (
                                  <span style={{ display: "flex", color: "var(--muted)" }}>
                                    <PackageIcon size={16} />
                                  </span>
                                )}
                                {need.item}
                              </label>
                              {need.assignmentTitles.length > 0 && (
                                <span className={styles.optional}>→ {need.assignmentTitles.join(", ")}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {vendorsWithoutNeeds.length > 0 && (
          <div className={styles.accordionList}>
            <div className={styles.accordionItem}>
              <button
                type="button"
                className={styles.accordionHeader}
                onClick={() => toggleExpanded("no-requests")}
                aria-expanded={expandedVendorIds.has("no-requests")}
              >
                <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className={styles.accordionTitle}>No requests yet</span>
                    <span className={styles.pill}>{vendorsWithoutNeeds.length}</span>
                  </span>
                  <span className={styles.optional} style={{ fontWeight: 400 }}>
                    {vendorsWithoutNeeds.map((v) => v.name).join(", ")}
                  </span>
                </span>
                <span
                  className={`${styles.accordionChevron} ${
                    expandedVendorIds.has("no-requests") ? styles.accordionChevronOpen : ""
                  }`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>
              {expandedVendorIds.has("no-requests") && (
                <div className={styles.accordionBody}>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {vendorsWithoutNeeds.map((vendor) => (
                      <li
                        key={vendor.contactId}
                        style={{
                          padding: "8px 0",
                          borderBottom: "1px solid var(--border)",
                          fontSize: 13,
                        }}
                      >
                        {vendor.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {selecting && selectedIds.size > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              borderTop: "1px solid var(--border)",
              paddingTop: 16,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, fontWeight: 700 }}>
              {selectedIds.size} item{selectedIds.size === 1 ? "" : "s"} selected
              <button
                type="button"
                className={styles.link}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit" }}
                onClick={() => setSelectedIds(new Set())}
              >
                Clear
              </button>
            </span>
            <div className={styles.actions} style={{ marginTop: 0 }}>
              {existingAssignments.length > 0 && (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  style={{ borderRadius: 999 }}
                  onClick={() => setView("associate")}
                >
                  Add to assignment
                </button>
              )}
              <button
                type="button"
                className={styles.primaryButton}
                style={{ borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 6 }}
                onClick={() => setView("create")}
              >
                + New assignment
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <ModalButton
      label="Vendor's Requested Items"
      modalTitle={view === "list" ? "Vendor requests" : ""}
      titleVariant="heading"
      className={styles.secondaryButton}
      titleAction={
        view !== "list" ? (
          <button
            type="button"
            onClick={() => setView("list")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              font: "inherit",
              fontWeight: 700,
              fontSize: 14,
              color: "var(--muted)",
            }}
          >
            ← Back to items
          </button>
        ) : undefined
      }
    >
      {content}
    </ModalButton>
  );
}
