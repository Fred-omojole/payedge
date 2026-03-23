"use client";

import type { PaymentState, Scenario } from "@/types";
import { STATE_LABELS } from "@/lib/scenarios";
import { cn } from "@/lib/utils";

interface FlowCanvasProps {
  currentState: PaymentState;
  scenario: Scenario;
}

// Canonical order of states in the flow
const FLOW_STATES: PaymentState[] = [
  "idle",
  "validating",
  "creating_intent",
  "retrying",
  "idempotency_hit",
  "confirming_payment",
  "card_declined",
  "creating_order",
  "partial_failure",
  "recovering",
  "confirmed",
  "hard_failure",
];

// Map state to color category
function getStateColor(
  state: PaymentState,
  isCurrent: boolean,
  isPast: boolean,
) {
  if (!isCurrent && !isPast) {
    // Future state - gray/dimmed
    return {
      dot: "bg-state-gray-bg border-state-gray-border",
      text: "text-ink-3",
      line: "bg-edge",
    };
  }

  // Current or past state - use semantic colors
  const colorMap: Record<
    PaymentState,
    { dot: string; text: string; line: string }
  > = {
    idle: {
      dot: "bg-state-gray-bg border-state-gray-border",
      text: "text-state-gray-text",
      line: "bg-state-gray-border",
    },
    validating: {
      dot: "bg-state-blue-bg border-state-blue-border",
      text: "text-state-blue-text",
      line: "bg-state-blue-border",
    },
    creating_intent: {
      dot: "bg-state-blue-bg border-state-blue-border",
      text: "text-state-blue-text",
      line: "bg-state-blue-border",
    },
    retrying: {
      dot: "bg-state-amber-bg border-state-amber-border",
      text: "text-state-amber-text",
      line: "bg-state-amber-border",
    },
    idempotency_hit: {
      dot: "bg-state-blue-bg border-state-blue-border",
      text: "text-state-blue-text",
      line: "bg-state-blue-border",
    },
    confirming_payment: {
      dot: "bg-state-blue-bg border-state-blue-border",
      text: "text-state-blue-text",
      line: "bg-state-blue-border",
    },
    card_declined: {
      dot: "bg-state-amber-bg border-state-amber-border",
      text: "text-state-amber-text",
      line: "bg-state-amber-border",
    },
    creating_order: {
      dot: "bg-state-blue-bg border-state-blue-border",
      text: "text-state-blue-text",
      line: "bg-state-blue-border",
    },
    partial_failure: {
      dot: "bg-state-red-bg border-state-red-border",
      text: "text-state-red-text",
      line: "bg-state-red-border",
    },
    recovering: {
      dot: "bg-state-amber-bg border-state-amber-border",
      text: "text-state-amber-text",
      line: "bg-state-amber-border",
    },
    confirmed: {
      dot: "bg-state-green-bg border-state-green-border",
      text: "text-state-green-text",
      line: "bg-state-green-border",
    },
    hard_failure: {
      dot: "bg-state-red-bg border-state-red-border",
      text: "text-state-red-text",
      line: "bg-state-red-border",
    },
  };

  return colorMap[state];
}

export function FlowCanvas({ currentState, scenario }: FlowCanvasProps) {
  const currentIndex = FLOW_STATES.indexOf(currentState);

  return (
    <div className="p-4">
      <h2 className="text-xs font-medium text-ink-2 uppercase tracking-wider mb-4">
        Flow
      </h2>
      <div className="space-y-0">
        {FLOW_STATES.map((state, index) => {
          const isCurrent = state === currentState;
          const isPast = index < currentIndex;
          const isLast = index === FLOW_STATES.length - 1;
          const colors = getStateColor(state, isCurrent, isPast);

          return (
            <div key={state} className="relative">
              <div className="flex items-center gap-3 py-1.5">
                {/* Dot indicator */}
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full border shrink-0",
                    colors.dot,
                    isCurrent &&
                      "ring-2 ring-offset-1 ring-offset-surface ring-brand/50",
                  )}
                />
                {/* State label */}
                <span
                  className={cn(
                    "font-mono text-xs truncate",
                    colors.text,
                    isCurrent && "font-medium",
                  )}
                >
                  {state}
                </span>
              </div>
              {/* Connecting line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-[5px] top-[22px] w-[1px] h-3",
                    isPast ? colors.line : "bg-edge",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
