"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SuccessScreenProps {
  orderId: string;
  intentId: string;
  onReset?: () => void;
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function SuccessScreen({
  orderId,
  intentId,
  onReset,
}: SuccessScreenProps) {
  return (
    <Card className="bg-surface border-edge max-w-md mx-auto text-center">
      <CardHeader className="pb-4">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-state-green-bg border-2 border-state-green flex items-center justify-center">
            <CheckCircleIcon className="text-state-green-text" />
          </div>
        </div>
        <CardTitle className="text-state-green-text text-xl">
          Payment Successful
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Order details */}
        <div className="bg-surface-2 border border-edge rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-ink-3 text-sm">Order ID</span>
            <span className="font-mono text-ink text-sm">{orderId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-3 text-sm">Intent ID</span>
            <span className="font-mono text-ink text-sm">{intentId}</span>
          </div>
        </div>

        {/* Confirmation message */}
        <p className="text-ink-2 text-sm">
          Your payment has been processed and your order has been created
          successfully.
        </p>

        {/* State indicator */}
        <div className="pt-2">
          <Badge
            variant="outline"
            className="font-mono text-xs bg-state-green-bg border-state-green-border text-state-green-text"
          >
            confirmed
          </Badge>
        </div>

        {/* Reset button */}
        {onReset && (
          <Button
            onClick={onReset}
            variant="outline"
            className="w-full mt-4 bg-surface-2 border-edge text-ink hover:bg-surface-3"
          >
            Start New Payment
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
