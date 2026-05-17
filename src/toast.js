// Minimal pub/sub toast system.
// Usage from anywhere: import { toast } from "./toast"; toast.success("Saved");
// The <ToastHost /> component subscribes and renders the queue.

let listeners = new Set();
let nextId = 1;

function emit(type, message, opts = {}) {
  const id = nextId++;
  const duration = opts.duration ?? (type === "error" ? 5000 : 2800);
  listeners.forEach(l => l({ id, type, message, duration }));
  return id;
}

export const toast = {
  success: (msg, opts) => emit("success", msg, opts),
  error:   (msg, opts) => emit("error", msg, opts),
  info:    (msg, opts) => emit("info", msg, opts),
};

export function subscribeToasts(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
