export default function PeopleIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M2 21v-1a6 6 0 0 1 12 0v1" />
      <path d="M17 11a3 3 0 1 0 0-6" />
      <path d="M22 21v-1a5 5 0 0 0-4-4.9" />
    </svg>
  );
}
