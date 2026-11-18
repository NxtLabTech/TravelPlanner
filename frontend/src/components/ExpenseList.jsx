import { formatBudget, formatDate } from "../format.js";

export default function ExpenseList({ expenses, onEdit, onDelete }) {
  if (expenses.length === 0) {
    return <p className="text-sm text-gray-500">No expenses yet.</p>;
  }

  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  return (
    <div className="overflow-hidden rounded border border-gray-200 bg-white">
      <ul className="divide-y divide-gray-200">
        {expenses.map((expense) => (
          <li key={expense.id} className="flex items-start justify-between gap-4 p-3">
            <div>
              <p className="font-medium">{expense.title}</p>
              <p className="text-sm text-gray-600">
                {expense.category} · {formatDate(expense.date)}
              </p>
              {expense.notes && <p className="text-sm text-gray-500">{expense.notes}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-3 text-sm">
              <span className="font-semibold">{formatBudget(expense.amount)}</span>
              <button onClick={() => onEdit(expense)} className="text-blue-600 hover:underline">Edit</button>
              <button onClick={() => onDelete(expense)} className="text-red-600 hover:underline">Delete</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-gray-200 px-3 py-3 text-right text-sm">
        <span className="text-gray-600">Total: </span>
        <span className="font-semibold">{formatBudget(total)}</span>
      </div>
    </div>
  );
}
