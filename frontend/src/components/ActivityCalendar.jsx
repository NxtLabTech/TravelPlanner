import { useMemo, useState } from "react";
import { formatDate } from "../format.js";

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(value) {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
}

function getDates(startDate, endDate) {
  const dates = [];
  const current = parseDate(startDate);
  const last = parseDate(endDate);
  while (current <= last) {
    dates.push(toIsoDate(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export default function ActivityCalendar({ activities, startDate, endDate }) {
  const dates = useMemo(() => getDates(startDate, endDate), [startDate, endDate]);
  const [selectedDate, setSelectedDate] = useState(startDate);
  const selectedActivities = activities.filter((activity) => activity.date === selectedDate);
  const activityDates = new Set(activities.map((activity) => activity.date));

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {dates.map((date) => (
          <button
            key={date}
            type="button"
            aria-label={formatDate(date)}
            aria-pressed={selectedDate === date}
            onClick={() => setSelectedDate(date)}
            className={`rounded border p-3 text-left text-sm ${
              selectedDate === date
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-200 bg-white hover:bg-gray-50"
            }`}
          >
            <span className="block">{formatDate(date)}</span>
            {activityDates.has(date) && (
              <span className="mt-1 block text-xs font-medium">
                {activities.filter((activity) => activity.date === date).length} activity
                {activities.filter((activity) => activity.date === date).length === 1 ? "" : "ies"}
              </span>
            )}
          </button>
        ))}
      </div>

      <section aria-labelledby="selected-date-heading" className="mt-5">
        <h3 id="selected-date-heading" className="mb-2 text-sm font-semibold text-gray-600">
          Activities on {formatDate(selectedDate)}
        </h3>
        {selectedActivities.length === 0 ? (
          <p className="text-sm text-gray-500">No activities on this date.</p>
        ) : (
          <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
            {selectedActivities.map((activity) => (
              <li key={activity.id} className="p-3">
                <p className="font-medium">
                  {activity.time && <span className="mr-2 text-gray-500">{activity.time}</span>}
                  {activity.title}
                </p>
                {activity.end_time && (
                  <p className="text-sm text-gray-500">
                    Ends at {activity.end_time} ({activity.duration} min)
                  </p>
                )}
                {activity.location && <p className="text-sm text-gray-600">{activity.location}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
