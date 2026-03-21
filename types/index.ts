// Payment state union - exactly 12 states
export type PaymentState =
  | "idle"
  | "validating"
  | "creating_intent"
  | "retrying"
  | "idempotency_hit"
  | "confirming_payment"
  | "card_declined"
  | "creating_order"
  | "partial_failure"
  | "recovering"
  | "confirmed"
  | "hard_failure";

// Scenario type - 5 scenarios
export type Scenario =
  | "happy_path"
  | "card_declined"
  | "insufficient_funds"
  | "partial_failure"
  | "network_timeout";

// Decline codes for card_declined scenario
export type DeclineCode =
  | "card_declined"
  | "insufficient_funds"
  | "expired_card"
  | "incorrect_cvc"
  | "processing_error";

// Event log entry type
export type LogEntryType = "STATE" | "POST" | "IDEM" | "ERROR" | "OK";

export interface LogEntry {
  id: string;
  timestamp: string; // ISO format "14:23:01.441"
  type: LogEntryType;
  message: string;
  meta?: {
    idempotencyKey?: string;
    intentId?: string;
    attempt?: number;
    httpStatus?: number;
    declineCode?: string;
    errorRef?: string;
  };
}

// Main checkout context
export interface CheckoutContext {
  state: PaymentState;
  scenario: Scenario;
  idempotencyKey: string; // UUID v4
  intentId: string | null;
  retryCount: number; // 0-3
  backoffMs: number; // 1000 / 2000 / 4000
  declineCode: DeclineCode | null;
  orderId: string | null;
  errorRef: string | null; // Support reference
  eventLog: LogEntry[];
}

// Card form state (NOT stored in machine context)
export interface CardState {
  number: string; // "4242 4242 4242 4242"
  name: string;
  expiry: string; // "08/27"
  cvc: string;
  focus: string; // Drives card flip animation
}

// Action types for reducer
export type CheckoutAction =
  | { type: "START_VALIDATION"; payload: { scenario: Scenario } }
  | { type: "VALIDATION_SUCCESS" }
  | { type: "CREATE_INTENT" }
  | { type: "INTENT_SUCCESS"; payload: { intentId: string } }
  | { type: "INTENT_FAILURE" }
  | { type: "RETRY" }
  | { type: "IDEMPOTENCY_HIT"; payload: { intentId: string } }
  | { type: "CONFIRM_PAYMENT" }
  | { type: "PAYMENT_SUCCESS" }
  | { type: "PAYMENT_DECLINED"; payload: { declineCode: DeclineCode } }
  | { type: "CREATE_ORDER" }
  | { type: "ORDER_SUCCESS"; payload: { orderId: string } }
  | { type: "ORDER_FAILURE"; payload: { errorRef: string } }
  | { type: "RECOVER_ORDER" }
  | { type: "RECOVERY_SUCCESS"; payload: { orderId: string } }
  | { type: "HARD_FAILURE"; payload: { errorRef: string } }
  | { type: "RESET" }
  | { type: "LOG_EVENT"; payload: Omit<LogEntry, "id"> };

// Mock API response types
export interface IntentResponse {
  intentId: string;
  status: "created" | "cached";
}

export interface ConfirmResponse {
  status: "confirmed" | "declined";
  declineCode?: DeclineCode;
}

export interface OrderResponse {
  orderId: string;
  status: "created";
}
