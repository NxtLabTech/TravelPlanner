import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signUp({ username, password });
      navigate("/");
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <p className="mb-1 text-sm font-medium text-blue-600">START PLANNING</p>
      <h1 className="mb-2 text-2xl font-semibold">Create your TravelPlanner account</h1>
      <p className="mb-4 text-sm text-gray-600">Save trips, itineraries, expenses, and travel documents in one place.</p>
      <form onSubmit={handleSubmit} className="space-y-4 rounded border border-gray-200 bg-white p-4">
        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <label className="block text-sm font-medium">
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input type="password" minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </label>
        <button type="submit" disabled={submitting} className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-sm">Already registered? <Link to="/login" className="text-blue-600 hover:underline">Log in</Link></p>
    </div>
  );
}
