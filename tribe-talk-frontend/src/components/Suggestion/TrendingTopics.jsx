import { FiMoreHorizontal } from "react-icons/fi";

function TrendingTopics() {
  const trends = [
    {
      category: "Trending in United Kingdom",
      topic: "Henry Cavill",
      posts: "4,168 posts",
    },
    {
      category: "Trending in United Kingdom",
      topic: "Southwark",
      posts: "6,829 posts",
    },
    { category: "Politics · Trending", topic: "Virginia", posts: "129K posts" },
    {
      category: "Trending in United Kingdom",
      topic: "Happy Halloween",
      posts: "241K posts",
    },
  ];

  return (
    <div className="bg-neutral-800 border border-yellow-700/40 rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-4">What's Happening</h2>
      <ul className="space-y-4">
        {trends.map((trend, i) => (
          <li key={i} className="flex justify-between items-start">
            <div>
              <p className="text-xs text-yellow-400">{trend.category}</p>
              <p className="font-semibold text-yellow-100">{trend.topic}</p>
              <p className="text-xs text-yellow-400">{trend.posts}</p>
            </div>
            <FiMoreHorizontal className="text-yellow-400 hover:text-yellow-200 cursor-pointer mt-1" />
          </li>
        ))}
      </ul>
      <button className="mt-4 text-sm text-sky-400 hover:underline">
        Show more
      </button>
    </div>
  );
}

export default TrendingTopics;
