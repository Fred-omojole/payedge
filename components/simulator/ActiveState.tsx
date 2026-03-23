"use client";

import { useRef } from "react";
import type { CheckoutContext, Scenario, DeclineCode } from "@/types";
import {
  mockApi,
  NetworkTimeoutError,
  OrderCreationError,
} from "@/lib/mock-api";
import { generateErrorRef } from "@/lib/idempotency";
import { RETRY_CONFIG } from "@/lib/scenarios";
import { CardForm } from "@/components/checkout/CardForm";
import { LoadingOverlay } from "@/components/checkout/LoadingOverlay";
import { DeclinedBanner } from "@/components/checkout/DeclinedBanner";
import { PartialFailure } from "@/components/checkout/PartialFailure";
import { SuccessScreen } from "@/components/checkout/SuccessScreen";
import { HardFailure } from "@/components/checkout/HardFailure";

interface Actions {
  startValidation: (scenario: Scenario, idempotencyKey: string) => void;
  validationSuccess: () => void;
  intentSuccess: (intentId: string) => void;
  intentFailure: () => void;
  retry: () => void;
  idempotencyHit: (intentId: string) => void;
  confirmPayment: () => void;
  paymentSuccess: () => void;
  paymentDeclined: (declineCode: DeclineCode) => void;
  retryCard: (scenario: Scenario) => void;
  createOrder: () => void;
  orderSuccess: (orderId: string) => void;
  orderFailure: (errorRef: string) => void;
  recoverOrder: () => void;
  recoverySuccess: (orderId: string) => void;
  hardFailure: (errorRef: string) => void;
  reset: () => void;
}

interface Computed {
  isLoading: boolean;
  isRetrying: boolean;
  canRetryCard: boolean;
  canRecoverOrder: boolean;
  isTerminal: boolean;
  currentBackoff: number;
  retriesRemaining: number;
}

interface ActiveStateProps {
  context: CheckoutContext;
  actions: Actions;
  computed: Computed;
}

// Sleep utility for delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function ActiveState({ context, actions, computed }: ActiveStateProps) {
  const flowRef = useRef<AbortController | null>(null);

  // Main payment flow - runs the entire happy path or handles failures
  const runPaymentFlow = async (scenario: Scenario, idempotencyKey: string) => {
    flowRef.current?.abort();
    const controller = new AbortController();
    flowRef.current = controller;

    try {
      // Step 1: Validation (brief delay)
      await sleep(500);
      if (controller.signal.aborted) return;
      actions.validationSuccess();

      // Step 2: Create intent (with retries for network_timeout)
      let intentId: string | null = null;
      let retryCount = 0;

      while (!intentId && retryCount < RETRY_CONFIG.maxRetries) {
        try {
          const res = await mockApi.createIntent(idempotencyKey, scenario);
          if (controller.signal.aborted) return;

          if (res.status === "cached") {
            actions.idempotencyHit(res.intentId);
          } else {
            actions.intentSuccess(res.intentId);
          }
          intentId = res.intentId;
        } catch (err) {
          if (controller.signal.aborted) return;
          if (err instanceof NetworkTimeoutError) {
            retryCount++;
            actions.intentFailure();

            if (retryCount >= RETRY_CONFIG.maxRetries) {
              return;
            }

            const backoffMs = RETRY_CONFIG.backoffMs[retryCount - 1] || 4000;
            await sleep(backoffMs);
            if (controller.signal.aborted) return;
            actions.retry();
          }
        }
      }

      if (!intentId) return;

      // Step 3: Confirm payment
      const confirmRes = await mockApi.confirmPayment(intentId, scenario);
      if (controller.signal.aborted) return;

      if (confirmRes.status === "declined" && confirmRes.declineCode) {
        actions.paymentDeclined(confirmRes.declineCode);
        return;
      }

      actions.paymentSuccess();

      // Step 4: Create order
      try {
        const orderRes = await mockApi.createOrder(
          intentId,
          idempotencyKey,
          scenario,
        );
        if (controller.signal.aborted) return;
        actions.orderSuccess(orderRes.orderId);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof OrderCreationError) {
          actions.orderFailure(generateErrorRef());
        }
      }
    } catch {
      // Unexpected error
    }
  };

  // Recovery flow for partial_failure
  const runRecoveryFlow = async (intentId: string, idempotencyKey: string) => {
    flowRef.current?.abort();
    const controller = new AbortController();
    flowRef.current = controller;

    try {
      const res = await mockApi.recoverOrder(intentId, idempotencyKey);
      if (controller.signal.aborted) return;
      actions.recoverySuccess(res.orderId);
    } catch {
      if (controller.signal.aborted) return;
      actions.hardFailure(generateErrorRef());
    }
  };

  // Card retry flow (from card_declined state)
  const runCardRetryFlow = async (
    scenario: Scenario,
    intentId: string,
    idempotencyKey: string,
  ) => {
    flowRef.current?.abort();
    const controller = new AbortController();
    flowRef.current = controller;

    try {
      const confirmRes = await mockApi.confirmPayment(intentId, scenario);
      if (controller.signal.aborted) return;

      if (confirmRes.status === "declined" && confirmRes.declineCode) {
        actions.paymentDeclined(confirmRes.declineCode);
        return;
      }

      actions.paymentSuccess();

      try {
        const orderRes = await mockApi.createOrder(
          intentId,
          idempotencyKey,
          scenario,
        );
        if (controller.signal.aborted) return;
        actions.orderSuccess(orderRes.orderId);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof OrderCreationError) {
          actions.orderFailure(generateErrorRef());
        }
      }
    } catch {
      // Unexpected error
    }
  };

  // Handle initial form submission
  const handleCardSubmit = (scenario: Scenario) => {
    const idempotencyKey = crypto.randomUUID();
    actions.startValidation(scenario, idempotencyKey);
    runPaymentFlow(scenario, idempotencyKey);
  };

  // Handle retry with new card
  const handleRetryCard = (scenario: Scenario) => {
    actions.retryCard(scenario);
    if (context.intentId) {
      runCardRetryFlow(scenario, context.intentId, context.idempotencyKey);
    }
  };

  // Handle order recovery
  const handleRecover = () => {
    actions.recoverOrder();
    if (context.intentId) {
      runRecoveryFlow(context.intentId, context.idempotencyKey);
    }
  };

  // Handle reset
  const handleReset = () => {
    flowRef.current?.abort();
    actions.reset();
  };

  // Render based on current state
  switch (context.state) {
    case "idle":
      return (
        <div className="h-full flex items-center justify-center p-8">
          <CardForm onSubmit={handleCardSubmit} />
        </div>
      );

    case "validating":
    case "creating_intent":
    case "confirming_payment":
    case "creating_order":
      return (
        <div className="h-full flex items-center justify-center">
          <LoadingOverlay state={context.state} />
        </div>
      );

    case "retrying":
      return (
        <div className="h-full flex items-center justify-center">
          <LoadingOverlay
            state={context.state}
            retryCount={context.retryCount}
            backoffMs={context.backoffMs}
            retriesRemaining={computed.retriesRemaining}
          />
        </div>
      );

    case "idempotency_hit":
      return (
        <div className="h-full flex items-center justify-center">
          <LoadingOverlay state={context.state} />
        </div>
      );

    case "card_declined":
      return (
        <div className="h-full flex items-center justify-center p-8">
          <div className="space-y-6 w-full max-w-md">
            <DeclinedBanner declineCode={context.declineCode!} />
            <CardForm onSubmit={handleRetryCard} intentId={context.intentId} />
          </div>
        </div>
      );

    case "partial_failure":
      return (
        <div className="h-full flex items-center justify-center p-8">
          <PartialFailure
            intentId={context.intentId!}
            errorRef={context.errorRef!}
            onRecover={handleRecover}
          />
        </div>
      );

    case "recovering":
      return (
        <div className="h-full flex items-center justify-center">
          <LoadingOverlay state={context.state} />
        </div>
      );

    case "confirmed":
      return (
        <div className="h-full flex items-center justify-center p-8">
          <SuccessScreen
            orderId={context.orderId!}
            intentId={context.intentId!}
            onReset={handleReset}
          />
        </div>
      );

    case "hard_failure":
      return (
        <div className="h-full flex items-center justify-center p-8">
          <HardFailure errorRef={context.errorRef!} onReset={handleReset} />
        </div>
      );

    default:
      return null;
  }
}
