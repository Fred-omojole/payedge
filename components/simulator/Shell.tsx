"use client";

import { useCheckoutMachine } from "@/lib/machine";
import { clearIdempotencyCache } from "@/lib/mock-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Scenario } from "@/types";
import { TEST_CARDS } from "@/lib/scenarios";
import { FlowCanvas } from "./FlowCanvas";
import { EventLog } from "./EventLog";
import { ActiveState } from "./ActiveState";

const AUTO_SCENARIO = "__auto__" as const;

// Unique scenarios derived from TEST_CARDS, in card-order
const SCENARIO_OPTIONS: Scenario[] = Array.from(
  new Set(Object.values(TEST_CARDS)),
);

export function Shell() {
  const { context, actions, ...computed } = useCheckoutMachine();

  const handleReset = () => {
    clearIdempotencyCache();
    actions.reset();
  };

  const handleScenarioChange = (value: string | null) => {
    const next: Scenario | null =
      value === AUTO_SCENARIO || value === null
        ? null
        : (value as Scenario);
    clearIdempotencyCache();
    actions.setManualScenario(next);
  };

  const selectorValue = context.manualScenario ?? AUTO_SCENARIO;
  const selectorDisabled = context.state !== "idle";

  return (
    <main className="min-w-[1280px] h-screen flex flex-col bg-base">
      {/* Topbar */}
      <header className="h-12 px-4 flex items-center justify-between border-b border-edge bg-surface">
        <div className="flex items-center gap-4">
          <h1 className="text-ink font-medium text-base tracking-tight">
            PAYEDGE
          </h1>
          <Separator orientation="vertical" className="h-5 bg-edge" />
          <div className="flex items-center gap-2">
            <span className="text-ink-2 text-sm">State:</span>
            <Badge
              variant="outline"
              className="font-mono text-xs bg-surface-2 border-edge text-ink"
            >
              {context.state}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-ink-2 text-sm">Scenario:</span>
            <Select
              value={selectorValue}
              onValueChange={handleScenarioChange}
              disabled={selectorDisabled}
            >
              <SelectTrigger
                size="sm"
                className="font-mono text-xs bg-surface-2 border-edge text-ink hover:bg-surface-3"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface border-edge">
                <SelectItem
                  value={AUTO_SCENARIO}
                  className="font-mono text-xs text-ink"
                >
                  auto (from card)
                </SelectItem>
                {SCENARIO_OPTIONS.map((s) => (
                  <SelectItem
                    key={s}
                    value={s}
                    className="font-mono text-xs text-ink"
                  >
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Test card hints */}
          <div className="text-ink-3 text-xs font-mono hidden xl:block">
            Test: 4242... (happy) | 4000...0002 (decline) | 4000...0119
            (timeout)
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="bg-surface-2 border-edge text-ink hover:bg-surface-3 hover:border-edge-strong"
          >
            Reset
          </Button>
        </div>
      </header>

      {/* Three-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Flow Canvas */}
        <aside className="w-[200px] border-r border-edge bg-surface overflow-y-auto">
          <FlowCanvas
            currentState={context.state}
            scenario={context.scenario}
          />
        </aside>

        {/* Center panel - Active State */}
        <main className="flex-1 overflow-y-auto bg-base">
          <ActiveState
            context={context}
            actions={actions}
            computed={computed}
          />
        </main>

        {/* Right panel - Event Log + Inspector */}
        <aside className="w-[260px] border-l border-edge bg-surface overflow-hidden flex flex-col">
          <EventLog eventLog={context.eventLog} context={context} />
        </aside>
      </div>
    </main>
  );
}
