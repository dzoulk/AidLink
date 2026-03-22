"use client";

import Link from "next/link";

/** Dark navy for logo text and bar start */
const NAVY = "#0a2540";

/** Lighter blue for bar gradient end */
const NAVY_LIGHT = "rgba(10, 37, 64, 0.4)";

interface AidLinkLogoProps {
  className?: string;
}

export function AidLinkLogo({ className = "" }: AidLinkLogoProps) {
  return (
    <Link
      href="/"
      className={`aidlink-logo inline-flex items-center shrink-0 font-bold text-xl tracking-tight ${className}`}
      style={{
        fontFamily: "var(--font-quicksand), system-ui, sans-serif",
        color: NAVY,
      }}
    >
      <span>Aid</span>
      <span
        className="aidlink-connector mx-1 shrink-0 self-center"
        style={{
          width: "1.5rem",
          minWidth: "1.5rem",
          height: "3px",
          borderRadius: "2px",
          background: `linear-gradient(to right, ${NAVY} 0%, ${NAVY_LIGHT} 100%)`,
        }}
        aria-hidden
      />
      <span>Link</span>
    </Link>
  );
}
