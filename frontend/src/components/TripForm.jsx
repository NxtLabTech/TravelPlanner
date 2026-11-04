import { useState } from "react";
import { Link } from "react-router-dom";

const emptyTrip = {
  name: "",
  destination: "",
  start_date: "",
  end_date: "",
  budget: "",
  description: "",
};

const baseInputClass =
  "touch-target mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs transition-all min-h-[44px]";

export default function TripForm({ initialTrip = emptyTrip, submitLabel, onSubmit, cancelTo }) {
  const [trip, setTrip] = useState(initialTrip);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    setTrip({ ...trip, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSubmit({ ...trip, budget: trip.budget === "" ? 0 : Number(trip.budget) });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const hasEndDateError = error.toLowerCase().includes("end date");
  const hasNameError = error.toLowerCase().includes("name");
  const hasDestError = error.toLowerCase().includes("destination");
  const hasBudgetError = error.toLowerCase().includes("budget");

  function getInputClass(hasFieldError) {
    return hasFieldError
      ? `${baseInputClass} border-rose-500 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20`
      : `${baseInputClass} border-slate-300 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert Banner */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-start gap-3 shadow-xs">
          <svg className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-semibold text-rose-900">{error}</p>
            <p className="text-xs text-rose-600 mt-0.5">Please adjust the highlighted information and retry.</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-5">
        {/* Trip Name */}
        <label className="block text-sm font-semibold text-slate-800">
          Trip name
          <input
            name="name"
            value={trip.name}
            onChange={handleChange}
            required
            aria-invalid={hasNameError ? "true" : undefined}
            placeholder="e.g. Kyoto Cherry Blossom Tour"
            className={getInputClass(hasNameError)}
          />
        </label>

        {/* Destination */}
        <label className="block text-sm font-semibold text-slate-800">
          Destination
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <input
              name="destination"
              value={trip.destination}
              onChange={handleChange}
              required
              aria-invalid={hasDestError ? "true" : undefined}
              placeholder="City, Country"
              className={`${getInputClass(hasDestError)} pl-10`}
            />
          </div>
        </label>

        {/* Start Date & End Date Grid */}
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-800">
            Start date
            <input
              type="date"
              name="start_date"
              value={trip.start_date}
              onChange={handleChange}
              required
              className={getInputClass(false)}
            />
          </label>

          <label className="block text-sm font-semibold text-slate-800">
            End date
            <input
              type="date"
              name="end_date"
              value={trip.end_date}
              min={trip.start_date}
              onChange={handleChange}
              required
              aria-invalid={hasEndDateError ? "true" : undefined}
              className={getInputClass(hasEndDateError)}
            />
          </label>
        </div>

        {/* Budget */}
        <label className="block text-sm font-semibold text-slate-800">
          Budget (₹)
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
              ₹
            </div>
            <input
              type="number"
              name="budget"
              value={trip.budget}
              onChange={handleChange}
              min="0"
              placeholder="0"
              aria-invalid={hasBudgetError ? "true" : undefined}
              className={`${getInputClass(hasBudgetError)} pl-8`}
            />
          </div>
        </label>

        {/* Description */}
        <label className="block text-sm font-semibold text-slate-800">
          Description
          <textarea
            name="description"
            value={trip.description}
            onChange={handleChange}
            rows="3"
            placeholder="Add general notes, highlights, or flight reminders..."
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
          />
        </label>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <Link
            to={cancelTo}
            className="touch-target w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors min-h-[44px]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="touch-target w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-sky-700 active:bg-sky-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 min-h-[44px]"
          >
            {saving && (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            <span>{submitLabel}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
