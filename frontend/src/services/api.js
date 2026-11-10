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

export function getTrips({ search = "", status = "" } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
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

export function createActivity(tripId, activity) {
  return request("POST", `/api/trips/${tripId}/activities`, activity);
}

export function updateActivity(id, activity) {
  return request("PUT", `/api/activities/${id}`, activity);
}

export function deleteActivity(id) {
  return request("DELETE", `/api/activities/${id}`);
}

// --- Documents ---

export async function getDocuments(tripId) {
  return request("GET", `/api/trips/${tripId}/documents`);
}

export async function uploadDocument(tripId, { name, category, file }) {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("category", category);
  formData.append("file", file);

  const response = await fetch(`/api/trips/${tripId}/documents`, {
    method: "POST",
    body: formData,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Upload failed");
  }
  return data;
}

export function downloadDocument(documentId) {
  // Trigger browser download via a direct link
  window.open(`/api/documents/${documentId}/download`, "_blank");
}

export function deleteDocument(id) {
  return request("DELETE", `/api/documents/${id}`);
}
