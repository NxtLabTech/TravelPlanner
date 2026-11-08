async function request(method, url, body) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Something went wrong");
  }
  return data;
}

export function getCurrentUser() {
  return request("GET", "/api/auth/me");
}

export function register(credentials) {
  return request("POST", "/api/auth/register", credentials);
}

export function login(credentials) {
  return request("POST", "/api/auth/login", credentials);
}

export function logout() {
  return request("POST", "/api/auth/logout");
}

export function getTrips({ search = "", status = "", page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  params.set("page", page);
  params.set("limit", limit);
  return request("GET", `/api/trips?${params}`);
}

export function getTrip(id) {
  return request("GET", `/api/trips/${id}`);
}

export function createTrip(trip) {
  return request("POST", "/api/trips", trip);
}

export function updateTrip(id, trip) {
  return request("PUT", `/api/trips/${id}`, trip);
}

export function deleteTrip(id) {
  return request("DELETE", `/api/trips/${id}`);
}

export function getActivities(tripId) {
  return request("GET", `/api/trips/${tripId}/activities`);
}

export function getWeather(tripId) {
  return request("GET", `/api/trips/${tripId}/weather`);
}

export function getTripLocation(tripId) {
  return request("GET", `/api/trips/${tripId}/location`);
}

export function createActivity(tripId, activity) {
  return request("POST", `/api/trips/${tripId}/activities`, activity);
}

export function updateActivity(id, activity) {
  return request("PUT", `/api/activities/${id}`, activity);
}

export function deleteActivity(id) {
  return request("DELETE", `/api/activities/${id}`);
}

export function getExpenses(tripId) {
  return request("GET", `/api/trips/${tripId}/expenses`);
}

export function createExpense(tripId, expense) {
  return request("POST", `/api/trips/${tripId}/expenses`, expense);
}

export function updateExpense(id, expense) {
  return request("PUT", `/api/expenses/${id}`, expense);
}

export function deleteExpense(id) {
  return request("DELETE", `/api/expenses/${id}`);
}

export function getDocuments(tripId) {
  return request("GET", `/api/trips/${tripId}/documents`);
}

export async function uploadDocument(tripId, file, documentType) {
  const body = new FormData();
  body.append("file", file);
  body.append("document_type", documentType);
  const response = await fetch(`/api/trips/${tripId}/documents`, {
    method: "POST",
    body,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Something went wrong");
  return data;
}

export function downloadDocument(id) {
  return `/api/documents/${id}/download`;
}

export function deleteDocument(id) {
  return request("DELETE", `/api/documents/${id}`);
}
