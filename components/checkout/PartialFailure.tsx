"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PartialFailureProps {
  intentId: string;
  errorRef: string;
  onRecover: () => void;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function PartialFailure({
  intentId,
  errorRef,
  onRecover,
}: PartialFailureProps) {
  return (
    <Card className="bg-surface border-edge max-w-md mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="text-ink text-lg">Partial Failure</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment success badge */}
        <div className="bg-state-green-bg border border-state-green-border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-state-green flex items-center justify-center">
              <CheckIcon className="text-white w-4 h-4" />
            </div>
            <div>
              <p className="text-state-green-text font-medium">
                Payment Confirmed
              </p>
              <p className="text-ink-3 text-xs font-mono mt-0.5">
                Intent: {intentId}
              </p>
            </div>
          </div>
        </div>

        {/* Order failure badge */}
        <div className="bg-state-red-bg border border-state-red-border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-state-red flex items-center justify-center">
              <XIcon className="text-white w-4 h-4" />
            </div>
            <div>
              <p className="text-state-red-text font-medium">
                Order Creation Failed
              </p>
              <p className="text-ink-3 text-xs font-mono mt-0.5">
                Error Ref: {errorRef}
              </p>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="text-ink-2 text-sm">
          <p>
            Your payment was successful, but we couldn&apos;t create your order.
            This can happen due to a temporary database issue.
          </p>
          <p className="mt-2">
            Click below to retry creating your order. Your payment is safe.
          </p>
        </div>

        {/* Recovery CTA */}
        <Button
          onClick={onRecover}
          className="w-full bg-state-amber text-base hover:bg-state-amber/90"
        >
          Retry Order Creation
        </Button>

        {/* State indicator */}
        <div className="text-center">
          <Badge
            variant="outline"
            className="font-mono text-xs bg-surface-2 border-edge text-ink"
          >
            partial_failure
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
