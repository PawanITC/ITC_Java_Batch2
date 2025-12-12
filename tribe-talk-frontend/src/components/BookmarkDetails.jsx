import { FiSearch } from "react-icons/fi";
import { useState, useEffect, useContext } from "react";
import axiosInstance from "../services/axiosInstance";
import PostCard from "./Post/PostCard";
import { AuthContext } from "../auth/AuthContext";

function BookmarkDetails() {
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarks, setBookmarks] = useState([]);
  const { user } = useContext(AuthContext);

  const userId = user?.userId;

  useEffect(() => {
    if (!userId) return;

    const fetchBookmarks = async () => {
      try {
        const res = await axiosInstance.get(
          `/v1/posts/bookmarked?userId=${userId}`
        );
        setBookmarks(res.data);
      } catch (err) {
        console.error("Failed to fetch bookmarks", err);
      }
    };

    fetchBookmarks();
  }, [userId]);

  const filteredBookmarks = bookmarks.filter((post) =>
    post.text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isEmpty = filteredBookmarks.length === 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 text-yellow-100">
      {/* Page Title */}
      <h1 className="text-xl font-bold mb-6">Bookmarks</h1>

      {/* Search Bar */}
      {/* <div className="flex items-center gap-2 bg-neutral-800 border border-yellow-700 rounded-full px-4 py-2 mb-6">
        <FiSearch className="text-yellow-400 text-lg" />
        <input
          type="text"
          placeholder="Search Bookmarks"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent w-full text-yellow-100 placeholder-yellow-400 focus:outline-none"
        />
      </div> */}

      {/* Content */}
      <div className="min-h-[200px] flex flex-col items-center justify-center text-center">
        {isEmpty ? (
          <>
            <h2 className="text-lg font-semibold text-yellow-100 mb-2">
              Save posts for later
            </h2>
            <p className="text-sm text-yellow-400 max-w-sm">
              Bookmark posts to easily find them again in the future.
            </p>
          </>
        ) : (
          bookmarks.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}

export default BookmarkDetails;
