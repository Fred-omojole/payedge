"use client";

import type { LogEntry, CheckoutContext, LogEntryType } from "@/types";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface EventLogProps {
  eventLog: LogEntry[];
  context: CheckoutContext;
}

// Tag colors from COLORS.md
const TAG_STYLES: Record<LogEntryType, { bg: string; text: string }> = {
  STATE: { bg: "bg-[#0D1626]", text: "text-[#60A5FA]" },
  POST: { bg: "bg-[#1A1A1A]", text: "text-[#A1A1A1]" },
  IDEM: { bg: "bg-[#1A0A2A]", text: "text-[#A78BFA]" },
  ERROR: { bg: "bg-[#1A0505]", text: "text-[#F87171]" },
  OK: { bg: "bg-[#051A10]", text: "text-[#34D399]" },
};

function LogEntryRow({ entry }: { entry: LogEntry }) {
  const tagStyle = TAG_STYLES[entry.type];

  return (
    <div className="px-3 py-1.5 hover:bg-surface-2 transition-colors">
      <div className="flex items-start gap-2">
        {/* Timestamp */}
        <span className="font-mono text-[10px] text-ink-3 shrink-0 w-[72px]">
          {entry.timestamp}
        </span>
        {/* Tag */}
        <span
          className={cn(
            "font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0",
            tagStyle.bg,
            tagStyle.text,
          )}
        >
          {entry.type}
        </span>
      </div>
      {/* Message */}
      <p className="text-xs text-ink-2 mt-1 pl-[72px] break-words">
        {entry.message}
      </p>
      {/* Meta (if present) */}
      {entry.meta && Object.keys(entry.meta).length > 0 && (
        <div className="mt-1 pl-[72px] space-y-0.5">
          {entry.meta.idempotencyKey && (
            <MetaRow label="key" value={entry.meta.idempotencyKey} truncate />
          )}
          {entry.meta.intentId && (
            <MetaRow label="intent" value={entry.meta.intentId} />
          )}
          {entry.meta.attempt !== undefined && (
            <MetaRow label="attempt" value={String(entry.meta.attempt)} />
          )}
          {entry.meta.httpStatus !== undefined && (
            <MetaRow label="status" value={String(entry.meta.httpStatus)} />
          )}
          {entry.meta.declineCode && (
            <MetaRow label="code" value={entry.meta.declineCode} />
          )}
          {entry.meta.errorRef && (
            <MetaRow label="ref" value={entry.meta.errorRef} />
          )}
        </div>
      )}
    </div>
  );
}

function MetaRow({
  label,
  value,
  truncate,
}: {
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[10px]">
      <span className="text-ink-3">{label}:</span>
      <span
        className={cn(
          "font-mono text-ink-2",
          truncate && "truncate max-w-[120px]",
        )}
        title={truncate ? value : undefined}
      >
        {value}
      </span>
    </div>
  );
}

function Inspector({ context }: { context: CheckoutContext }) {
  return (
    <div className="p-3 space-y-2">
      <h3 className="text-xs font-medium text-ink-2 uppercase tracking-wider">
        Inspector
      </h3>
      <div className="space-y-1.5">
        <InspectorRow label="state" value={context.state} highlight />
        <InspectorRow label="scenario" value={context.scenario} />
        {context.idempotencyKey && (
          <InspectorRow
            label="idempotencyKey"
            value={context.idempotencyKey}
            truncate
            copyable
          />
        )}
        {context.intentId && (
          <InspectorRow label="intentId" value={context.intentId} />
        )}
        {context.orderId && (
          <InspectorRow label="orderId" value={context.orderId} />
        )}
        <InspectorRow label="retryCount" value={String(context.retryCount)} />
        {context.backoffMs > 0 && context.state === "retrying" && (
          <InspectorRow label="backoffMs" value={String(context.backoffMs)} />
        )}
        {context.declineCode && (
          <InspectorRow label="declineCode" value={context.declineCode} />
        )}
        {context.errorRef && (
          <InspectorRow label="errorRef" value={context.errorRef} />
        )}
      </div>
    </div>
  );
}

function InspectorRow({
  label,
  value,
  highlight,
  truncate,
  copyable,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  truncate?: boolean;
  copyable?: boolean;
}) {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
  };

  return (
    <div className="flex items-center justify-between text-xs gap-2">
      <span className="text-ink-3 shrink-0">{label}</span>
      <span
        className={cn(
          "font-mono text-right",
          highlight ? "text-brand" : "text-ink-2",
          truncate && "truncate max-w-[120px]",
          copyable && "cursor-pointer hover:text-ink",
        )}
        title={truncate ? value : undefined}
        onClick={copyable ? handleCopy : undefined}
      >
        {value}
      </span>
    </div>
  );
}

export function EventLog({ eventLog, context }: EventLogProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Log entries */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 pb-1">
          <h3 className="text-xs font-medium text-ink-2 uppercase tracking-wider">
            Event Log
          </h3>
        </div>
        {eventLog.length === 0 ? (
          <p className="px-3 py-4 text-xs text-ink-3 text-center">
            No events yet
          </p>
        ) : (
          <div className="divide-y divide-edge">
            {eventLog.map((entry) => (
              <LogEntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      <Separator className="bg-edge" />

      {/* Inspector */}
      <div className="h-[200px] overflow-y-auto border-t border-edge">
        <Inspector context={context} />
      </div>
    </div>
  );
}
