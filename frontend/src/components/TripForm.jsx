import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { countDays, formatBudget, pluralize } from "../format.js";

const emptyTrip = {
  name: "",
  destination: "",
  start_date: "",
  end_date: "",
  budget: "",
  description: "",
};

// Digits with an optional decimal point and up to two decimals.
const BUDGET_PATTERN = /^\d*\.?\d{0,2}$/;

const inputClass = "mt-1 w-full rounded border bg-white px-3 py-2";

function inputBorder(hasError) {
  return hasError ? "border-red-500" : "border-gray-300";
}

// Returns { field: message } for every field that needs fixing.
function validate(trip) {
  const errors = {};
  if (!trip.name.trim()) errors.name = "Trip name is required";
  if (!trip.destination.trim()) errors.destination = "Destination is required";
  if (!trip.start_date) errors.start_date = "Start date is required";
  if (!trip.end_date) errors.end_date = "End date is required";
  else if (trip.start_date && trip.end_date < trip.start_date) {
    errors.end_date = "End date cannot be before start date";
  }
  if (trip.budget !== "" && Number.isNaN(Number(trip.budget))) errors.budget = "Budget must be a number";
  return errors;
}

// A label, its input and the input's error message, linked for screen readers.
function Field({ label, required, hint, error, children }) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required ? (
          <span className="text-red-600" aria-hidden="true">
            {" "}*
          </span>
        ) : (
          <span className="font-normal text-gray-500"> (optional)</span>
        )}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-sm text-gray-500">
          {hint}
        </p>
      )}
    </div>
  );
}

export default function TripForm({ initialTrip = emptyTrip, submitLabel, onSubmit, cancelTo }) {
  const [trip, setTrip] = useState(() => ({
    ...initialTrip,
    // The budget input is text, so show 0 as empty and numbers as strings.
    budget: Number(initialTrip.budget) > 0 ? String(initialTrip.budget) : "",
  }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);
  const errorRef = useRef(null);

  // Bring a server error into view; the form can be taller than the screen.
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }, [error]);

  function update(changes) {
    setTrip((current) => ({ ...current, ...changes }));
    // Clear the errors of the fields being changed.
    setFieldErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(changes)) delete next[key];
      return next;
    });
  }

  function handleChange(event) {
    update({ [event.target.name]: event.target.value });
  }

  function handleStartDateChange(event) {
    const startDate = event.target.value;
    // Move the end date along when it is empty or would end up before the start.
    if (startDate && (!trip.end_date || trip.end_date < startDate)) {
      update({ start_date: startDate, end_date: startDate });
    } else {
      update({ start_date: startDate });
    }
  }

  function handleBudgetChange(event) {
    if (BUDGET_PATTERN.test(event.target.value)) update({ budget: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const errors = validate(trip);
    setFieldErrors(errors);
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
      formRef.current.elements[firstInvalid]?.focus();
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ ...trip, budget: trip.budget === "" ? 0 : Number(trip.budget) });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const datesValid = trip.start_date && trip.end_date && trip.end_date >= trip.start_date;
  const budgetValue = Number(trip.budget);

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && (
        <p ref={errorRef} role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <p className="text-sm text-gray-500">
        Fields marked <span className="text-red-600">*</span> are required.
      </p>

      <Field label="Trip name" required error={fieldErrors.name}>
        {(props) => (
          <input
            {...props}
            name="name"
            value={trip.name}
            onChange={handleChange}
            placeholder="e.g. Goa weekend"
            className={`${inputClass} ${inputBorder(fieldErrors.name)}`}
          />
        )}
      </Field>

      <Field label="Destination" required error={fieldErrors.destination}>
        {(props) => (
          <input
            {...props}
            name="destination"
            value={trip.destination}
            onChange={handleChange}
            placeholder="e.g. Goa, India"
            className={`${inputClass} ${inputBorder(fieldErrors.destination)}`}
          />
        )}
      </Field>

      <div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date" required error={fieldErrors.start_date}>
            {(props) => (
              <input
                {...props}
                type="date"
                name="start_date"
                value={trip.start_date}
                onChange={handleStartDateChange}
                className={`${inputClass} ${inputBorder(fieldErrors.start_date)}`}
              />
            )}
          </Field>
          <Field label="End date" required error={fieldErrors.end_date}>
            {(props) => (
              <input
                {...props}
                type="date"
                name="end_date"
                value={trip.end_date}
                min={trip.start_date}
                onChange={handleChange}
                className={`${inputClass} ${inputBorder(fieldErrors.end_date)}`}
              />
            )}
          </Field>
        </div>
        {datesValid && (
          <p className="mt-1 text-sm text-gray-500" aria-live="polite">
            {pluralize(countDays(trip.start_date, trip.end_date), "day")}
          </p>
        )}
      </div>

      <Field
        label="Budget (₹)"
        hint={budgetValue > 0 ? formatBudget(budgetValue) : undefined}
        error={fieldErrors.budget}
      >
        {(props) => (
          <input
            {...props}
            type="text"
            inputMode="decimal"
            name="budget"
            value={trip.budget}
            onChange={handleBudgetChange}
            placeholder="e.g. 20000"
            className={`${inputClass} ${inputBorder(fieldErrors.budget)}`}
          />
        )}
      </Field>

      <Field label="Description">
        {(props) => (
          <textarea
            {...props}
            name="description"
            value={trip.description}
            onChange={handleChange}
            rows="3"
            placeholder="Who's going, what to pack, anything to remember"
            className={`${inputClass} border-gray-300`}
          />
        )}
      </Field>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : submitLabel}
        </button>
        <Link to={cancelTo} className="rounded border border-gray-300 px-4 py-2 text-sm">
          Cancel
        </Link>
      </div>
    </form>
  );
}
