import { useLocation, useParams } from "react-router-dom";
import { useState } from "react";

function NewsDetail() {
  const { id } = useParams();
  const { state } = useLocation(); // ✅ this contains the article passed from NewsItemCard
  const [activeTab, setActiveTab] = useState("top");

  // ✅ If user navigates directly without state, show fallback
  const article = state || {
    id,
    headline: "Article not found",
    timestamp: "",
    summary: "No details available.",
    image: "",
    url: "",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 text-yellow-100">
      {/* Headline */}
      <h1 className="text-xl md:text-2xl font-bold mb-2">
        {article.headline}
      </h1>

      <p className="text-sm text-yellow-400 mb-4">
        {article.timestamp}
      </p>

      {/* Image (if available) */}
      {article.image && (
        <img
          src={article.image}
          alt="news"
          className="w-full max-h-80 object-cover rounded-md mb-4"
        />
      )}

      {/* Summary */}
      <p className="text-base leading-relaxed text-yellow-200 mb-6">
        {article.summary}
      </p>

      {/* Full article link */}
      {article.url && (
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="text-yellow-400 underline mb-6 inline-block"
        >
          Read full article
        </a>
      )}

      {/* Tabs */}
      <div className="flex gap-6 border-b border-yellow-700 mb-4">
        {["top", "latest"].map((tab) => (
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
      <div className="space-y-4">
        {activeTab === "top" && (
          <>
            {/* Future: show top related posts */}
          </>
        )}

        {activeTab === "latest" && (
          <>
            {/* Future: show latest related posts */}
          </>
        )}
      </div>
    </div>
  );
}

export default NewsDetail;
