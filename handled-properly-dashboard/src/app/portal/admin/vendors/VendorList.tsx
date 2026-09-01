"use client";

import { useState } from "react";
import styles from "@/styles/admin-shared.module.css";

export type VendorRowData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  category: string;
};

export default function VendorList({ vendors }: { vendors: VendorRowData[] }) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const matches = (vendor: VendorRowData) =>
    !q ||
    vendor.name.toLowerCase().includes(q) ||
    vendor.email.toLowerCase().includes(q) ||
    vendor.category.toLowerCase().includes(q);

  const visible = vendors.filter(matches);

  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="vendor-search">
          Search
        </label>
        <input
          id="vendor-search"
          type="search"
          className={styles.input}
          placeholder="Search by name, email, or category…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {visible.length === 0 ? (
        <p className={styles.emptyState}>No vendors yet.</p>
      ) : (
        <table className={`${styles.table} ${styles.cardRows}`}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((vendor) => (
              <tr key={vendor.id}>
                <td data-label="Name" className={styles.cardPrimaryCell}>
                  {vendor.name}
                </td>
                <td data-label="Email">{vendor.email}</td>
                <td data-label="Phone">{vendor.phone || "—"}</td>
                <td data-label="Category">
                  <span className={styles.pill}>{vendor.category}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
