import { useEffect, useId, useRef } from "react";

// A modal asking the user to confirm a destructive action. Escape, the
// Cancel button and a click on the backdrop all cancel. Cancel has focus
// first so pressing Enter by accident doesn't delete anything.
export default function ConfirmDialog({ title, message, confirmLabel = "Delete", onConfirm, onCancel }) {
  const titleId = useId();
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-20 flex print:hidden items-center justify-center bg-black/40 px-4"
      onClick={(event) => event.target === event.currentTarget && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded bg-white p-5 shadow-lg"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button ref={cancelRef} onClick={onCancel} className="rounded border border-gray-300 px-4 py-2 text-sm">
            Cancel
          </button>
          <button onClick={onConfirm} className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
