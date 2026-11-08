import { useState } from "react";
import { Link } from "react-router-dom";

const emptyTrip = {
  name: "",
  destination: "",
  start_date: "",
  end_date: "",
  budget: "",
  description: "",
  reminder_days: null,
  timezone: "UTC",
  destinations: [""],
};

const inputClass = "mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2";

export default function TripForm({ initialTrip = emptyTrip, submitLabel, onSubmit, cancelTo }) {
  const [trip, setTrip] = useState({
    ...initialTrip,
    destinations: initialTrip.destinations?.length
      ? initialTrip.destinations
      : [initialTrip.destination || ""],
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    setTrip({ ...trip, [event.target.name]: event.target.value });
  }

  function updateDestination(index, value) {
    const destinations = [...trip.destinations];
    destinations[index] = value;
    setTrip({ ...trip, destinations });
  }

  function addDestination() {
    setTrip({ ...trip, destinations: [...trip.destinations, ""] });
  }

  function removeDestination(index) {
    if (trip.destinations.length === 1) return;
    setTrip({ ...trip, destinations: trip.destinations.filter((_, itemIndex) => itemIndex !== index) });
  }

  function moveDestination(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= trip.destinations.length) return;
    const destinations = [...trip.destinations];
    [destinations[index], destinations[target]] = [destinations[target], destinations[index]];
    setTrip({ ...trip, destinations });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSubmit({
        ...trip,
        destination: trip.destinations[0],
        destinations: trip.destinations.map((destination) => destination.trim()),
        budget: trip.budget === "" ? 0 : Number(trip.budget),
        reminder_days: trip.reminder_days === "" || trip.reminder_days == null
          ? null
          : Number(trip.reminder_days),
        timezone: trip.timezone?.trim() || "UTC",
      });
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

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Destinations</legend>
        {trip.destinations.map((destination, index) => (
          <div key={index} className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`destination-${index}`}>
              Destination {index + 1}
            </label>
            <input
              id={`destination-${index}`}
              value={destination}
              onChange={(event) => updateDestination(index, event.target.value)}
              required
              className={inputClass}
              placeholder={`Destination ${index + 1}`}
            />
            <button
              type="button"
              aria-label={`Move destination ${index + 1} up`}
              onClick={() => moveDestination(index, -1)}
              disabled={index === 0}
            >
              Up
            </button>
            <button
              type="button"
              aria-label={`Move destination ${index + 1} down`}
              onClick={() => moveDestination(index, 1)}
              disabled={index === trip.destinations.length - 1}
            >
              Down
            </button>
            <button
              type="button"
              aria-label={`Remove destination ${index + 1}`}
              onClick={() => removeDestination(index)}
              disabled={trip.destinations.length === 1}
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addDestination} className="text-sm text-blue-600 hover:underline">
          Add destination
        </button>
      </fieldset>

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
        Trip reminder
        <select
          name="reminder_days"
          value={trip.reminder_days ?? ""}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="">No reminder</option>
          <option value="1">1 day before</option>
          <option value="3">3 days before</option>
          <option value="7">7 days before</option>
        </select>
      </label>

      <label className="block text-sm font-medium">
        Timezone
        <input
          name="timezone"
          value={trip.timezone ?? "UTC"}
          onChange={handleChange}
          placeholder="e.g. America/New_York"
          className={inputClass}
        />
        <span className="mt-1 block text-xs font-normal text-gray-500">Use an IANA timezone such as Asia/Kolkata or America/New_York.</span>
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
