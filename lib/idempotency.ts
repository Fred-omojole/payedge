// Generates a new UUID v4 idempotency key
export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

// Format timestamp for log entries - "14:23:01.441" format
export function formatTimestamp(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const milliseconds = now.getMilliseconds().toString().padStart(3, "0");
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

// Generate error reference code for support
export function generateErrorRef(): string {
  return `ERR-${Date.now().toString(36).toUpperCase()}`;
}

// Generate intent ID
export function generateIntentId(): string {
  return `pi_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 11)}`;
}

// Generate order ID
export function generateOrderId(): string {
  return `ord_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 11)}`;
}
