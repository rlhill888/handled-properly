"use client";

import { useState } from "react";
import styles from "./EventDetailTabs.module.css";

// Splits the event tracker page's cards into what the Client sees in the
// Client Portal (Details, Event Tasks, Requests, Documentation, Vendors)
// versus everything staff-only (Assignments, Roster, Forms). The panels
// themselves are Server Components rendered by the page and passed down as
// children — this component only owns which one is visible, via `hidden`
// rather than unmounting, so switching tabs doesn't lose state inside a
// panel (an open Roster picker, expanded Request comments, etc.).
export default function EventDetailTabs({
  clientView,
  internal,
}: {
  clientView: React.ReactNode;
  internal: React.ReactNode;
}) {
  const [tab, setTab] = useState<"client" | "internal">("client");

  return (
    <div>
      <div className={styles.tabRow} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "client"}
          className={tab === "client" ? styles.tabActive : styles.tab}
          onClick={() => setTab("client")}
        >
          Client View
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "internal"}
          className={tab === "internal" ? styles.tabActive : styles.tab}
          onClick={() => setTab("internal")}
        >
          Internal
        </button>
      </div>

      <div className={styles.panels} hidden={tab !== "client"}>
        {clientView}
      </div>
      <div className={styles.panels} hidden={tab !== "internal"}>
        {internal}
      </div>
    </div>
  );
}
