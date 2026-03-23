"use client";

import { useReducer } from "react";
import type {
  CheckoutContext,
  CheckoutAction,
  LogEntry,
  LogEntryType,
  Scenario,
  DeclineCode,
} from "@/types";
import {
  generateIdempotencyKey,
  formatTimestamp,
  generateErrorRef,
} from "./idempotency";
import { RETRY_CONFIG } from "./scenarios";

// Initial context state
export const INITIAL_CONTEXT: CheckoutContext = {
  state: "idle",
  scenario: "happy_path",
  idempotencyKey: "",
  intentId: null,
  retryCount: 0,
  backoffMs: 1000,
  declineCode: null,
  orderId: null,
  errorRef: null,
  eventLog: [],
};

// Helper to create log entries
function createLogEntry(
  type: LogEntryType,
  message: string,
  meta?: LogEntry["meta"],
): LogEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: formatTimestamp(),
    type,
    message,
    meta,
  };
}

// State machine reducer
export function checkoutReducer(
  context: CheckoutContext,
  action: CheckoutAction,
): CheckoutContext {
  switch (action.type) {
    case "RESET":
      return {
        ...INITIAL_CONTEXT,
        eventLog: [],
      };

    case "START_VALIDATION": {
      const newKey = action.payload.idempotencyKey;
      return {
        ...context,
        state: "validating",
        scenario: action.payload.scenario,
        idempotencyKey: newKey,
        intentId: null,
        retryCount: 0,
        backoffMs: 1000,
        declineCode: null,
        orderId: null,
        errorRef: null,
        eventLog: [
          ...context.eventLog,
          createLogEntry("STATE", "idle → validating", {
            idempotencyKey: newKey,
          }),
        ],
      };
    }

    case "VALIDATION_SUCCESS":
      return {
        ...context,
        state: "creating_intent",
        eventLog: [
          ...context.eventLog,
          createLogEntry("STATE", "validating → creating_intent"),
          createLogEntry("POST", "POST /v1/payment_intents", {
            idempotencyKey: context.idempotencyKey,
            attempt: 1,
          }),
        ],
      };

    case "CREATE_INTENT":
      return {
        ...context,
        eventLog: [
          ...context.eventLog,
          createLogEntry("POST", "POST /v1/payment_intents", {
            idempotencyKey: context.idempotencyKey,
            attempt: context.retryCount + 1,
          }),
        ],
      };

    case "INTENT_SUCCESS":
      return {
        ...context,
        state: "confirming_payment",
        intentId: action.payload.intentId,
        retryCount: 0,
        eventLog: [
          ...context.eventLog,
          createLogEntry("OK", `Intent created: ${action.payload.intentId}`, {
            intentId: action.payload.intentId,
            httpStatus: 200,
          }),
          createLogEntry("STATE", "creating_intent → confirming_payment"),
        ],
      };

    case "INTENT_FAILURE": {
      const nextRetryCount = context.retryCount + 1;
      const maxRetries = RETRY_CONFIG.maxRetries;

      if (nextRetryCount >= maxRetries) {
        const errorRef = generateErrorRef();
        return {
          ...context,
          state: "hard_failure",
          retryCount: nextRetryCount,
          errorRef,
          eventLog: [
            ...context.eventLog,
            createLogEntry(
              "ERROR",
              `Network timeout (attempt ${nextRetryCount}/${maxRetries})`,
              {
                attempt: nextRetryCount,
                httpStatus: 504,
              },
            ),
            createLogEntry("STATE", "Max retries exceeded → hard_failure"),
            createLogEntry("ERROR", `Support ref: ${errorRef}`, { errorRef }),
          ],
        };
      }

      const backoffMs = RETRY_CONFIG.backoffMs[nextRetryCount - 1] || 4000;
      return {
        ...context,
        state: "retrying",
        retryCount: nextRetryCount,
        backoffMs,
        eventLog: [
          ...context.eventLog,
          createLogEntry(
            "ERROR",
            `Network timeout (attempt ${nextRetryCount}/${maxRetries})`,
            {
              attempt: nextRetryCount,
              httpStatus: 504,
            },
          ),
          createLogEntry(
            "STATE",
            `creating_intent → retrying (backoff: ${backoffMs}ms)`,
          ),
        ],
      };
    }

    case "RETRY":
      return {
        ...context,
        state: "creating_intent",
        eventLog: [
          ...context.eventLog,
          createLogEntry("STATE", `Retry ${context.retryCount + 1} starting`),
          createLogEntry("POST", "POST /v1/payment_intents", {
            idempotencyKey: context.idempotencyKey,
            attempt: context.retryCount + 1,
          }),
        ],
      };

    case "IDEMPOTENCY_HIT":
      return {
        ...context,
        state: "confirming_payment",
        intentId: action.payload.intentId,
        eventLog: [
          ...context.eventLog,
          createLogEntry("IDEM", "Cache hit - returning existing intent", {
            idempotencyKey: context.idempotencyKey,
            intentId: action.payload.intentId,
          }),
          createLogEntry(
            "STATE",
            "creating_intent → confirming_payment (cached)",
          ),
        ],
      };

    case "CONFIRM_PAYMENT":
      return {
        ...context,
        eventLog: [
          ...context.eventLog,
          createLogEntry("POST", "POST /v1/payment_intents/confirm", {
            intentId: context.intentId!,
          }),
        ],
      };

    case "PAYMENT_SUCCESS":
      return {
        ...context,
        state: "creating_order",
        eventLog: [
          ...context.eventLog,
          createLogEntry("OK", "Payment confirmed", { httpStatus: 200 }),
          createLogEntry("STATE", "confirming_payment → creating_order"),
        ],
      };

    case "PAYMENT_DECLINED":
      return {
        ...context,
        state: "card_declined",
        declineCode: action.payload.declineCode,
        eventLog: [
          ...context.eventLog,
          createLogEntry(
            "ERROR",
            `Card declined: ${action.payload.declineCode}`,
            {
              declineCode: action.payload.declineCode,
              httpStatus: 402,
            },
          ),
          createLogEntry("STATE", "confirming_payment → card_declined"),
        ],
      };

    case "RETRY_CARD":
      // Retry with new card - preserves intentId and idempotencyKey
      return {
        ...context,
        state: "confirming_payment",
        scenario: action.payload.scenario,
        declineCode: null,
        eventLog: [
          ...context.eventLog,
          createLogEntry("STATE", "card_declined → confirming_payment (retry with new card)", {
            intentId: context.intentId!,
            idempotencyKey: context.idempotencyKey,
          }),
        ],
      };

    case "CREATE_ORDER":
      return {
        ...context,
        eventLog: [
          ...context.eventLog,
          createLogEntry("POST", "POST /v1/orders", {
            idempotencyKey: context.idempotencyKey,
            intentId: context.intentId!,
          }),
        ],
      };

    case "ORDER_SUCCESS":
      return {
        ...context,
        state: "confirmed",
        orderId: action.payload.orderId,
        eventLog: [
          ...context.eventLog,
          createLogEntry("OK", `Order created: ${action.payload.orderId}`, {
            httpStatus: 201,
          }),
          createLogEntry("STATE", "creating_order → confirmed"),
        ],
      };

    case "ORDER_FAILURE":
      return {
        ...context,
        state: "partial_failure",
        errorRef: action.payload.errorRef,
        eventLog: [
          ...context.eventLog,
          createLogEntry(
            "ERROR",
            `Order creation failed: ${action.payload.errorRef}`,
            {
              errorRef: action.payload.errorRef,
              httpStatus: 500,
            },
          ),
          createLogEntry("STATE", "creating_order → partial_failure"),
        ],
      };

    case "RECOVER_ORDER":
      return {
        ...context,
        state: "recovering",
        eventLog: [
          ...context.eventLog,
          createLogEntry("STATE", "Attempting order recovery"),
          createLogEntry("POST", "POST /v1/orders (retry)", {
            idempotencyKey: context.idempotencyKey,
            intentId: context.intentId!,
          }),
        ],
      };

    case "RECOVERY_SUCCESS":
      return {
        ...context,
        state: "confirmed",
        orderId: action.payload.orderId,
        errorRef: null,
        eventLog: [
          ...context.eventLog,
          createLogEntry("OK", `Order recovered: ${action.payload.orderId}`, {
            httpStatus: 201,
          }),
          createLogEntry("STATE", "recovering → confirmed"),
        ],
      };

    case "HARD_FAILURE":
      return {
        ...context,
        state: "hard_failure",
        errorRef: action.payload.errorRef,
        eventLog: [
          ...context.eventLog,
          createLogEntry(
            "ERROR",
            `Terminal failure: ${action.payload.errorRef}`,
            {
              errorRef: action.payload.errorRef,
            },
          ),
          createLogEntry("STATE", `${context.state} → hard_failure`),
        ],
      };

    case "LOG_EVENT":
      return {
        ...context,
        eventLog: [
          ...context.eventLog,
          { ...action.payload, id: crypto.randomUUID() },
        ],
      };

    default:
      return context;
  }
}

// Custom hook wrapping useReducer with type-safe action dispatchers
export function useCheckoutMachine() {
  const [context, dispatch] = useReducer(checkoutReducer, INITIAL_CONTEXT);

  const actions = {
    startValidation: (scenario: Scenario, idempotencyKey: string) =>
      dispatch({ type: "START_VALIDATION", payload: { scenario, idempotencyKey } }),

    validationSuccess: () => dispatch({ type: "VALIDATION_SUCCESS" }),

    createIntent: () => dispatch({ type: "CREATE_INTENT" }),

    intentSuccess: (intentId: string) =>
      dispatch({ type: "INTENT_SUCCESS", payload: { intentId } }),

    intentFailure: () => dispatch({ type: "INTENT_FAILURE" }),

    retry: () => dispatch({ type: "RETRY" }),

    idempotencyHit: (intentId: string) =>
      dispatch({ type: "IDEMPOTENCY_HIT", payload: { intentId } }),

    confirmPayment: () => dispatch({ type: "CONFIRM_PAYMENT" }),

    paymentSuccess: () => dispatch({ type: "PAYMENT_SUCCESS" }),

    paymentDeclined: (declineCode: DeclineCode) =>
      dispatch({ type: "PAYMENT_DECLINED", payload: { declineCode } }),

    retryCard: (scenario: Scenario) =>
      dispatch({ type: "RETRY_CARD", payload: { scenario } }),

    createOrder: () => dispatch({ type: "CREATE_ORDER" }),

    orderSuccess: (orderId: string) =>
      dispatch({ type: "ORDER_SUCCESS", payload: { orderId } }),

    orderFailure: (errorRef: string) =>
      dispatch({ type: "ORDER_FAILURE", payload: { errorRef } }),

    recoverOrder: () => dispatch({ type: "RECOVER_ORDER" }),

    recoverySuccess: (orderId: string) =>
      dispatch({ type: "RECOVERY_SUCCESS", payload: { orderId } }),

    hardFailure: (errorRef: string) =>
      dispatch({ type: "HARD_FAILURE", payload: { errorRef } }),

    reset: () => dispatch({ type: "RESET" }),

    logEvent: (entry: Omit<LogEntry, "id">) =>
      dispatch({ type: "LOG_EVENT", payload: entry }),
  };

  const computed = {
    isTerminal:
      context.state === "confirmed" || context.state === "hard_failure",

    canRetryCard: context.state === "card_declined",

    canRecoverOrder: context.state === "partial_failure",

    isLoading: [
      "validating",
      "creating_intent",
      "confirming_payment",
      "creating_order",
      "recovering",
    ].includes(context.state),

    isRetrying: context.state === "retrying" || context.state === "recovering",

    currentBackoff: context.backoffMs,

    retriesRemaining: RETRY_CONFIG.maxRetries - context.retryCount,
  };

  return {
    context,
    actions,
    ...computed,
  };
}
