import { useEffect, type RefObject } from "react";

// While an AI dialog/full-screen loading overlay is up, both are already
// position:fixed/full-viewport so mouse clicks can't reach anything behind
// them — but keyboard focus can still Tab past them to reach controls
// elsewhere on the page (e.g. the sidebar nav), which a sighted user
// wouldn't see happening. Locks background scroll and traps Tab/Shift+Tab
// within `containerRef` by cycling between its first and last focusable
// elements (redirecting focus to the container itself isn't enough — since
// it's not part of the normal tab order, the very next Tab press just walks
// past it and escapes again).
export function useFocusTrap(active: boolean, containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active) return;

    document.body.style.overflow = "hidden";

    const getFocusable = (): HTMLElement[] => {
      if (!containerRef.current) return [];
      const selector =
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.from(containerRef.current.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => el.offsetParent !== null,
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const activeIsInside = containerRef.current?.contains(active) ?? false;

      if (e.shiftKey) {
        if (!activeIsInside || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (!activeIsInside || active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
