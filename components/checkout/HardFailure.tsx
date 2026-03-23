"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HardFailureProps {
  errorRef: string;
  onReset: () => void;
}

function XCircleIcon({ className }: { className?: string }) {
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
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

export function HardFailure({ errorRef, onReset }: HardFailureProps) {
  const handleCopyRef = () => {
    navigator.clipboard.writeText(errorRef);
  };

  return (
    <Card className="bg-surface border-edge max-w-md mx-auto text-center">
      <CardHeader className="pb-4">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-state-red-bg border-2 border-state-red flex items-center justify-center">
            <XCircleIcon className="text-state-red-text" />
          </div>
        </div>
        <CardTitle className="text-state-red-text text-xl">
          Payment Failed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error reference */}
        <div className="bg-surface-2 border border-edge rounded-lg p-4">
          <p className="text-ink-3 text-xs uppercase tracking-wider mb-2">
            Error Reference
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-ink text-lg">{errorRef}</span>
            <button
              onClick={handleCopyRef}
              className="p-1.5 rounded hover:bg-surface-3 transition-colors"
              title="Copy to clipboard"
            >
              <CopyIcon className="text-ink-3 hover:text-ink" />
            </button>
          </div>
        </div>

        {/* Support message */}
        <p className="text-ink-2 text-sm">
          We were unable to process your payment after multiple attempts. Please
          contact support with the error reference above.
        </p>

        {/* Warning - no auto retry */}
        <div className="bg-state-red-bg border border-state-red-border rounded-lg p-3">
          <p className="text-state-red-text text-xs">
            This is a terminal failure. No automatic retry will be attempted.
          </p>
        </div>

        {/* State indicator */}
        <div className="pt-2">
          <Badge
            variant="outline"
            className="font-mono text-xs bg-state-red-bg border-state-red-border text-state-red-text"
          >
            hard_failure
          </Badge>
        </div>

        {/* Try again button */}
        <Button
          onClick={onReset}
          variant="outline"
          className="w-full mt-4 bg-surface-2 border-edge text-ink hover:bg-surface-3"
        >
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
}
