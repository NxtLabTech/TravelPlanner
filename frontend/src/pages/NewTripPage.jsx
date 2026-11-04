import { useNavigate } from "react-router-dom";
import { createTrip } from "../services/api.js";
import TripForm from "../components/TripForm.jsx";

export default function NewTripPage() {
  const navigate = useNavigate();

  async function handleSubmit(trip) {
    const created = await createTrip(trip);
    navigate(`/trips/${created.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto py-2">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">New trip</h1>
        <p className="text-sm text-slate-500 mt-1">
          Specify destination, travel dates, and optional budget to start planning.
        </p>
      </div>
      <TripForm submitLabel="Create trip" onSubmit={handleSubmit} cancelTo="/" />
    </div>
  );
}
