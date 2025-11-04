import { useState } from "react";

function NotificationDetails() {
  const [activeTab, setActiveTab] = useState("all");

  // Simulated notification data (can be replaced with API)
  const notifications = {
    all: [],
    verified: [],
    mentions: [],
  };

  const isEmpty = notifications[activeTab].length === 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 text-yellow-100">
      {/* Page Title */}
      <h1 className="text-xl font-bold mb-6">Notifications</h1>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-yellow-700 mb-6">
        {["all", "verified", "mentions"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 font-semibold capitalize ${
              activeTab === tab
                ? "border-b-2 border-yellow-400 text-yellow-100"
                : "text-yellow-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[200px] flex flex-col items-center justify-center text-center">
        {isEmpty ? (
          <>
            <h2 className="text-lg font-semibold text-yellow-100 mb-2">
              Nothing to see here — yet
            </h2>
            <p className="text-sm text-yellow-400 max-w-sm">
              From likes to reposts and a whole lot more, this is where all the
              action happens.
            </p>
          </>
        ) : (
          <ul className="space-y-4 w-full">
            {notifications[activeTab].map((note, i) => (
              <li
                key={i}
                className="bg-neutral-800 p-4 rounded-md border border-yellow-700/40"
              >
                {/* Render notification content here */}
                <p>{note.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default NotificationDetails;
