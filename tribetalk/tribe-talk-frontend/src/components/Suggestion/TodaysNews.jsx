import { FiMoreHorizontal } from "react-icons/fi";

function TodaysNews() {
  const newsItems = [
    {
      headline:
        "India Claims Maiden Women's Cricket World Cup with 52-Run Win Over South Africa",
      timestamp: "1 day ago",
      category: "Sports",
      posts: "480.3K posts",
    },
    {
      headline:
        "Jeremy Corbyn Hosts NYC-DSA Phone Bank for Zohran Mamdani's Mayoral Campaign",
      timestamp: "15 hours ago",
      category: "News",
      posts: "32K posts",
    },
    {
      headline:
        "Southampton Sack Manager Will Still After Five Months in Relegation Fight",
      timestamp: "14 hours ago",
      category: "Sports",
      posts: "9,963 posts",
    },
  ];

  return (
    <div className="bg-neutral-800 border border-yellow-700/40 rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-4">Today's News</h2>
      <ul className="space-y-4">
        {newsItems.map((item, i) => (
          <li key={i} className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-yellow-100 leading-snug">
                {item.headline}
              </p>
              <p className="text-xs text-yellow-400 mt-1">
                {item.timestamp} · {item.category} · {item.posts}
              </p>
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

export default TodaysNews;
