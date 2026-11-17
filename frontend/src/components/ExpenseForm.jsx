
import { useState } from "react";

const CATEGORIES = [
  "Accommodation",
  "Transport",
  "Food",
  "Activities",
  "Shopping",
  "Other",
];

export default function ExpenseForm({
  expense,
  trip,
  initialExpense,
  minDate,
  maxDate,
  onSubmit,
  onCancel,
}) {
  // Support both prop naming styles
  const existingExpense = initialExpense || expense || null;
  const startDate = minDate || trip?.start_date || "";
  const endDate = maxDate || trip?.end_date || "";

  const [form, setForm] = useState({
    title: existingExpense?.title || "",
    amount: existingExpense?.amount ?? "",
    category: existingExpense?.category || "Food",
    date: existingExpense?.date || startDate,
    notes: existingExpense?.notes || "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function change(event) {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Amount must be greater than zero");
      return;
    }

    setSaving(true);

    try {
      await onSubmit({
        ...form,
        amount,
      });
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded border bg-white p-4 space-y-3"
    >
      <h3 className="font-semibold">
        {existingExpense ? "Edit expense" : "Add expense"}
      </h3>

      <input
        name="title"
        value={form.title}
        onChange={change}
        placeholder="Expense title"
        required
        className="w-full rounded border p-2"
      />

      <input
        name="amount"
        type="number"
        min="0.01"
        step="0.01"
        value={form.amount}
        onChange={change}
        placeholder="Amount"
        required
        className="w-full rounded border p-2"
      />

      <select
        name="category"
        value={form.category}
        onChange={change}
        className="w-full rounded border p-2"
      >
        {CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      <input
        name="date"
        type="date"
        min={startDate}
        max={endDate}
        value={form.date}
        onChange={change}
        required
        className="w-full rounded border p-2"
      />

      <textarea
        name="notes"
        value={form.notes}
        onChange={change}
        placeholder="Notes (optional)"
        className="w-full rounded border p-2"
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : existingExpense
              ? "Update expense"
              : "Save expense"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="rounded border px-4 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
