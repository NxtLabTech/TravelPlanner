import { useEffect, useState } from "react";
import { createExpense, deleteExpense, getExpenses, updateExpense } from "../services/api.js";
import { formatBudget, formatDate } from "../format.js";
import ExpenseForm from "./ExpenseForm.jsx";

export default function Expenses({ tripId }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // null = form hidden, {} = adding a new expense, otherwise the expense being edited
  const [formExpense, setFormExpense] = useState(null);

  useEffect(() => {
    let ignore = false;
    getExpenses(tripId)
      .then((data) => {
        if (!ignore) setExpenses(data);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [tripId]);

  async function reloadExpenses() {
    setExpenses(await getExpenses(tripId));
  }

  async function handleSaveExpense(expense) {
    if (formExpense.id) {
      await updateExpense(formExpense.id, expense);
    } else {
      await createExpense(tripId, expense);
    }
    await reloadExpenses();
    setFormExpense(null);
  }

  async function handleDeleteExpense(expense) {
    if (!window.confirm(`Delete "${expense.title}"?`)) return;
    setError("");
    try {
      await deleteExpense(expense.id);
      await reloadExpenses();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <div className="mt-8 mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Expenses</h2>
        {!formExpense && (
          <button
            onClick={() => setFormExpense({})}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Add expense
          </button>
        )}
      </div>

      {error && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {formExpense && (
        <div className="mb-5">
          <ExpenseForm
            key={formExpense.id || "new"}
            initialExpense={formExpense.id ? formExpense : undefined}
            submitLabel={formExpense.id ? "Save expense" : "Add expense"}
            onSubmit={handleSaveExpense}
            onCancel={() => setFormExpense(null)}
          />
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {!loading && !error && expenses.length === 0 && <p className="text-sm text-gray-500">No expenses yet.</p>}

      {expenses.length > 0 && (
        <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
          {expenses.map((expense) => (
            <li key={expense.id} className="flex items-start justify-between gap-4 p-3">
              <div>
                <p className="font-medium">{expense.title}</p>
                <p className="text-sm text-gray-600">
                  <span className="capitalize">{expense.category}</span> · {formatDate(expense.date)}
                </p>
                {expense.notes && <p className="text-sm text-gray-500">{expense.notes}</p>}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <p className="font-medium">{formatBudget(expense.amount)}</p>
                <div className="flex gap-3 text-sm">
                  <button onClick={() => setFormExpense(expense)} className="text-blue-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteExpense(expense)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
