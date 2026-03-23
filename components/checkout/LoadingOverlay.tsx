"use client";

import type { PaymentState } from "@/types";
import { RETRY_CONFIG } from "@/lib/scenarios";

interface LoadingOverlayProps {
  state: PaymentState;
  retryCount?: number;
  backoffMs?: number;
  retriesRemaining?: number;
}

const STATE_MESSAGES: Record<string, string> = {
  validating: "Validating card details...",
  creating_intent: "Creating payment intent...",
  retrying: "Retrying...",
  idempotency_hit: "Retrieved cached intent",
  confirming_payment: "Confirming payment...",
  creating_order: "Creating order...",
  recovering: "Recovering order...",
};

function Spinner() {
  return (
    <svg
      className="animate-spin h-8 w-8 text-brand"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function LoadingOverlay({
  state,
  retryCount = 0,
  backoffMs = 0,
  retriesRemaining,
}: LoadingOverlayProps) {
  const message = STATE_MESSAGES[state] || "Processing...";
  const isRetrying = state === "retrying";
  const maxRetries = RETRY_CONFIG.maxRetries;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-surface border border-edge rounded-lg p-8 max-w-sm w-full text-center">
        <Spinner />

        <p className="mt-4 text-ink font-medium">{message}</p>

        {isRetrying && (
          <div className="mt-4 space-y-2">
            {/* Retry badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-state-amber-bg border border-state-amber-border">
              <span className="text-state-amber-text text-sm font-mono">
                Attempt {retryCount}/{maxRetries}
              </span>
            </div>

            {/* Backoff info */}
            {backoffMs > 0 && (
              <p className="text-ink-3 text-sm">
                Waiting{" "}
                <span className="font-mono text-ink-2">
                  {(backoffMs / 1000).toFixed(1)}s
                </span>{" "}
                before retry
              </p>
            )}

            {/* Retries remaining */}
            {retriesRemaining !== undefined && retriesRemaining > 0 && (
              <p className="text-ink-3 text-xs">
                {retriesRemaining}{" "}
                {retriesRemaining === 1 ? "retry" : "retries"} remaining
              </p>
            )}
          </div>
        )}

        {state === "idempotency_hit" && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-state-blue-bg border border-state-blue-border">
            <span className="text-state-blue-text text-sm font-mono">
              Cache Hit
            </span>
          </div>
        )}

        {/* State badge */}
        <div className="mt-4">
          <span className="font-mono text-xs text-ink-3 bg-surface-2 px-2 py-1 rounded">
            {state}
          </span>
        </div>
      </div>
    </div>
  );
}
