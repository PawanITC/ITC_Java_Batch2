import { useEffect, useState } from "react";
import NewsItemCard from "../News/NewsItemCard";
import axiosInstance from "../../services/axiosInstance";

function NewsTab({ query }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNews = async () => {
      try {
        const data = await axiosInstance.get("/api/v1/news", {
          params: {
            q: query,
            size: 10,
          },
        });

        const articles = Array.isArray(data) ? data : data.results || [];

        setArticles(
          articles.map((a, index) => ({
            id: a.article_id || `news-${index}`,
            headline: a.title,
            timestamp: formatTimestamp(a.pubDate),
            category: Array.isArray(a.category) ? a.category[0] : a.category || "News",
            posts: "",
            image: a.image_url || "https://via.placeholder.com/60x60",
            summary: a.description,
            url: a.link,
          }))
        );
      } catch (err) {
        console.error("Failed to load news:", err);
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, [query]);

  function formatTimestamp(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  if (loading) return <p className="text-yellow-400">Loading news...</p>;
  if (articles.length === 0) return <p className="text-yellow-400">No news found.</p>;

  return (
    <div className="space-y-4 px-2">
      {articles.map((item) => (
        <NewsItemCard key={item.id} {...item} />
      ))}
    </div>
  );
}
export default NewsTab;
