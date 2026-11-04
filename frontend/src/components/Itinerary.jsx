import { formatDate } from "../format.js";

function getDatesInRange(startDate, endDate) {
  if (!startDate || !endDate) return null;
  try {
    const dates = [];
    let current = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");
    if (isNaN(current.getTime()) || isNaN(end.getTime()) || current > end) {
      return null;
    }
    let count = 0;
    while (current <= end && count < 60) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, "0");
      const d = String(current.getDate()).padStart(2, "0");
      dates.push(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 1);
      count++;
    }
    return dates;
  } catch {
    return null;
  }
}

// Groups activities by date. If startDate and endDate are provided, it covers all dates in the trip duration.
function buildDateGroups(activities, startDate, endDate) {
  const rangeDates = getDatesInRange(startDate, endDate);
  if (rangeDates && rangeDates.length > 0) {
    const activitiesByDate = {};
    for (const act of activities) {
      if (!activitiesByDate[act.date]) {
        activitiesByDate[act.date] = [];
      }
      activitiesByDate[act.date].push(act);
    }
    return rangeDates.map((date) => ({
      date,
      activities: activitiesByDate[date] || [],
    }));
  }

  // Fallback: Group only existing activities by date
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
  startDate,
  endDate,
  onEdit,
  onDelete,
  onAddForDate,
}) {
  if (activities.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center max-w-lg mx-auto my-6 shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-800">No activities yet.</p>
        <p className="text-xs text-slate-500 mt-1">
          Click &quot;Add activity&quot; above to begin scheduling your daily tours, sights, and reservations.
        </p>
      </div>
    );
  }

  const dateGroups = buildDateGroups(activities, startDate, endDate);

  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 sm:before:left-5 before:w-0.5 before:bg-slate-200">
      {dateGroups.map((group) => {
        const hasActivities = group.activities.length > 0;
        return (
          <section key={group.date} className="relative pl-10 sm:pl-12">
            {/* Timeline Node Dot */}
            <div
              className={`absolute left-2.5 sm:left-3.5 -translate-x-1/2 top-1.5 w-4 h-4 rounded-full ring-4 ring-white shadow-xs ${
                hasActivities ? "bg-sky-600" : "bg-slate-300"
              }`}
              aria-hidden="true"
            />

            {/* Group Date Header (Level 3 Heading required for test) */}
            <div className="mb-3">
              <h3
                className={`inline-block px-3 py-1 rounded-lg text-xs font-bold tracking-wide shadow-xs ${
                  hasActivities ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {formatDate(group.date)}
              </h3>
            </div>

            {/* Activity Cards List */}
            {hasActivities ? (
              <ul className="space-y-3">
                {group.activities.map((activity) => (
                  <li
                    key={activity.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {activity.time && (
                          <span className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-100">
                            <svg className="w-3 h-3 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>{activity.time}</span>
                          </span>
                        )}
                        <span className="font-semibold text-slate-900 text-sm">{activity.title}</span>
                      </div>

                      {activity.location && (
                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{activity.location}</span>
                        </p>
                      )}

                      {activity.notes && (
                        <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                          {activity.notes}
                        </p>
                      )}
                    </div>

                    {/* Activity Management Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-start pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto justify-end text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => onEdit(activity)}
                        className="touch-target px-3 py-1.5 rounded-lg text-sky-600 hover:text-sky-800 hover:bg-sky-50 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[36px]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(activity)}
                        className="touch-target px-3 py-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 min-h-[36px]"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              /* Empty state for date without scheduled activities */
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center">
                <p className="text-xs font-medium text-slate-500 mb-2">
                  Free day — No scheduled activities for this date
                </p>
                {onAddForDate && (
                  <button
                    type="button"
                    onClick={() => onAddForDate(group.date)}
                    className="touch-target inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sky-700 text-xs font-semibold shadow-xs transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add activity for this date</span>
                  </button>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
