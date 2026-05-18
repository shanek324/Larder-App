import { useEffect, useState } from "react";
import { subscribeToasts } from "../toast";

export default function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    return subscribeToasts(t => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id));
      }, t.duration);
    });
  }, []);

  function dismiss(id) {
    setToasts(prev => prev.filter(x => x.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="toast-host" role="status" aria-live="polite">
      {toasts.map(t => {
        const isAction = t.type === "action";
        return (
          <div
            key={t.id}
            className={"toast toast-" + t.type}
            onClick={isAction ? undefined : () => dismiss(t.id)}
            role={isAction ? "alert" : undefined}
          >
            <span className="toast-icon" aria-hidden="true">
              {t.type === "success" ? "✓" : t.type === "error" ? "!" : t.type === "action" ? "↶" : "ℹ"}
            </span>
            <span className="toast-message">{t.message}</span>
            {isAction && (
              <button
                onClick={(e) => { e.stopPropagation(); t.onAction(); dismiss(t.id); }}
                className="toast-action-btn"
              >{t.actionLabel}</button>
            )}
          </div>
        );
      })}
    </div>
  );
}
