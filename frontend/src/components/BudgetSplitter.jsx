import { useState } from "react";
import { formatBudget } from "../format.js";

export default function BudgetSplitter({ budget }) {
  const [isOpen, setIsOpen] = useState(false);
  const [friends, setFriends] = useState(["", ""]);

  const namedFriends = friends
    .map((name) => name.trim())
    .filter(Boolean);
  const totalPaise = Math.round(Number(budget) * 100);
  const baseShare = namedFriends.length ? Math.floor(totalPaise / namedFriends.length) : 0;
  const extraPaise = namedFriends.length ? totalPaise % namedFriends.length : 0;

  function updateFriend(index, value) {
    setFriends((current) => current.map((name, i) => (i === index ? value : name)));
  }

  function removeFriend(index) {
    setFriends((current) => current.filter((_, i) => i !== index));
  }

  return (
    <section className="mt-4 rounded border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Budget splitter</h2>
          <p className="text-sm text-gray-600">Work out each friend’s equal share of the trip budget.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          {isOpen ? "Close splitter" : "Split budget"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <p className="mb-3 text-sm text-gray-600">
            Trip budget: <strong>{formatBudget(budget)}</strong>
          </p>
          <div className="space-y-2">
            {friends.map((friend, index) => (
              <div key={index} className="flex gap-2">
                <label className="sr-only" htmlFor={`budget-friend-${index}`}>
                  Friend {index + 1}
                </label>
                <input
                  id={`budget-friend-${index}`}
                  value={friend}
                  onChange={(event) => updateFriend(index, event.target.value)}
                  placeholder={`Friend ${index + 1}`}
                  className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeFriend(index)}
                  aria-label={`Remove friend ${index + 1}`}
                  className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setFriends((current) => [...current, ""])}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            + Add friend
          </button>

          {namedFriends.length > 0 ? (
            <div className="mt-4 rounded bg-gray-50 p-3">
              <h3 className="text-sm font-medium">Each person pays</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {namedFriends.map((friend, index) => {
                  const sharePaise = baseShare + (index < extraPaise ? 1 : 0);
                  return (
                    <li key={`${friend}-${index}`} className="flex justify-between gap-4">
                      <span>{friend}</span>
                      <strong>{formatBudget(sharePaise / 100)}</strong>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">Enter friend names to calculate their shares.</p>
          )}
        </div>
      )}
    </section>
  );
}
