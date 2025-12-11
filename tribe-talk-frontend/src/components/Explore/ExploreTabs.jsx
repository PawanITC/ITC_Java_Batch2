import { FiSearch } from "react-icons/fi";
import NewsItemCard from "../News/NewsItemCard";
import { useEffect, useState, useMemo } from "react";
import { fetchNews } from "../../api/newsApi";

function ExploreTabs() {
  const [forYou, setForYou] = useState([]);
  const [trending, setTrending] = useState([]);
  const [news, setNews] = useState([]);
  const [sports, setSports] = useState([]);
  const [entertainment, setEntertainment] = useState([]);

  const [activeTab, setActiveTab] = useState("forYou");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadCategory = async () => {
      try {
        if (activeTab === "forYou" && forYou.length === 0) {
          const data = await fetchNews({ category: "top" });
          setForYou(mapArticles(data));
        }

        if (activeTab === "trending" && trending.length === 0) {
          const data = await fetchNews({ q: "breaking", sort: "relevancy" });
          setTrending(mapArticles(data));
        }

        if (activeTab === "news" && news.length === 0) {
          const data = await fetchNews({ category: "top" });
          setNews(mapArticles(data));
        }

        if (activeTab === "sports" && sports.length === 0) {
          const data = await fetchNews({ category: "sports" });
          setSports(mapArticles(data));
        }

        if (activeTab === "entertainment" && entertainment.length === 0) {
          const data = await fetchNews({ category: "entertainment" });
          setEntertainment(mapArticles(data));
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadCategory();
  }, [activeTab]);

  function formatTimestamp(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  // Less than 1 hour → minutes
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  // Less than 24 hours → hours
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  //  More than 24 hours → Month + Day
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}


  function mapArticles(articles) {
    return articles.map((a, index) => ({
      id: a.article_id || `news-${index}`,
      headline: a.title,
      timestamp: formatTimestamp(a.pubDate),
      category: a.category || "News",
      posts: "",
      image: a.image_url || "https://via.placeholder.com/60x60",
      summary: a.description,
      url: a.link,
    }));
  }

  const feeds = {
    forYou,
    trending,
    news,
    sports,
    entertainment,
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
        {feeds[activeTab].length === 0 && (
          <p className="text-yellow-400">Loading...</p>
        )}
        {feeds[activeTab].map((item) => (
          <NewsItemCard key={item.id} {...item} />
        ))}
      </div>
    </div>
  );
}

export default ExploreTabs;
