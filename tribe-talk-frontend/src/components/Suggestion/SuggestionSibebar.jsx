import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SuggestedUsers from "./SuggestedUsers";
import TodaysNews from "./TodaysNews";
import TrendingTopics from "./TrendingTopics";
import axiosInstance from "../../services/axiosInstance";

function SuggestionSidebar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const res = await axiosInstance.get(`/api/v1/search/suggestions`, {
          params: { q: query },
        });
        setSuggestions(res.data.users);
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      }
    };

    const timeout = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      navigate(`/search?q=${query}`);
    }
  };

  return (
    <aside className="hidden md:flex md:flex-col md:w-1/3 border-l border-yellow-700/40 h-screen">
      {/* Sticky Search Bar */}
      <div className="sticky top-0 z-40 bg-neutral-900 px-6 py-4 h-20 flex items-center border-b border-yellow-700/40">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-neutral-800 text-yellow-200 px-4 py-2 rounded-full border border-yellow-700/40 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {suggestions.length > 0 && (
        <div className="px-6 mt-2 z-50">
          <div className="bg-neutral-800 mt-2 rounded-lg shadow-lg border border-yellow-700/40">
            {suggestions.map((user) => (
              <div
                key={user.id}
                onClick={() => navigate(`/profile/${user.id}`)}
                className="flex items-center gap-4 px-4 py-2 hover:bg-neutral-700 cursor-pointer"
              >
                <img
                  src={user.avatar || "/default-avatar.png"}
                  alt={user.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex flex-col">
                  <span className="text-yellow-100 font-semibold">
                    {user.displayname}
                  </span>
                  <span className="text-yellow-400 text-sm">
                    @{user.username}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Scrollable Suggestions */}
      <div className="px-6 py-6 space-y-8">
        <TodaysNews />
        <SuggestedUsers />
        <TrendingTopics />
      </div>
    </aside>
  );
}

export default SuggestionSidebar;
