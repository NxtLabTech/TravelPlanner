import { formatBudget } from "../format.js";

// The trip budget compared with what its activities cost.
export default function BudgetSummary({ budget, activities }) {
  // Round to paise so decimal costs don't show as 0.30000000000000004.
  const spent = Math.round(activities.reduce((total, activity) => total + Number(activity.cost || 0), 0) * 100) / 100;

  if (budget <= 0) {
    return <span>{spent > 0 ? `${formatBudget(spent)} spent · no budget set` : "No budget set"}</span>;
  }

  const over = spent > budget;
  const percent = Math.min(100, (spent / budget) * 100);

  return (
    <div>
      <span>
        {formatBudget(spent)} of {formatBudget(budget)} spent
      </span>
      <div
        role="progressbar"
        aria-label="Budget spent"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded bg-gray-200"
      >
        <div className={`h-full ${over ? "bg-red-500" : "bg-blue-600"}`} style={{ width: `${percent}%` }} />
      </div>
      {over && <p className="mt-1 text-xs text-red-700">{formatBudget(spent - budget)} over budget</p>}
    </div>
  );
}
