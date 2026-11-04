import { useState } from "react";

const emptyActivity = { title: "", date: "", time: "", location: "", notes: "" };

const baseInputClass =
  "touch-target mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs transition-all min-h-[44px]";

// minDate / maxDate are the trip's start and end dates.
export default function ActivityForm({
  initialActivity = emptyActivity,
  minDate,
  maxDate,
  submitLabel,
  onSubmit,
  onCancel,
}) {
  const [activity, setActivity] = useState(initialActivity);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    setActivity({ ...activity, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSubmit(activity);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const hasDateError = error.toLowerCase().includes("date");
  const hasTitleError = error.toLowerCase().includes("title");
  const hasTimeError = error.toLowerCase().includes("time");

  function getInputClass(hasFieldError) {
    return hasFieldError
      ? `${baseInputClass} border-rose-500 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20`
      : `${baseInputClass} border-slate-300 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Backend 400 Validation Error Feedback */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-start gap-2.5 shadow-xs">
          <svg className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-semibold text-rose-900">{error}</p>
            <p className="text-[11px] text-rose-700 mt-0.5">Please check dates, time format (HH:MM), and required title.</p>
          </div>
        </div>
      )}

      {/* Activity Title */}
      <label className="block text-xs font-semibold text-slate-800">
        Activity title
        <input
          name="title"
          value={activity.title}
          onChange={handleChange}
          required
          aria-invalid={hasTitleError ? "true" : undefined}
          placeholder="e.g. Louvre Museum Guided Tour"
          className={getInputClass(hasTitleError)}
        />
      </label>

      {/* Date & Time Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-slate-800">
          Date
          <input
            type="date"
            name="date"
            value={activity.date}
            min={minDate}
            max={maxDate}
            onChange={handleChange}
            required
            aria-invalid={hasDateError ? "true" : undefined}
            className={getInputClass(hasDateError)}
          />
          {minDate && maxDate && (
            <span className="text-[11px] text-slate-500 mt-1 block">
              Trip dates: {minDate} to {maxDate}
            </span>
          )}
        </label>

        <label className="block text-xs font-semibold text-slate-800">
          Time
          <input
            type="time"
            name="time"
            value={activity.time}
            onChange={handleChange}
            aria-invalid={hasTimeError ? "true" : undefined}
            className={getInputClass(hasTimeError)}
          />
        </label>
      </div>

      {/* Location */}
      <label className="block text-xs font-semibold text-slate-800">
        Location
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <input
            name="location"
            value={activity.location}
            onChange={handleChange}
            placeholder="e.g. Rue de Rivoli, Paris"
            className={`${getInputClass(false)} pl-10`}
          />
        </div>
      </label>

      {/* Notes */}
      <label className="block text-xs font-semibold text-slate-800">
        Notes
        <textarea
          name="notes"
          value={activity.notes}
          onChange={handleChange}
          rows="2"
          placeholder="Add voucher confirmation, tickets, or dress code notes..."
          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
        />
      </label>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="touch-target w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors min-h-[44px]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="touch-target w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-sky-700 active:bg-sky-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 min-h-[44px]"
        >
          {saving && (
            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          <span>{submitLabel}</span>
        </button>
      </div>
    </form>
  );
}
