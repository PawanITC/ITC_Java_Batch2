import { useParams } from "react-router-dom";
import { useState } from "react";
import PostCard from "../Post/PostCard";

function NewsDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("top");

  // Simulated article data (replace with API fetch later)
  const article = {
    id,
    headline: "JD Vance Embraces 'Fat JD' Meme in Halloween Costume",
    timestamp: "Last updated Nov 1",
    summary:
      "Vice President JD Vance dressed as the viral 'fat JD' caricature from social media memes that originated during a February 2025 White House meeting with Ukrainian President Volodymyr Zelenskyy. He posted the costume on X with a laughing emoji, receiving over 232,000 likes and praise for his self-deprecating humor and support across political lines. Vance followed up with a TikTok video wishing families a Happy Halloween and reminding children to stay safe.",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 text-yellow-100">
      {/* Headline */}
      <h1 className="text-xl md:text-2xl font-bold mb-2">{article.headline}</h1>
      <p className="text-sm text-yellow-400 mb-4">{article.timestamp}</p>

      {/* Summary */}
      <p className="text-base leading-relaxed text-yellow-200 mb-6">
        {article.summary}
      </p>

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
            <PostCard />
            <PostCard />
          </>
        )}
        {activeTab === "latest" && (
          <>
            <PostCard />
          </>
        )}
      </div>
    </div>
  );
}

export default NewsDetail;
