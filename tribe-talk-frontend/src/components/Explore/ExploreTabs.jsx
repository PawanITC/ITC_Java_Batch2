import { FiSearch } from "react-icons/fi";
import { useState } from "react";
import NewsItemCard from "../News/NewsItemCard";

function ExploreTabs() {
  const [activeTab, setActiveTab] = useState("forYou");
  const [searchQuery, setSearchQuery] = useState("");

  const forYouFeed = [
    {
      id: 1,
      headline: "Your personalized feed starts here",
      timestamp: "Just now",
      category: "ForYou",
      posts: "1K posts",
      image: "https://via.placeholder.com/60x60",
    },
  ];

  const trendingFeed = [
    {
      id: 2,
      headline: "Henry Cavill trends after surprise Comic-Con appearance",
      timestamp: "2 hours ago",
      category: "Trending",
      posts: "12K posts",
      image: "https://via.placeholder.com/60x60",
    },
  ];

  const newsFeed = [
    {
      id: 3,
      headline: "Jeremy Corbyn Hosts NYC-DSA Phone Bank for Zohran Mamdani",
      timestamp: "15 hours ago",
      category: "News",
      posts: "32K posts",
      image: "https://via.placeholder.com/60x60",
    },
  ];

  const sportsFeed = [
    {
      id: 4,
      headline:
        "Dodgers Clinch Repeat World Series Title in 11-Inning Game 7 Thriller",
      timestamp: "1 day ago",
      category: "Sports",
      posts: "1.4M posts",
      image: "https://via.placeholder.com/60x60",
    },
    {
      id: 5,
      headline:
        "India Clinches Maiden Women's Cricket World Cup with 52-Run Win Over South Africa",
      timestamp: "1 day ago",
      category: "Sports",
      posts: "579K posts",
      image: "https://via.placeholder.com/60x60",
    },
  ];

  const entertainmentFeed = [
    {
      id: 6,
      headline:
        "BTS Jin Concludes Solo Tour Encore with Jimin and Taehyung Surprise Reunions",
      timestamp: "1 day ago",
      category: "Entertainment",
      posts: "381K posts",
      image: "https://via.placeholder.com/60x60",
    },
    {
      id: 7,
      headline: "X Users Spark Viral Emoji Trend for Fandom Self-Ships",
      timestamp: "12 hours ago",
      category: "Entertainment",
      posts: "272K posts",
      image: "https://via.placeholder.com/60x60",
    },
  ];

  const feeds = {
    forYou: forYouFeed,
    trending: trendingFeed,
    news: newsFeed,
    sports: sportsFeed,
    entertainment: entertainmentFeed,
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 text-yellow-100">
      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-neutral-800 border border-yellow-700 rounded-full px-4 py-2 mb-6">
        <FiSearch className="text-yellow-400 text-lg" />
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent w-full text-yellow-100 placeholder-yellow-400 focus:outline-none"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-yellow-800 px-2 mb-4">
        {["forYou", "trending", "news", "sports", "entertainment"].map(
          (tab) => (
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
          )
        )}
      </div>

      {/* Tab Content */}
      <div className="space-y-4 px-2">
        {feeds[activeTab].map((item) => (
          <NewsItemCard key={item.id} {...item} />
        ))}
      </div>
    </div>
  );
}

export default ExploreTabs;
