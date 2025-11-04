import {
  FiMessageCircle,
  FiShare,
  FiBookmark,
  FiHeart,
  FiEye,
  FiRepeat,
} from "react-icons/fi";

function PostCard() {
  return (
    <div className="bg-neutral-800 p-4 rounded-md border border-yellow-700/30 hover:border-yellow-500 shadow-sm hover:shadow-md transition">
      {/* Header: User Info */}
      <div className="flex items-start gap-3 mb-2">
        <img
          src="https://images.unsplash.com/photo-1511367461989-f85a21fda167?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1031"
          alt="User"
          className="w-10 h-10 rounded-full object-cover border border-yellow-500"
        />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-yellow-100">user</span>
            <span className="text-yellow-400 text-sm">@user123 · 2h</span>
          </div>
          <p className="text-yellow-200 text-sm mt-1">
            Just launched the first version of TribeTalk — excited to keep
            building!
          </p>
        </div>
      </div>

      {/* Post image or video */}
      <div className="mt-2 rounded-md overflow-hidden border border-yellow-700/30 bg-black">
        <img
          src="https://images.unsplash.com/photo-1761333864753-81e4ae27f907?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=870"
          alt="Post preview"
          className="w-full max-h-[400px] object-contain"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-between mt-4 text-yellow-400 text-sm flex-wrap">
        <button
          title="Comment"
          className="flex items-center gap-1 hover:text-yellow-200 transition"
        >
          <FiMessageCircle />
          <span>12</span>
        </button>
        <button
          title="Repost"
          className="flex items-center gap-1 hover:text-yellow-200 transition"
        >
          <FiRepeat />
          <span>3</span>
        </button>
        <button
          title="Share"
          className="flex items-center gap-1 hover:text-yellow-200 transition"
        >
          <FiShare />
          <span>4</span>
        </button>
        <button
          title="Bookmark"
          className="flex items-center gap-1 hover:text-yellow-200 transition"
        >
          <FiBookmark />
        </button>
        <button
          title="Like"
          className="flex items-center gap-1 hover:text-yellow-200 transition"
        >
          <FiHeart />
          <span>89</span>
        </button>
        <button
          title="Views"
          className="flex items-center gap-1 hover:text-yellow-200 transition"
        >
          <FiEye />
          <span>1.2k</span>
        </button>
      </div>
    </div>
  );
}

export default PostCard;
