import { useEffect, useMemo, useState } from "react";
import { formatDate } from "../format.js";

const WEEKDAYS = [
  { short: "Sun", full: "Sunday" },
  { short: "Mon", full: "Monday" },
  { short: "Tue", full: "Tuesday" },
  { short: "Wed", full: "Wednesday" },
  { short: "Thu", full: "Thursday" },
  { short: "Fri", full: "Friday" },
  { short: "Sat", full: "Saturday" },
];

function formatDateKey(year, month, day) {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function getInitialMonth(initialDate, activities) {
  if (initialDate) {
    if (typeof initialDate === "string") {
      const [y, m] = initialDate.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  }
  if (activities && activities.length > 0 && activities[0].date) {
    const [y, m] = activities[0].date.split("-").map(Number);
    return new Date(y, m - 1, 1);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export default function CalendarView({
  activities = [],
  onEdit,
  onDelete,
  initialDate,
  initialSelectedDate,
}) {
  const [currentMonthDate, setCurrentMonthDate] = useState(() =>
    getInitialMonth(initialDate, activities)
  );
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate || null);

  useEffect(() => {
    if (initialDate) {
      setCurrentMonthDate(getInitialMonth(initialDate, activities));
    }
  }, [initialDate]);

  const year = currentMonthDate.getFullYear();
  const monthIndex = currentMonthDate.getMonth(); // 0-indexed
  const monthName = currentMonthDate.toLocaleDateString("en-US", { month: "long" });

  // Map activities by date string "YYYY-MM-DD"
  const activitiesByDate = useMemo(() => {
    const map = {};
    for (const act of activities) {
      if (!act.date) continue;
      if (!map[act.date]) {
        map[act.date] = [];
      }
      map[act.date].push(act);
    }
    return map;
  }, [activities]);

  // Calendar calculations
  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const prevPadding = Array.from({ length: firstDayOfWeek });
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totalSlots = firstDayOfWeek + daysInMonth;
  const nextPaddingCount = (7 - (totalSlots % 7)) % 7;
  const nextPadding = Array.from({ length: nextPaddingCount });

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  // Today string for highlighting
  const today = new Date();
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const selectedDateActivities = selectedDate ? activitiesByDate[selectedDate] || [] : [];

  return (
    <div className="w-full max-w-full space-y-4">
      {/* Navigation and Month Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {monthName} {year}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Previous Month"
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleToday}
            aria-label="Today"
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Next Month"
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Next
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="w-full max-w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-center text-xs font-semibold text-gray-700">
          {WEEKDAYS.map((d) => (
            <div key={d.full} className="py-2.5" aria-label={d.full}>
              <span className="hidden sm:inline">{d.full}</span>
              <span className="sm:hidden">{d.short}</span>
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {/* Leading padding from previous month */}
          {prevPadding.map((_, i) => (
            <div
              key={`prev-${i}`}
              data-testid="padding-prev"
              className="min-h-[75px] sm:min-h-[90px] border-b border-r border-gray-100 bg-gray-50/50"
              aria-hidden="true"
            />
          ))}

          {/* Actual days of the month */}
          {monthDays.map((day) => {
            const dateKey = formatDateKey(year, monthIndex + 1, day);
            const dayActivities = activitiesByDate[dateKey] || [];
            const hasActivities = dayActivities.length > 0;
            const isSelected = selectedDate === dateKey;
            const isToday = todayKey === dateKey;

            return (
              <button
                type="button"
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                data-date={dateKey}
                data-testid={`calendar-day-${dateKey}`}
                aria-label={`${day} ${monthName} ${year}${
                  hasActivities ? `, ${dayActivities.length} activities` : ""
                }`}
                className={`relative flex min-h-[75px] sm:min-h-[90px] min-w-0 flex-col border-b border-r border-gray-200 p-1 sm:p-2 text-left transition-colors focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isSelected
                    ? "bg-blue-50 ring-2 ring-inset ring-blue-600"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                {/* Date number and activity indicator */}
                <div className="flex w-full items-center justify-between">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs sm:text-sm font-medium ${
                      isSelected
                        ? "bg-blue-600 font-bold text-white"
                        : isToday
                        ? "border border-blue-600 font-bold text-blue-600"
                        : "text-gray-900"
                    }`}
                  >
                    {day}
                  </span>
                  {hasActivities && (
                    <span
                      data-testid={`activity-dot-${dateKey}`}
                      className="h-1.5 w-1.5 rounded-full bg-blue-600"
                      title={`${dayActivities.length} activities`}
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Activity items list */}
                <div className="mt-1 w-full space-y-1 overflow-hidden">
                  {dayActivities.slice(0, 2).map((act) => (
                    <div
                      key={act.id}
                      className="truncate rounded bg-blue-100/80 px-1 py-0.5 text-[11px] leading-tight text-blue-900"
                      title={`${act.time ? act.time + " " : ""}${act.title}`}
                    >
                      {act.time && <span className="mr-1 font-semibold">{act.time}</span>}
                      <span>{act.title}</span>
                    </div>
                  ))}
                  {dayActivities.length > 2 && (
                    <div className="pl-0.5 text-[10px] font-semibold text-blue-700">
                      +{dayActivities.length - 2} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {/* Trailing padding for next month */}
          {nextPadding.map((_, i) => (
            <div
              key={`next-${i}`}
              data-testid="padding-next"
              className="min-h-[75px] sm:min-h-[90px] border-b border-r border-gray-100 bg-gray-50/50"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      {/* Selected Date Activity Details */}
      <div
        className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        data-testid="selected-date-section"
      >
        <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
          <h4 className="text-base font-semibold text-gray-900">
            {selectedDate ? `Activities for ${formatDate(selectedDate)}` : "Selected Date"}
          </h4>
          {selectedDate && (
            <span className="text-xs text-gray-500">
              {selectedDateActivities.length}{" "}
              {selectedDateActivities.length === 1 ? "activity" : "activities"}
            </span>
          )}
        </div>

        {!selectedDate ? (
          <p className="text-sm text-gray-500">
            Select a date from the calendar to view its scheduled activities.
          </p>
        ) : selectedDateActivities.length === 0 ? (
          <p className="text-sm text-gray-500">
            No activities scheduled for this date.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {selectedDateActivities.map((act) => (
              <li
                key={act.id}
                className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {act.time && (
                      <span className="mr-2 font-normal text-gray-500">{act.time}</span>
                    )}
                    {act.title}
                  </p>
                  {act.location && (
                    <p className="mt-0.5 text-sm text-gray-600">
                      📍 {act.location}
                    </p>
                  )}
                  {act.notes && (
                    <p className="mt-0.5 text-sm text-gray-500">
                      {act.notes}
                    </p>
                  )}
                </div>
                {(onEdit || onDelete) && (
                  <div className="flex shrink-0 gap-3 text-sm">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(act)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(act)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
