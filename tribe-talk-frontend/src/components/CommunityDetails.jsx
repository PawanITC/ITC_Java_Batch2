import { FiSearch } from "react-icons/fi";
import { FaUsers } from "react-icons/fa";
import { useState } from "react";
import PostCard from "./Post/PostCard";

function CommunityDetails() {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    "Sports",
    "Technology",
    "Art",
    "Entertainment",
    "Gaming",
    "Politics",
    "Science",
    "Health",
    "Finance",
    "Travel",
    "Food",
    "Education",
  ];

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 text-gray-900 dark:text-yellow-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Communities</h1>
        </div>
        <FaUsers className="text-yellow-400 dark:text-gray-600 text-xl cursor-pointer" />
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-800 border border-yellow-700 rounded-full px-4 py-2 mb-6">
        <FiSearch className="text-yellow-400 dark:text-gray-600 text-lg" />
        <input
          type="text"
          placeholder="Search Communities"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent w-full text-gray-900 dark:text-yellow-100 placeholder-yellow-400 focus:outline-none"
        />
      </div>

      {/* Category Buttons */}
      <div className="flex flex-wrap gap-3">
        {filteredCategories.map((category, i) => (
          <button
            key={i}
            className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 border border-yellow-700/40 rounded-full text-sm text-gray-900 dark:text-yellow-100 hover:bg-yellow-700/20 transition"
          >
            {category}
          </button>
        ))}
      </div>

      {/* posts feed */}
      <div className="px-4 py-6 space-y-4">
        {/*{[...Array(5)].map((_, i) => (*/}
        {/*  <PostCard key={i} />*/}
        {/*))}*/}
      </div>
    </div>
  );
}

export default CommunityDetails;
