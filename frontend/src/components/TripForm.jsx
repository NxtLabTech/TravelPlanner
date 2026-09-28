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

const inputClass = "mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2";

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <label className="block text-sm font-medium">
        Trip name
        <input name="name" value={trip.name} onChange={handleChange} required className={inputClass} />
      </label>

      <label className="block text-sm font-medium">
        Destination
        <input
          name="destination"
          value={trip.destination}
          onChange={handleChange}
          required
          className={inputClass}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Start date
          <input
            type="date"
            name="start_date"
            value={trip.start_date}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          End date
          <input
            type="date"
            name="end_date"
            value={trip.end_date}
            min={trip.start_date}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </label>
      </div>

      <label className="block text-sm font-medium">
        Budget (₹)
        <input
          type="number"
          name="budget"
          value={trip.budget}
          onChange={handleChange}
          min="0"
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-medium">
        Description
        <textarea
          name="description"
          value={trip.description}
          onChange={handleChange}
          rows="3"
          className={inputClass}
        />
      </label>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitLabel}
        </button>
        <Link to={cancelTo} className="rounded border border-gray-300 px-4 py-2 text-sm">
          Cancel
        </Link>
      </div>
    </form>
  );
}
