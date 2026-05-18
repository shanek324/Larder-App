// Minimal pub/sub toast system.
// Usage from anywhere: import { toast } from "./toast"; toast.success("Saved");
// The <ToastHost /> component subscribes and renders the queue.

let listeners = new Set();
let nextId = 1;

function emit(type, message, opts = {}) {
  const id = nextId++;
  const duration = opts.duration ?? (type === "error" ? 5000 : type === "action" ? 10000 : 2800);
  const payload = { id, type, message, duration };
  if (type === "action") {
    payload.actionLabel = opts.actionLabel || "Undo";
    payload.onAction = opts.onAction || (() => {});
  }
  listeners.forEach(l => l(payload));
  return id;
}

export const toast = {
  success: (msg, opts) => emit("success", msg, opts),
  error:   (msg, opts) => emit("error", msg, opts),
  info:    (msg, opts) => emit("info", msg, opts),
  // action: shows a toast with an inline button (e.g. for Undo)
  // toast.action("Recipe updated", { actionLabel: "Undo", onAction: () => revert() })
  action:  (msg, opts) => emit("action", msg, opts),
};

export function subscribeToasts(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
