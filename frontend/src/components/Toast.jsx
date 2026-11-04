import { useEffect } from "react";

const VISIBLE_MS = 6000;

// A short message at the bottom of the screen, with an optional action
// such as "Undo". It hides itself after a few seconds.
export default function Toast({ message, actionLabel, onAction, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-10 print:hidden mx-auto flex max-w-sm items-center justify-between gap-4 rounded bg-gray-900 px-4 py-3 text-sm text-white shadow-lg"
    >
      <span>{message}</span>
      <div className="flex shrink-0 gap-3">
        {actionLabel && (
          <button onClick={onAction} className="font-semibold text-blue-300 hover:underline">
            {actionLabel}
          </button>
        )}
        <button onClick={onDismiss} aria-label="Dismiss" className="text-gray-400 hover:text-white">
          ✕
        </button>
      </div>
    </div>
  );
}
