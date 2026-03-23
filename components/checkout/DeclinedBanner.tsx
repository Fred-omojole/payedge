"use client";

import type { DeclineCode } from "@/types";
import { DECLINE_MESSAGES } from "@/lib/scenarios";

interface DeclinedBannerProps {
  declineCode: DeclineCode;
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function DeclinedBanner({ declineCode }: DeclinedBannerProps) {
  const message = DECLINE_MESSAGES[declineCode] || "Your card was declined.";

  return (
    <div className="bg-state-amber-bg border border-state-amber-border rounded-lg p-4 max-w-md mx-auto">
      <div className="flex items-start gap-3">
        <AlertTriangleIcon className="text-state-amber-text shrink-0 mt-0.5" />
        <div>
          <p className="text-state-amber-text font-medium">Card Declined</p>
          <p className="text-ink-2 text-sm mt-1">{message}</p>
          <p className="text-ink-3 text-xs mt-2 font-mono">
            Code: {declineCode}
          </p>
        </div>
      </div>
    </div>
  );
}
