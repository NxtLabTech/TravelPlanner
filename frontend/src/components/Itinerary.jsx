import { useState } from "react";
import { formatDate } from "../format.js";

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

export default function Itinerary({ activities, onEdit, onDelete }) {
  const [search, setSearch] = useState("");

  if (activities.length === 0) {
    return <p className="text-sm text-gray-500">No activities yet.</p>;
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredActivities = activities.filter((activity) => {
    if (!normalizedSearch) return true;

    return [activity.title, activity.location].some((value) =>
      value?.toLowerCase().includes(normalizedSearch),
    );
  });

  return (
    <div>
      <label htmlFor="activity-search" className="sr-only">
        Search activities
      </label>
      <input
        id="activity-search"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search activities by title or location"
        className="mb-5 w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />

      {filteredActivities.length === 0 ? (
        <p className="text-sm text-gray-500">No activities found</p>
      ) : (
        <div className="space-y-5">
          {groupByDate(filteredActivities).map((group) => (
            <section key={group.date}>
              <h3 className="mb-2 text-sm font-semibold text-gray-600">{formatDate(group.date)}</h3>
              <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
                {group.activities.map((activity) => (
                  <li key={activity.id} className="flex items-start justify-between gap-4 p-3">
                    <div>
                      <p className="font-medium">
                        {activity.time && <span className="mr-2 text-gray-500">{activity.time}</span>}
                        {activity.title}
                      </p>
                      {activity.location && <p className="text-sm text-gray-600">{activity.location}</p>}
                      {activity.notes && <p className="text-sm text-gray-500">{activity.notes}</p>}
                    </div>
                    <div className="flex shrink-0 gap-3 text-sm">
                      <button onClick={() => onEdit(activity)} className="text-blue-600 hover:underline">
                        Edit
                      </button>
                      <button onClick={() => onDelete(activity)} className="text-red-600 hover:underline">
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
  );
}
