import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn({ username, password });
      navigate(location.state?.from || "/");
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <p className="mb-1 text-sm font-medium text-blue-600">WELCOME BACK</p>
      <h1 className="mb-2 text-2xl font-semibold">Log in to TravelPlanner</h1>
      <p className="mb-4 text-sm text-gray-600">Continue planning your next journey.</p>
      <form onSubmit={handleSubmit} className="space-y-4 rounded border border-gray-200 bg-white p-4">
        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <label className="block text-sm font-medium">
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </label>
        <button type="submit" disabled={submitting} className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="mt-4 text-sm">No account? <Link to="/register" className="text-blue-600 hover:underline">Register</Link></p>
    </div>
  );
}
