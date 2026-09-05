// ── Inline SVG icon set (stroke = currentColor) ─────────────────────────────

interface IconProps {
  className?: string;
}

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function IconPlay({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconPause({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconRestart({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
      <path d="M20.5 3.5v4.6h-4.6" />
    </svg>
  );
}

export function IconSoundOn({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M11 5 6.5 9H3v6h3.5L11 19z" fill="currentColor" stroke="none" />
      <path d="M15 9.2a4 4 0 0 1 0 5.6" />
      <path d="M17.8 6.5a8 8 0 0 1 0 11" />
    </svg>
  );
}

export function IconSoundOff({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M11 5 6.5 9H3v6h3.5L11 19z" fill="currentColor" stroke="none" />
      <path d="m15.5 9.5 5 5" />
      <path d="m20.5 9.5-5 5" />
    </svg>
  );
}

export function IconTrophy({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <path d="M8 5H4.5v1A3.5 3.5 0 0 0 8 9.5" />
      <path d="M16 5h3.5v1A3.5 3.5 0 0 1 16 9.5" />
      <path d="M12 13v3.5" />
      <path d="M8.5 20h7" />
      <path d="M10 16.5h4V20h-4z" />
    </svg>
  );
}

export function IconBolt({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M13 2.5 4.5 13.5H11l-1 8L18.5 10H12z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconArrowUp({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 19V5" />
      <path d="m5.5 11.5 6.5-6.5 6.5 6.5" />
    </svg>
  );
}

export function IconApple({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path
        d="M12 7.5c-1-1.8-3.2-2.3-5-1.2-2.3 1.4-2.7 5-.9 8.3 1.2 2.2 3 3.9 4.6 3.4.5-.2 1-.2 1.6 0 1.6.5 3.4-1.2 4.6-3.4 1.8-3.3 1.4-6.9-.9-8.3-1.8-1.1-4-.6-5 1.2z"
        fill="currentColor"
        stroke="none"
      />
      <path d="M12 7.5c0-2 1-3.5 3-4" />
    </svg>
  );
}

export function IconMark({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M5 8.2A3.7 3.7 0 0 1 8.7 4.5h6.6A3.7 3.7 0 0 1 19 8.2v.3a3.7 3.7 0 0 1-3.7 3.7H8.7A3.7 3.7 0 0 0 5 15.9v.4a3.7 3.7 0 0 0 3.7 3.7h8.8" />
      <circle cx="16.6" cy="7" r="1.15" fill="currentColor" stroke="none" />
      <path d="m20 20 1.6 1M20 20l1.6-1" strokeWidth="1.6" />
    </svg>
  );
}

export function IconSwipe({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M9 11.5V5.8a1.8 1.8 0 0 1 3.6 0v5.4l3.9 1.3a2.4 2.4 0 0 1 1.5 2.9l-.8 3.4a3 3 0 0 1-2.9 2.3H10a3 3 0 0 1-2.4-1.2L4.4 16a1.7 1.7 0 0 1 2.4-2.4L9 15z" />
      <path d="M5 4.5 3.5 6 5 7.5" />
    </svg>
  );
}
