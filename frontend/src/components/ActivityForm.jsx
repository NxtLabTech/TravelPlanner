import { useState } from "react";

const emptyActivity = { title: "", date: "", time: "", duration_minutes: null, location: "", notes: "" };

const inputClass = "mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2";

// The form edits the duration as separate hours and minutes fields;
// the API stores it as a single number of minutes.
function toFormValues(activity) {
  const { duration_minutes, ...rest } = activity;
  return {
    ...rest,
    duration_hours: duration_minutes ? String(Math.floor(duration_minutes / 60)) : "",
    duration_mins: duration_minutes ? String(duration_minutes % 60) : "",
  };
}

function toActivity(values) {
  const { duration_hours, duration_mins, ...rest } = values;
  const hasDuration = duration_hours !== "" || duration_mins !== "";
  return {
    ...rest,
    duration_minutes: hasDuration ? Number(duration_hours || 0) * 60 + Number(duration_mins || 0) : null,
  };
}

// minDate / maxDate are the trip's start and end dates.
export default function ActivityForm({ initialActivity = emptyActivity, minDate, maxDate, submitLabel, onSubmit, onCancel }) {
  const [activity, setActivity] = useState(() => toFormValues(initialActivity));
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
      await onSubmit(toActivity(activity));
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded border border-gray-200 bg-white p-4">
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <label className="block text-sm font-medium">
        Activity title
        <input name="title" value={activity.title} onChange={handleChange} required className={inputClass} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Date
          <input
            type="date"
            name="date"
            value={activity.date}
            min={minDate}
            max={maxDate}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          Start time
          <input type="time" name="time" value={activity.time} onChange={handleChange} className={inputClass} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Duration (hours)
          <input
            type="number"
            name="duration_hours"
            value={activity.duration_hours}
            min="0"
            max="23"
            step="1"
            onChange={handleChange}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          Duration (minutes)
          <input
            type="number"
            name="duration_mins"
            value={activity.duration_mins}
            min="0"
            max="59"
            step="1"
            onChange={handleChange}
            className={inputClass}
          />
        </label>
      </div>

      <label className="block text-sm font-medium">
        Location
        <input name="location" value={activity.location} onChange={handleChange} className={inputClass} />
      </label>

      <label className="block text-sm font-medium">
        Notes
        <textarea name="notes" value={activity.notes} onChange={handleChange} rows="2" className={inputClass} />
      </label>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="rounded border border-gray-300 px-4 py-2 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
