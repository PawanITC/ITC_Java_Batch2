import SuggestedUsers from "./SuggestedUsers";
import TodaysNews from "./TodaysNews";
import TrendingTopics from "./TrendingTopics";

function SuggestionSidebar() {
  return (
    <aside className="hidden md:flex md:flex-col md:w-1/3 border-l border-yellow-700/40 h-screen">
      {/* Sticky Search Bar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-neutral-900 px-6 py-4 h-20 flex items-center border-b border-yellow-700/40">
        <input
          type="text"
          placeholder="Search"
          className="w-full bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-yellow-200 px-4 py-2 rounded-full border border-yellow-700/40 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>

      {/* Scrollable Suggestions */}
      <div className="px-6 py-6 space-y-8">
        <TodaysNews />
            <SuggestedUsers/>
        <TrendingTopics />
      </div>
    </aside>
  );
}

export default SuggestionSidebar;
