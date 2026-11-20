import { useState } from "react";
import { formatDate } from "../format.js";
import CalendarView from "./CalendarView.jsx";

// Safely formats an ISO date or returns a fallback if invalid or missing
function safeFormatDate(isoDate) {
  if (!isoDate || typeof isoDate !== "string") return "Unscheduled";
  const parts = isoDate.trim().split("-");
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts.map(Number);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return isoDate;
  try {
    return formatDate(isoDate);
  } catch {
    return isoDate;
  }
}

// Safely sorts activities chronologically by date and time without mutating the original array.
export function sortActivities(activities) {
  if (!Array.isArray(activities)) return [];
  return activities
    .filter((act) => act && typeof act === "object")
    .sort((a, b) => {
      const dateA = typeof a.date === "string" ? a.date.trim() : "";
      const dateB = typeof b.date === "string" ? b.date.trim() : "";
      if (dateA !== dateB) {
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.localeCompare(dateB);
      }
      const timeA = typeof a.time === "string" ? a.time.trim() : "";
      const timeB = typeof b.time === "string" ? b.time.trim() : "";
      if (!timeA && timeB) return 1;
      if (timeA && !timeB) return -1;
      return timeA.localeCompare(timeB);
    });
}

// Groups activities that have already been sorted chronologically.
function groupByDate(activities) {
  const groups = [];
  if (!Array.isArray(activities)) return groups;
  for (const activity of activities) {
    if (!activity || typeof activity !== "object") continue;
    const dateKey =
      typeof activity.date === "string" && activity.date.trim()
        ? activity.date.trim()
        : null;
    const last = groups[groups.length - 1];
    if (last && last.date === dateKey) {
      last.activities.push(activity);
    } else {
      groups.push({ date: dateKey, activities: [activity] });
    }
  }
  return groups;
}

export default function Itinerary({
  activities = [],
  onEdit,
  onDelete,
  tripStartDate,
  tripEndDate,
}) {
  const [view, setView] = useState("list"); // "list" | "calendar"
  const [search, setSearch] = useState("");

  const sortedActivities = sortActivities(activities);

  const query = search.trim().toLowerCase();
  const filteredActivities = query
    ? sortedActivities.filter((activity) => {
        if (!activity) return false;
        const title = (activity.title || "").toLowerCase();
        const location = (activity.location || "").toLowerCase();
        return title.includes(query) || location.includes(query);
      })
    : sortedActivities;

  return (
    <div className="space-y-4">
      {/* View Switcher */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div
          className="inline-flex rounded-lg bg-gray-100 p-1"
          aria-label="Itinerary view options"
        >
          <button
            type="button"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === "list"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            List View
          </button>
          <button
            type="button"
            aria-pressed={view === "calendar"}
            onClick={() => setView("calendar")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === "calendar"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Calendar View
          </button>
        </div>
      </div>

      {view === "list" ? (
        <div className="space-y-4">
          <input
            type="search"
            placeholder="Search activities by title or location"
            aria-label="Search activities"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
          />

          {activities.length === 0 && !query ? (
            <p className="text-sm text-gray-500">No activities yet.</p>
          ) : filteredActivities.length === 0 ? (
            <p className="text-sm text-gray-500">No activities found</p>
          ) : (
            <div className="space-y-5">
              {groupByDate(filteredActivities).map((group, groupIdx) => (
                <section key={group.date || `unscheduled-${groupIdx}`}>
                  <h3 className="mb-2 text-sm font-semibold text-gray-600">
                    {safeFormatDate(group.date)}
                  </h3>
                  <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
                    {group.activities.map((activity, actIdx) => (
                      <li
                        key={activity.id || `act-${groupIdx}-${actIdx}`}
                        className="flex items-start justify-between gap-4 p-3"
                      >
                        <div>
                          <p className="font-medium">
                            {activity.time && (
                              <span className="mr-2 text-gray-500">{activity.time}</span>
                            )}
                            {activity.title}
                          </p>
                          {activity.location && (
                            <p className="text-sm text-gray-600">{activity.location}</p>
                          )}
                          {activity.notes && (
                            <p className="text-sm text-gray-500">{activity.notes}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-3 text-sm">
                          <button
                            onClick={() => onEdit?.(activity)}
                            className="text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete?.(activity)}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <CalendarView
            activities={sortedActivities}
            onEdit={onEdit}
            onDelete={onDelete}
            initialDate={tripStartDate}
            tripStartDate={tripStartDate}
            tripEndDate={tripEndDate}
          />
        </div>
      )}
    </div>
  );
}
