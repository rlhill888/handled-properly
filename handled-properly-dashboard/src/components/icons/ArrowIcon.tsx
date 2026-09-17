// Replaces the Unicode "→"/"↗" glyphs previously used as button icons
// across the site -- those characters render as colorful emoji (not a
// plain text glyph) on iOS/some Android keyboards' default font, which
// looked out of place next to the rest of a button's plain text. An
// actual vector icon renders identically everywhere and inherits the
// surrounding text color via currentColor, same as the glyph did.
export default function ArrowIcon({
  direction = "right",
  size = 14,
  className,
}: {
  direction?: "right" | "up-right";
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {direction === "up-right" ? (
        <>
          <path d="M7 17L17 7" />
          <path d="M7 7h10v10" />
        </>
      ) : (
        <>
          <path d="M4 12h16" />
          <path d="M13 6l6 6-6 6" />
        </>
      )}
    </svg>
  );
}
