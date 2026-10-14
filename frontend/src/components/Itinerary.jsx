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
  if (activities.length === 0) {
    return <p className="text-sm text-gray-500">No activities yet.</p>;
  }

  return (
    <div className="space-y-5">
      {groupByDate(activities).map((group) => (
        <section key={group.date}>
          <h3 className="mb-2 text-sm font-semibold text-gray-600">
            {formatDate(group.date)}
          </h3>

          <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
            {group.activities.map((activity) => (
              <li
                key={activity.id}
                className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
                  <p className="font-medium">
                    {activity.time && (
                      <span className="mr-2 text-gray-500">
                        {activity.time}
                      </span>
                    )}
                    {activity.title}
                  </p>

                  {activity.location && (
                    <p className="text-sm text-gray-600">
                      {activity.location}
                    </p>
                  )}

                  {activity.notes && (
                    <p className="text-sm text-gray-500">
                      {activity.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 text-sm sm:shrink-0">
                  <button
                    type="button"
                    onClick={() => onEdit(activity)}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center text-blue-600 hover:underline"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(activity)}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center text-red-600 hover:underline"
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
  );
}