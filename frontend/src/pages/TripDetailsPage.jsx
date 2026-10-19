import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createActivity,
  deleteActivity,
  deleteTrip,
  getActivities,
  getTrip,
  getTripWeather,
  updateActivity,
} from "../services/api.js";
import { formatBudget, formatDate } from "../format.js";
import StatusBadge from "../components/StatusBadge.jsx";
import ActivityForm from "../components/ActivityForm.jsx";
import Itinerary from "../components/Itinerary.jsx";

export default function TripDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState("");
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState("");
  // null = form hidden, {} = adding a new activity, otherwise the activity being edited
  const [formActivity, setFormActivity] = useState(null);

  useEffect(() => {
    Promise.all([getTrip(id), getActivities(id)])
      .then(([tripData, activityData]) => {
        setTrip(tripData);
        setActivities(activityData);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    setWeather(null);
    setWeatherError("");
    setWeatherLoading(true);

    getTripWeather(id)
      .then((data) => {
        if (!cancelled) {
          setWeather(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWeatherError(
            "Weather information is currently unavailable."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setWeatherLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function reloadActivities() {
    setActivities(await getActivities(id));
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
    try {
      await deleteActivity(activity.id);
      await reloadActivities();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteTrip() {
    if (!window.confirm(`Delete "${trip.name}" and all its activities?`)) return;
    try {
      await deleteTrip(id);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

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
          <p className="text-gray-600">{trip.destination}</p>
        </div>
        <div className="flex gap-3">
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
          <dt className="text-gray-500">Budget</dt>
          <dd className="mt-1">{formatBudget(trip.budget)}</dd>
        </div>
        {trip.description && (
          <div className="sm:col-span-4">
            <dt className="text-gray-500">Description</dt>
            <dd className="mt-1">{trip.description}</dd>
          </div>
        )}
      </dl>

      <section
        aria-label="Destination weather"
        className="mt-6 rounded-lg border border-gray-200 bg-white p-4"
      >
        <h2 className="text-xl font-semibold">
          Weather in {trip.destination}
        </h2>

        {weatherLoading ? (
          <p className="mt-3 text-sm text-gray-500" role="status">
            Loading weather...
          </p>
        ) : weatherError ? (
          <p className="mt-3 text-sm text-gray-600" role="status">
            {weatherError}
          </p>
        ) : weather ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-sm text-gray-500">Temperature</p>
              <p className="mt-1 text-lg font-semibold">
                {weather.temperature ?? "—"}{weather.units?.temperature ?? "°C"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Condition</p>
              <p className="mt-1 font-medium">
                {weather.condition ?? "Unknown"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Humidity</p>
              <p className="mt-1 font-medium">
                {weather.humidity ?? "—"}%
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Wind speed</p>
              <p className="mt-1 font-medium">
                {weather.wind_speed ?? "—"}{" "}
                {weather.units?.wind_speed ?? "km/h"}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-600" role="status">
            Weather information is currently unavailable.
          </p>
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

      <Itinerary activities={activities} onEdit={setFormActivity} onDelete={handleDeleteActivity} />
    </div>
  );
}
