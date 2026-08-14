import React from "react";
import Link from "next/link";

interface ThreadineryLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
}

export function ThreadinaryLogo({ size = "md", showText = true, href = "/" }: ThreadineryLogoProps) {
  const iconPixelSizes = {
    sm: 24,
    md: 28,
    lg: 36,
  };
  const textClasses = {
    sm: "text-base",
    md: "text-[20px]",
    lg: "text-2xl",
  };

  const dim = iconPixelSizes[size];

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2.5 font-serif font-semibold text-[var(--text)] tracking-tight select-none"
    >
      <img
        src="/ThreadineryLogo.png"
        alt="Threadinery Logo"
        width={dim}
        height={dim}
        className="shrink-0 object-contain"
        style={{ width: `${dim}px`, height: `${dim}px` }}
      />
      {showText && <span className={textClasses[size]}>Threadinery</span>}
    </Link>
  );
}
