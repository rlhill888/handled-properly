"use client";

import { useRouter } from "next/navigation";
import styles from "./RequestDetail.module.css";

function BackArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

// Goes to wherever the user actually came from (the Requests tab, the
// event's Requests dropdown, a direct link, etc.) rather than always
// landing on the event page — falls back to fallbackHref only when there's
// no in-app history to go back to (e.g. a fresh tab or a bookmark).
export default function BackButton({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={styles.backLink}
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
    >
      <BackArrowIcon />
    </button>
  );
}
