import { useState } from "react";
import { formatDate } from "../format.js";
import CalendarView from "./CalendarView.jsx";

// Activities arrive sorted by date and time, so grouping is a single pass.
function groupByDate(activities) {
  const groups = [];
  for (const activity of activities) {
    const last = groups[groups.length - 1];
    if (last && last.date === activity.date) {
      last.activities.push(activity);
    } else {
      groups.push({ date: activity.date, activities: [activity] });
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

  const query = search.trim().toLowerCase();
  const filteredActivities = query
    ? activities.filter((activity) => {
        const title = (activity.title || "").toLowerCase();
        const location = (activity.location || "").toLowerCase();
        return title.includes(query) || location.includes(query);
      })
    : activities;

  return (
    <div className="space-y-4">
      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div
          className="inline-flex rounded-lg bg-gray-100 p-1"
          role="tablist"
          aria-label="Itinerary view options"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === "list"}
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
            role="tab"
            aria-selected={view === "calendar"}
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
              {groupByDate(filteredActivities).map((group) => (
                <section key={group.date}>
                  <h3 className="mb-2 text-sm font-semibold text-gray-600">
                    {formatDate(group.date)}
                  </h3>
                  <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
                    {group.activities.map((activity) => (
                      <li
                        key={activity.id}
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
        <CalendarView
          activities={activities}
          onEdit={onEdit}
          onDelete={onDelete}
          initialDate={tripStartDate}
        />
      )}
    </div>
  );
}
