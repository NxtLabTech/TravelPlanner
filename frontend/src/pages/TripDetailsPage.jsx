import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createActivity,
  createExpense,
  deleteDocument,
  deleteActivity,
  deleteExpense,
  deleteTrip,
  getActivities,
  getExpenses,
  getDocuments,
  getTrip,
  getTripLocation,
  getWeather,
  updateActivity,
  updateExpense,
  uploadDocument,
  downloadDocument,
} from "../services/api.js";
import { formatBudget, formatDate } from "../format.js";
import StatusBadge from "../components/StatusBadge.jsx";
import ActivityForm from "../components/ActivityForm.jsx";
import Itinerary from "../components/Itinerary.jsx";
import DestinationMap from "../components/DestinationMap.jsx";
import ExpenseForm from "../components/ExpenseForm.jsx";
import ActivityCalendar from "../components/ActivityCalendar.jsx";

export default function TripDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [activities, setActivities] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [documentError, setDocumentError] = useState("");
  const [documentUploading, setDocumentUploading] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);
  const [activitySearch, setActivitySearch] = useState("");
  const [error, setError] = useState("");
  const [deletingActivityId, setDeletingActivityId] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState("");
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState("");
  // null = form hidden, {} = adding a new activity, otherwise the activity being edited
  const [formActivity, setFormActivity] = useState(null);
  const [formExpense, setFormExpense] = useState(null);
  const [activityView, setActivityView] = useState("list");

  useEffect(() => {
    Promise.all([getTrip(id), getActivities(id), getExpenses(id)])
      .then(([tripData, activityData, expenseData]) => {
        setTrip(tripData);
        setActivities(activityData);
        setExpenses(expenseData);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    getDocuments(id)
      .then(setDocuments)
      .catch(() => setDocumentError("Unable to load documents."));
  }, [id]);

  useEffect(() => {
    let ignore = false;
    setLocationLoading(true);
    setLocationError("");
    getTripLocation(id)
      .then((data) => {
        if (!ignore) setLocation(data);
      })
      .catch(() => {
        if (!ignore) setLocationError("Map location is unavailable.");
      })
      .finally(() => {
        if (!ignore) setLocationLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    let ignore = false;
    setWeatherLoading(true);
    setWeatherError("");
    getWeather(id)
      .then((data) => {
        if (!ignore) setWeather(data);
      })
      .catch(() => {
        if (!ignore) setWeatherError("Weather information is unavailable.");
      })
      .finally(() => {
        if (!ignore) setWeatherLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  async function reloadActivities() {
    setActivities(await getActivities(id));
  }

  async function reloadExpenses() {
    setExpenses(await getExpenses(id));
  }

  async function handleSaveActivity(activity) {
    if (formActivity.id) {
      await updateActivity(formActivity.id, activity);
    } else {
      await createActivity(id, activity);
    }
    await reloadActivities();
    setFormActivity(null);
  }

  async function handleDeleteActivity(activity) {
    if (!window.confirm(`Delete "${activity.title}"?`)) return;
    setError("");
    setDeletingActivityId(activity.id);
    try {
      await deleteActivity(activity.id);
      await reloadActivities();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingActivityId(null);
    }
  }

  async function handleSaveExpense(expense) {
    if (formExpense.id) {
      await updateExpense(formExpense.id, expense);
    } else {
      await createExpense(id, expense);
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

  async function handleUploadDocument(event) {
    const file = event.target.files[0];
    if (!file) return;
    setDocumentError("");
    setDocumentUploading(true);
    try {
      const documentType = event.currentTarget.form.elements.namedItem("document_type").value;
      await uploadDocument(id, file, documentType);
      setDocuments(await getDocuments(id));
      event.target.form.reset();
    } catch (err) {
      setDocumentError(err.message);
    } finally {
      setDocumentUploading(false);
    }
  }

  async function handleDeleteDocument(document) {
    if (!window.confirm(`Delete "${document.document_name}"?`)) return;
    setDeletingDocumentId(document.id);
    setDocumentError("");
    try {
      await deleteDocument(document.id);
      setDocuments(await getDocuments(id));
    } catch (err) {
      setDocumentError(err.message);
    } finally {
      setDeletingDocumentId(null);
    }
  }

  async function handleDeleteTrip() {
    if (
      !window.confirm(
        "Are you sure you want to delete this trip? All activities associated with this trip will also be deleted."
      )
    ) {
      return;
    }
    setError("");
    try {
      await deleteTrip(id);
      navigate("/");
    } catch (err) {
      setError("Unable to delete the trip. Please try again.");
    }
  }

  const normalizedActivitySearch = activitySearch.trim().toLowerCase();
  const filteredActivities = normalizedActivitySearch
    ? activities.filter((activity) =>
        [activity.title, activity.location].some((value) =>
          value?.toLowerCase().includes(normalizedActivitySearch)
        )
      )
    : activities;

  if (!trip) {
    return error ? (
      <div>
        <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          Back to trips
        </Link>
      </div>
    ) : (
      <p className="text-sm text-gray-500">Loading...</p>
    );
  }

  return (
    <div>
      <Link to="/" className="text-sm text-blue-600 hover:underline">
        ← All trips
      </Link>

      {error && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{trip.name}</h1>
          <p className="text-gray-600">{(trip.destinations || [trip.destination]).join(" → ")}</p>
        </div>
        <div className="flex gap-3">
          <a
            href={`/api/trips/${id}/itinerary.pdf`}
            className="rounded border border-blue-300 px-4 py-2 text-sm text-blue-700"
          >
            Export PDF
          </a>
          <a
            href={`/api/trips/${id}/activities.csv`}
            className="rounded border border-blue-300 px-4 py-2 text-sm text-blue-700"
          >
            Export CSV
          </a>
          <Link to={`/trips/${id}/edit`} className="rounded border border-gray-300 px-4 py-2 text-sm">
            Edit trip
          </Link>
          <button
            onClick={handleDeleteTrip}
            className="rounded border border-red-300 px-4 py-2 text-sm text-red-700"
          >
            Delete trip
          </button>
        </div>
      </div>

      <dl className="mt-4 grid gap-4 rounded border border-gray-200 bg-white p-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-gray-500">Status</dt>
          <dd className="mt-1">
            <StatusBadge status={trip.status} />
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Dates</dt>
          <dd className="mt-1">
            {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Timezone</dt>
          <dd className="mt-1">{trip.timezone || "UTC"}</dd>
        </div>
        {trip.description && (
          <div className="sm:col-span-4">
            <dt className="text-gray-500">Description</dt>
            <dd className="mt-1">{trip.description}</dd>
          </div>
        )}
      </dl>

      <section
        aria-labelledby="budget-summary-heading"
        className="mt-4 rounded border border-gray-200 bg-white p-4"
      >
        <h2 id="budget-summary-heading" className="text-sm font-semibold text-gray-500">
          Budget
        </h2>
        <p className="mt-1 text-sm text-gray-600">Total trip budget</p>
        <p className="mt-1 text-xl font-semibold">{formatBudget(trip.budget)}</p>
      </section>

      <section
        aria-labelledby="reminder-heading"
        className="mt-4 rounded border border-gray-200 bg-white p-4"
      >
        <h2 id="reminder-heading" className="text-sm font-semibold text-gray-500">
          Trip reminder
        </h2>
        <p className="mt-1 text-sm">
          {trip.reminder_days
            ? `Remind me ${trip.reminder_days} day${trip.reminder_days === 1 ? "" : "s"} before the trip`
            : "No reminder set"}
        </p>
      </section>

      <section aria-labelledby="documents-heading" className="mt-8">
        <h2 id="documents-heading" className="mb-3 text-xl font-semibold">Documents</h2>
        <form className="mb-4 grid gap-3 rounded border border-gray-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto]">
          <label className="text-sm font-medium">
            Document type
            <select name="document_type" defaultValue="Other" className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2">
              <option>Hotel booking</option>
              <option>Flight ticket</option>
              <option>Train ticket</option>
              <option>Travel insurance</option>
              <option>Other</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            File
            <input
              type="file"
              name="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={handleUploadDocument}
              disabled={documentUploading}
              className="mt-1 block w-full text-sm"
            />
          </label>
          <span className="self-end text-xs text-gray-500">PDF, PNG, JPG, DOC, DOCX (max 10 MB)</span>
        </form>
        {documentError && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{documentError}</p>}
        {documents.length === 0 ? (
          <p className="text-sm text-gray-500">No documents uploaded.</p>
        ) : (
          <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
            {documents.map((document) => (
              <li key={document.id} className="flex items-center justify-between gap-3 p-3">
                <div>
                  <p className="font-medium">{document.document_name}</p>
                  <p className="text-sm text-gray-500">{document.document_type} · {document.uploaded_at}</p>
                </div>
                <div className="flex gap-3 text-sm">
                  <a href={downloadDocument(document.id)} className="text-blue-600 hover:underline">Download</a>
                  <button
                    onClick={() => handleDeleteDocument(document)}
                    disabled={deletingDocumentId === document.id}
                    className="text-red-600 hover:underline disabled:opacity-50"
                  >
                    {deletingDocumentId === document.id ? "Removing..." : "Remove"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        aria-labelledby="destination-map-heading"
        className="mt-4 rounded border border-gray-200 bg-white p-4"
      >
        <h2 id="destination-map-heading" className="text-sm font-semibold text-gray-500">
          Trip destination map
        </h2>
        {locationLoading && <p className="mt-2 text-sm text-gray-500">Loading map...</p>}
        {!locationLoading && locationError && (
          <p className="mt-2 text-sm text-gray-500">{locationError}</p>
        )}
        {!locationLoading && !locationError && location && (
          <DestinationMap destination={trip.destination} location={location} />
        )}
      </section>

      <section
        aria-labelledby="weather-heading"
        className="mt-4 rounded border border-gray-200 bg-white p-4"
      >
        <h2 id="weather-heading" className="text-sm font-semibold text-gray-500">
          Weather
        </h2>
        {weatherLoading && <p className="mt-2 text-sm text-gray-500">Loading weather...</p>}
        {!weatherLoading && weatherError && (
          <p className="mt-2 text-sm text-gray-500">{weatherError}</p>
        )}
        {!weatherLoading && !weatherError && weather && (
          <dl className="mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-gray-500">Temperature</dt>
              <dd className="font-medium">
                {weather.temperature}{weather.units.temperature}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Condition</dt>
              <dd className="font-medium">{weather.condition}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Humidity</dt>
              <dd className="font-medium">{weather.humidity}%</dd>
            </div>
            <div>
              <dt className="text-gray-500">Wind speed</dt>
              <dd className="font-medium">
                {weather.wind_speed} {weather.units.wind_speed}
              </dd>
            </div>
          </dl>
        )}
      </section>

      <section aria-labelledby="expenses-heading" className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="expenses-heading" className="text-xl font-semibold">Expenses</h2>
          {!formExpense && (
            <button
              onClick={() => setFormExpense({})}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Add expense
            </button>
          )}
        </div>

        {formExpense && (
          <div className="mb-5">
            <ExpenseForm
              key={formExpense.id || "new"}
              initialExpense={formExpense.id ? formExpense : undefined}
              minDate={trip.start_date}
              maxDate={trip.end_date}
              submitLabel={formExpense.id ? "Save expense" : "Add expense"}
              onSubmit={handleSaveExpense}
              onCancel={() => setFormExpense(null)}
            />
          </div>
        )}

        {expenses.length === 0 ? (
          <p className="text-sm text-gray-500">No expenses yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
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
                  <span className="font-medium">{formatBudget(expense.amount)}</span>
                  <button
                    onClick={() => setFormExpense(expense)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(expense)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8 mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Itinerary</h2>
        {!formActivity && (
          <button
            onClick={() => setFormActivity({})}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Add activity
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-2" role="tablist" aria-label="Activity view">
        {[
          ["list", "List view"],
          ["calendar", "Calendar view"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={activityView === value}
            onClick={() => setActivityView(value)}
            className={`rounded border px-3 py-2 text-sm ${
              activityView === value
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <input
        type="search"
        placeholder="Search activities"
        aria-label="Search activities"
        value={activitySearch}
        onChange={(event) => setActivitySearch(event.target.value)}
        className="mb-5 w-full rounded border border-gray-300 bg-white px-3 py-2"
      />

      {formActivity && (
        <div className="mb-5">
          <ActivityForm
            key={formActivity.id || "new"}
            initialActivity={formActivity.id ? formActivity : undefined}
            minDate={trip.start_date}
            maxDate={trip.end_date}
            submitLabel={formActivity.id ? "Save activity" : "Add activity"}
            onSubmit={handleSaveActivity}
            onCancel={() => setFormActivity(null)}
          />
        </div>
      )}

      {activityView === "calendar" ? (
        <ActivityCalendar
          activities={filteredActivities}
          startDate={trip.start_date}
          endDate={trip.end_date}
        />
      ) : activities.length > 0 && filteredActivities.length === 0 ? (
        <p className="text-sm text-gray-500">No activities found.</p>
      ) : (
        <Itinerary
          activities={filteredActivities}
          onEdit={setFormActivity}
          onDelete={handleDeleteActivity}
          deletingActivityId={deletingActivityId}
        />
      )}
    </div>
  );
}
