import type {
  Scenario,
  IntentResponse,
  ConfirmResponse,
  OrderResponse,
  DeclineCode,
} from "@/types";
import { generateIntentId, generateOrderId } from "./idempotency";

// Custom error classes for different failure types
export class NetworkTimeoutError extends Error {
  readonly code = "NETWORK_TIMEOUT" as const;
  readonly httpStatus = 504;

  constructor(message: string = "Network request timed out") {
    super(message);
    this.name = "NetworkTimeoutError";
  }
}

export class OrderCreationError extends Error {
  readonly code = "ORDER_CREATION_FAILED" as const;
  readonly httpStatus = 500;

  constructor(message: string = "Order creation failed") {
    super(message);
    this.name = "OrderCreationError";
  }
}

// In-memory cache for idempotency simulation
// Maps idempotencyKey -> cached response
const idempotencyCache = new Map<
  string,
  {
    intentId: string;
    timestamp: number;
  }
>();

// Clear cache (called on simulator reset)
export function clearIdempotencyCache(): void {
  idempotencyCache.clear();
}

// Utility: Sleep function for simulating delay
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Create payment intent
async function createIntent(
  idempotencyKey: string,
  scenario: Scenario,
  delay: number = 1500,
): Promise<IntentResponse> {
  // Simulate network delay
  await sleep(delay);

  // Check idempotency cache first
  const cached = idempotencyCache.get(idempotencyKey);
  if (cached) {
    return {
      intentId: cached.intentId,
      status: "cached",
    };
  }

  // Handle network_timeout scenario
  if (scenario === "network_timeout") {
    throw new NetworkTimeoutError("POST /v1/payment_intents timed out");
  }

  // Success path - create new intent
  const intentId = generateIntentId();

  // Store in cache
  idempotencyCache.set(idempotencyKey, {
    intentId,
    timestamp: Date.now(),
  });

  return {
    intentId,
    status: "created",
  };
}

// Confirm payment
async function confirmPayment(
  intentId: string,
  scenario: Scenario,
  delay: number = 1200,
): Promise<ConfirmResponse> {
  // Simulate network delay
  await sleep(delay);

  // Handle card_declined scenario
  if (scenario === "card_declined") {
    return {
      status: "declined",
      declineCode: "card_declined" as DeclineCode,
    };
  }

  // Handle insufficient_funds scenario
  if (scenario === "insufficient_funds") {
    return {
      status: "declined",
      declineCode: "insufficient_funds" as DeclineCode,
    };
  }

  // Success path
  return {
    status: "confirmed",
  };
}

// Create order
async function createOrder(
  intentId: string,
  idempotencyKey: string,
  scenario: Scenario,
  delay: number = 1000,
): Promise<OrderResponse> {
  // Simulate network delay
  await sleep(delay);

  // Handle partial_failure scenario
  if (scenario === "partial_failure") {
    throw new OrderCreationError("Database write failed");
  }

  // Success path
  const orderId = generateOrderId();

  return {
    orderId,
    status: "created",
  };
}

// Recovery API for partial failure
async function recoverOrder(
  intentId: string,
  idempotencyKey: string,
  delay: number = 1000,
): Promise<OrderResponse> {
  // Simulate network delay
  await sleep(delay);

  // Recovery always succeeds (simulates DB retry working)
  const orderId = generateOrderId();

  return {
    orderId,
    status: "created",
  };
}

// Export the mock API object
export const mockApi = {
  createIntent,
  confirmPayment,
  createOrder,
  recoverOrder,
};
