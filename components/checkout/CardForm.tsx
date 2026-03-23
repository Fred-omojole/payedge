"use client";

import { useState, type FormEvent } from "react";
import Cards, { type Focused } from "react-credit-cards-2";
import "react-credit-cards-2/dist/es/styles-compiled.css";

import type { Scenario, CardState } from "@/types";
import { getScenarioFromCard, TEST_CARDS } from "@/lib/scenarios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CardFormProps {
  onSubmit: (scenario: Scenario) => void;
  disabled?: boolean;
  intentId?: string | null;
}

// Format card number as "4242 4242 4242 4242"
function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

// Format expiry as "MM/YY"
function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 2) {
    return digits.slice(0, 2) + "/" + digits.slice(2);
  }
  return digits;
}

export function CardForm({ onSubmit, disabled, intentId }: CardFormProps) {
  const [cardState, setCardState] = useState<CardState>({
    number: "",
    name: "",
    expiry: "",
    cvc: "",
    focus: "",
  });

  const handleInputChange =
    (field: keyof CardState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;

      if (field === "number") {
        value = formatCardNumber(value);
      } else if (field === "expiry") {
        value = formatExpiry(value);
      } else if (field === "cvc") {
        value = value.replace(/\D/g, "").slice(0, 4);
      }

      setCardState((prev) => ({ ...prev, [field]: value }));
    };

  const handleFocus = (field: string) => () => {
    setCardState((prev) => ({ ...prev, focus: field }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Lookup scenario from card number - card number is discarded after this
    const scenario = getScenarioFromCard(cardState.number);
    onSubmit(scenario);
  };

  return (
    <Card className="bg-surface border-edge max-w-md mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="text-ink text-lg">Payment Details</CardTitle>
        {intentId && (
          <p className="text-xs text-ink-3 font-mono">
            Retrying with intent: {intentId}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Card visual */}
        <div className="flex justify-center">
          <Cards
            number={cardState.number}
            name={cardState.name || "YOUR NAME"}
            expiry={cardState.expiry}
            cvc={cardState.cvc}
            focused={cardState.focus as Focused}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="number" className="text-ink-2 text-xs">
              Card Number
            </Label>
            <Input
              id="number"
              type="text"
              placeholder="4242 4242 4242 4242"
              value={cardState.number}
              onChange={handleInputChange("number")}
              onFocus={handleFocus("number")}
              disabled={disabled}
              className="bg-surface-2 border-edge text-ink placeholder:text-ink-3 font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-ink-2 text-xs">
              Cardholder Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={cardState.name}
              onChange={handleInputChange("name")}
              onFocus={handleFocus("name")}
              disabled={disabled}
              className="bg-surface-2 border-edge text-ink placeholder:text-ink-3"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="expiry" className="text-ink-2 text-xs">
                Expiry
              </Label>
              <Input
                id="expiry"
                type="text"
                placeholder="MM/YY"
                value={cardState.expiry}
                onChange={handleInputChange("expiry")}
                onFocus={handleFocus("expiry")}
                disabled={disabled}
                className="bg-surface-2 border-edge text-ink placeholder:text-ink-3 font-mono"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="cvc" className="text-ink-2 text-xs">
                CVC
              </Label>
              <Input
                id="cvc"
                type="text"
                placeholder="123"
                value={cardState.cvc}
                onChange={handleInputChange("cvc")}
                onFocus={handleFocus("cvc")}
                disabled={disabled}
                className="bg-surface-2 border-edge text-ink placeholder:text-ink-3 font-mono"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={disabled || !cardState.number}
            className="w-full bg-brand text-base hover:bg-brand/90 disabled:opacity-50"
          >
            Pay Now
          </Button>
        </form>

        {/* Test card hints */}
        <div className="pt-2 border-t border-edge">
          <p className="text-[10px] text-ink-3 uppercase tracking-wider mb-2">
            Test Cards
          </p>
          <div className="space-y-1 text-[10px] font-mono text-ink-3">
            {Object.entries(TEST_CARDS).map(([cardNumber, scenario]) => (
              <p key={cardNumber}>
                <span
                  className={
                    scenario === "happy_path"
                      ? "text-state-green-text"
                      : scenario === "network_timeout" ||
                          scenario === "partial_failure"
                        ? "text-state-red-text"
                        : "text-state-amber-text"
                  }
                >
                  {cardNumber}
                </span>{" "}
                → {scenario}
              </p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
