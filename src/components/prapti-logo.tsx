import React from 'react';

export function PraptiLogo({
  className = 'h-4 w-4',
  tone = 'currentColor',
}: {
  className?: string;
  tone?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill={tone}
      className={className}
      aria-label="PRAPTI Logo"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left Main Block */}
      <rect x="1" y="1" width="9" height="14" rx="0.5" />
      {/* Upper Right Block */}
      <rect x="11.5" y="1" width="4" height="6" rx="0.5" />
      {/* Lower Right Block */}
      <rect x="11.5" y="9" width="4" height="6" rx="0.5" />
    </svg>
  );
}
