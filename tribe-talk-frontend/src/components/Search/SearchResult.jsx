import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect  } from "react";
import { FiSearch } from "react-icons/fi";
import PostsTab from "./PostsTab";
import PeopleTab from "./PeopleTab";
import NewsTab from "./NewsTab";
import HashtagsTab from "./HashtagsTab";
import MentionsTab from "./MentionsTab";
import axiosInstance from "../../services/axiosInstance";

function SearchResult() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = params.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("posts");
  const [suggestions, setSuggestions] = useState([]);

  const tabs = ["posts", "people", "news", "hashtags", "mentions"];

    useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const res = await axiosInstance.get(`/api/v1/search/suggestions`, {
          params: { q: searchQuery },
        });
        setSuggestions(res.data.users);
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      }
    };

    const timeout = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

   const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/search?q=${searchQuery.trim()}`);
      setSuggestions([]);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 text-yellow-100">

      {/* Search Bar (styled like ExploreTabs) */}
      <div className="relative mb-6">
      <div className="flex items-center gap-2 bg-neutral-800 border border-yellow-700 rounded-full px-4 py-2 mb-6">
        <FiSearch className="text-yellow-400 text-lg" />
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-transparent w-full text-yellow-100 placeholder-yellow-400 focus:outline-none"
        />
      </div>

      {/* Autocomplete Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 w-full mt-2 z-50 bg-neutral-800 rounded-lg shadow-lg border border-yellow-700/40 max-h-96 overflow-y-auto">
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
        )}
      </div>
      {/* Tabs */}
      <div className="flex gap-6 border-b border-yellow-800 px-2 mb-4">
        {tabs.map((tab) => (
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

      {/* Tab Content */}
      <div className="space-y-4 px-2">
        {activeTab === "posts" && <PostsTab query={initialQuery} />}
        {activeTab === "people" && <PeopleTab query={initialQuery} />}
        {activeTab === "news" && <NewsTab query={initialQuery} />}
        {activeTab === "hashtags" && <HashtagsTab query={initialQuery} />}
        {activeTab === "mentions" && <MentionsTab query={initialQuery} />}
      </div>
    </div>
  );
}

export default SearchResult;
