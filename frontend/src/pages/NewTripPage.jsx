import { useNavigate } from "react-router-dom";
import { createTrip } from "../services/api.js";
import TripForm from "../components/TripForm.jsx";
import useDocumentTitle from "../useDocumentTitle.js";

export default function NewTripPage() {
  const navigate = useNavigate();
  useDocumentTitle("New trip");

  async function handleSubmit(trip) {
    const created = await createTrip(trip);
    navigate(`/trips/${created.id}`);
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">New trip</h1>
      <TripForm submitLabel="Create trip" onSubmit={handleSubmit} cancelTo="/" />
    </div>
  );
}
