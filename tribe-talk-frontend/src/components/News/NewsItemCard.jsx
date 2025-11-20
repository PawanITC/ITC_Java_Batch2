import { Link } from "react-router-dom";

function NewsItemCard({ id, image, headline, timestamp, category, posts }) {
  return (
    <Link
      to={`/news/${id}`}
      className="flex items-start gap-4 hover:bg-neutral-700/40 p-2 rounded-md transition"
    >
      <img
        src={image}
        alt={`${category} thumbnail`}
        className="w-14 h-14 rounded-md object-cover"
      />
      <div className="flex-1">
        <p className="text-sm font-semibold text-yellow-100 leading-snug">
          {headline}
        </p>
        <p className="text-xs text-yellow-400 mt-1">
          {timestamp} · {category} · {posts}
        </p>
      </div>
    </Link>
  );
}

export default NewsItemCard;
