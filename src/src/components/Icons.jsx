/**
 * Small hand-drawn icon set (stroke, 20x20, currentColor) used across the
 * admin/teacher dashboards. Kept local rather than pulling in an icon
 * library — package.json intentionally has no extra dependencies, and a
 * dozen simple line icons don't need one.
 */
const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconGauge(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3a9 9 0 0 0-6.36 15.36" />
      <path d="M12 3a9 9 0 0 1 6.36 15.36" />
      <path d="M12 12l4-4" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconUsers(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
      <path d="M15.5 4.8a3.2 3.2 0 0 1 0 6.2" />
      <path d="M17.5 14.6c2.4.4 3.9 2.3 4 5.4" />
    </svg>
  );
}

export function IconCalendar(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3.5M16 3v3.5" />
      <path d="M7.5 13.2h2M11 13.2h2M14.5 13.2h2M7.5 16.5h2M11 16.5h2" />
    </svg>
  );
}

export function IconCoin(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M9.7 15.2c.3 1 1.2 1.5 2.3 1.5 1.4 0 2.4-.7 2.4-1.9 0-2.6-4.7-1.4-4.7-4 0-1.2 1-1.9 2.3-1.9 1.1 0 2 .5 2.3 1.5" />
    </svg>
  );
}

export function IconGroup(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="9" r="2.6" />
      <circle cx="16" cy="9" r="2.6" />
      <path d="M3 19.5c0-2.8 2.2-4.7 5-4.7s5 1.9 5 4.7" />
      <path d="M11 19.5c0-2.8 2.2-4.7 5-4.7s5 1.9 5 4.7" />
    </svg>
  );
}

export function IconCheckShield(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5l7 2.6v5.4c0 4.6-2.9 7.7-7 9-4.1-1.3-7-4.4-7-9V6.1l7-2.6z" />
      <path d="M9 12.3l2 2 4-4.2" />
    </svg>
  );
}

export function IconGift(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="9" width="17" height="4" rx="1" />
      <rect x="4.5" y="13" width="15" height="7.5" rx="1.5" />
      <path d="M12 9v11.5" />
      <path d="M12 9C10.5 6 8 5.7 7 6.6c-1 .9-.4 2.4 1 2.4H12z" />
      <path d="M12 9c1.5-3 4-3.3 5-2.4 1 .9.4 2.4-1 2.4H12z" />
    </svg>
  );
}

export function IconClock(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IconVideo(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="6.5" width="12.5" height="11" rx="2" />
      <path d="M15.5 10.3l5-2.6v8.6l-5-2.6" />
    </svg>
  );
}

export function IconInbox(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4.5" />
      <path d="M4 12.5L6.5 5h11L20 12.5" />
      <path d="M4 12.5h5l1.2 2.3h3.6L15 12.5h5" />
    </svg>
  );
}

/* ---------------------------------------------------------------------
   Social / footer icons — same stroke style as the set above, kept
   local for the same reasons (no icon-library dependency).
------------------------------------------------------------------------ */
export function IconInstagram(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconFacebook(props) {
  return (
    <svg {...base} {...props}>
      <path d="M14.5 21v-7.2h2.4l.4-2.8h-2.8V9.2c0-.8.2-1.4 1.4-1.4h1.5V5.3c-.3 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.6V11H9.5v2.8h2.3V21" />
    </svg>
  );
}

export function IconLinkedin(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M7.7 10.2v6.4M7.7 7.6v.1" />
      <path d="M11.4 16.6v-3.7c0-1.3.9-2.2 2.1-2.2 1.2 0 1.9.8 1.9 2.2v3.7" />
      <path d="M11.4 10.2v6.4" />
    </svg>
  );
}

export function IconTiktok(props) {
  return (
    <svg {...base} {...props}>
      <path d="M14 4v10.2a2.8 2.8 0 1 1-2.4-2.8" />
      <path d="M14 4c.3 2 1.7 3.4 3.7 3.6" />
    </svg>
  );
}

export function IconSend(props) {
  return (
    <svg {...base} {...props}>
      <path d="M20 4L10.5 13.5" />
      <path d="M20 4l-6 16-3.5-7.5L4 9l16-5z" />
    </svg>
  );
}
