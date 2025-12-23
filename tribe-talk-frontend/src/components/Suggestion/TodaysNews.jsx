import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";

function formatTimestamp(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function TodaysNews() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNews = async () => {
      try {
        const { data } = await axiosInstance.get("/api/v1/news", {
          params: {
            country: "gb",
            category: "top",
            size: 10,
          },
        });
        const articles = Array.isArray(data) ? data : data.results || [];

        const mapped = articles.map((a, index) => ({
          id: a.article_id || `today-${index}`,
          headline: a.title,
          timestamp: formatTimestamp(a.pubDate),
          category: a.category || "News",
          image: a.image_url,
          summary: a.description,
          url: a.link,
        }));
        setItems(mapped.slice(0, 3));
      } catch (err) {
        console.error("Failed to load today's news", err);
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-800 border border-yellow-700/40 rounded-xl p-4">
        <h2 className="text-lg font-semibold text-yellow-700 dark:text-yellow-200 mb-4">Today's News</h2>
        <p className="text-yellow-400 dark:text-gray-600 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 border border-yellow-700/40 rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-4 text-yellow-700 dark:text-yellow-200">Today's News</h2>

      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between items-start">
            <Link
              to={`/news/${item.id}`}
              state={item}
              className="flex-1 hover:underline"
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-yellow-100 leading-snug">
                {item.headline}
              </p>
              <p className="text-xs text-yellow-700 dark:text-gray-600 mt-1">
                {item.timestamp} · {item.category}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <Link to="/explore" className="mt-4 text-sm text-sky-400 hover:underline">
        Show more
      </Link>
    </div>
  );
}

export default TodaysNews;
