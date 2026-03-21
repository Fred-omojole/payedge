import type { Scenario, DeclineCode } from "@/types";

// Maps test card numbers to scenarios
// Card number is read once on submit then discarded - NEVER stored
export const TEST_CARDS: Record<string, Scenario> = {
  "4242 4242 4242 4242": "happy_path",
  "4000 0000 0000 0002": "card_declined",
  "4000 0000 0000 9995": "insufficient_funds",
  "4100 0000 0000 0019": "partial_failure",
  "4000 0000 0000 0119": "network_timeout",
};

// Default scenario if card not recognized
export const DEFAULT_SCENARIO: Scenario = "happy_path";

// Maps decline codes to user-friendly messages
// Never show raw decline codes to users
export const DECLINE_MESSAGES: Record<DeclineCode, string> = {
  card_declined: "Your card was declined. Please try a different card.",
  insufficient_funds:
    "Insufficient funds. Please try a different card or contact your bank.",
  expired_card: "Your card has expired. Please use a different card.",
  incorrect_cvc: "The security code is incorrect. Please check and try again.",
  processing_error: "Unable to process your card. Please try again.",
};

// Get scenario from card number
export function getScenarioFromCard(cardNumber: string): Scenario {
  return TEST_CARDS[cardNumber] || DEFAULT_SCENARIO;
}

// Retry backoff configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  backoffMs: [1000, 2000, 4000] as const, // Exponential backoff
};

// Human-readable state labels for the flow canvas
export const STATE_LABELS: Record<string, string> = {
  idle: "Idle",
  validating: "Validating",
  creating_intent: "Creating Intent",
  retrying: "Retrying",
  idempotency_hit: "Idempotency Hit",
  confirming_payment: "Confirming Payment",
  card_declined: "Card Declined",
  creating_order: "Creating Order",
  partial_failure: "Partial Failure",
  recovering: "Recovering",
  confirmed: "Confirmed",
  hard_failure: "Hard Failure",
};
