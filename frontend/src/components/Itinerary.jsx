import { formatDayHeading, listDates, todayIsoDate } from "../format.js";

// Splits the trip into days. Days that have activities (and today) get a
// section of their own; runs of consecutive empty days are merged into one
// "Nothing planned" section so long trips stay short.
function buildSections(startDate, endDate, activities, today) {
  const activitiesByDate = {};
  for (const activity of activities) {
    (activitiesByDate[activity.date] ||= []).push(activity);
  }

  const sections = [];
  listDates(startDate, endDate).forEach((date, index) => {
    const day = { date, number: index + 1, activities: activitiesByDate[date] || [] };
    const last = sections[sections.length - 1];
    const canMerge = day.activities.length === 0 && date !== today;
    if (canMerge && last?.empty && !last.isToday) {
      last.lastDay = day;
    } else {
      sections.push({ firstDay: day, lastDay: day, empty: day.activities.length === 0, isToday: date === today });
    }
  });
  return sections;
}

function SectionHeading({ section }) {
  const { firstDay, lastDay } = section;
  const label =
    firstDay === lastDay
      ? `Day ${firstDay.number} · ${formatDayHeading(firstDay.date)}`
      : `Days ${firstDay.number}–${lastDay.number} · ${formatDayHeading(firstDay.date)} – ${formatDayHeading(lastDay.date)}`;

  return (
    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-600">
      {label}
      {section.isToday && (
        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Today</span>
      )}
    </h3>
  );
}

// startDate / endDate are the trip's dates. Activities arrive sorted by date and time.
export default function Itinerary({ startDate, endDate, activities, today = todayIsoDate(), onEdit, onDelete }) {
  return (
    <div className="space-y-5">
      {buildSections(startDate, endDate, activities, today).map((section) => (
        <section key={section.firstDay.date}>
          <SectionHeading section={section} />
          {section.empty ? (
            <p
              className={`rounded border border-dashed px-3 py-2 text-sm text-gray-500 ${
                section.isToday ? "border-green-300" : "border-gray-300"
              }`}
            >
              Nothing planned
            </p>
          ) : (
            <ul
              className={`divide-y divide-gray-200 rounded border bg-white ${
                section.isToday ? "border-green-300" : "border-gray-200"
              }`}
            >
              {section.firstDay.activities.map((activity) => (
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
          )}
        </section>
      ))}
    </div>
  );
}
