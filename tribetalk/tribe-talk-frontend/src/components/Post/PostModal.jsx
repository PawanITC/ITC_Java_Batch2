import {
  FiImage,
  FiSmile,
  FiFilm,
  FiBarChart2,
  FiCalendar,
  FiMapPin,
  FiX,
} from "react-icons/fi";

function PostModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-neutral-900 text-yellow-100 w-full max-w-xl rounded-lg p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-yellow-400 hover:text-yellow-200"
        >
          <FiX size={20} />
        </button>

        {/* Header */}
        <h2 className="text-xl font-semibold mb-4">Create Post</h2>

        {/* Text Area */}
        <textarea
          rows={4}
          placeholder="What's happening?"
          className="w-full bg-neutral-800 text-yellow-200 p-3 rounded-md border border-yellow-700/40 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />

        {/* Action Icons */}
        <div className="flex items-center gap-4 mt-4 text-yellow-400 flex-wrap">
          <button
            title="Attach Photo or Video"
            className="hover:text-yellow-200 transition"
          >
            <FiImage size={20} />
          </button>
          <button title="Add GIF" className="hover:text-yellow-200 transition">
            <FiFilm size={20} />
          </button>
          <button
            title="Add Emoji"
            className="hover:text-yellow-200 transition"
          >
            <FiSmile size={20} />
          </button>
          <button
            title="Create Poll"
            className="hover:text-yellow-200 transition"
          >
            <FiBarChart2 size={20} />
          </button>
          <button
            title="Schedule Post"
            className="hover:text-yellow-200 transition"
          >
            <FiCalendar size={20} />
          </button>
          <button
            title="Add Location"
            className="hover:text-yellow-200 transition"
          >
            <FiMapPin size={20} />
          </button>
        </div>

        {/* Post Button */}
        <div className="mt-6 text-right">
          <button className="bg-yellow-500 text-neutral-900 font-semibold px-4 py-2 rounded-full hover:bg-yellow-400 transition">
            Post
          </button>
        </div>
      </div>
    </div>
  );
}

export default PostModal;
