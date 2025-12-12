import {
  FiMessageCircle,
  FiShare,
  FiBookmark,
  FiHeart,
  FiEye,
  FiRepeat, FiMoreHorizontal,
} from "react-icons/fi";
import { useEffect, useState, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import Poll from "./Poll.jsx";
import { GlobalContext } from "../GlobalContext.jsx";
import { AuthContext } from "../../auth/AuthContext";

import { toast } from "react-toastify";

function PostCard({ post }) {
  const { user } = useContext(AuthContext);
  const [userDetails, setUserDetails] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const [showMenu, setShowMenu] = useState(false);

  const { openReplyModal } = useContext(GlobalContext);

  const isOwner = user?.userId === post.userId; // only owner sees menu

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/v1/posts/${post.id}`);
      toast.success("Post deleted successfully");
      setShowMenu(false);
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete post");
    }
  };



  useEffect(() => {
    const fetchUser = async () => {
      try {
        const [userRes, authorRes] = await Promise.all([
          axiosInstance.get("/users/loggedUser"),
          axiosInstance.get(`/users/${post.userId}`),
        ]);
        setCurrentUser(userRes.data);
        setUserDetails(authorRes.data);
      } catch (err) {
        console.error("Failed to fetch user details", err);
      }
    };

    if (post.userId) {
      fetchUser();
    }
  }, [post.userId]);

  useEffect(() => {
    if (currentUser?.id && post.likedBy?.includes(currentUser.id)) {
      setLiked(true);
    }
  }, [currentUser, post.likedBy]);

  useEffect(() => {
    if (currentUser?.id && post.bookmarkedBy?.includes(currentUser.id)) {
      setBookmarked(true);
    }
  }, [currentUser, post.bookmarkedBy]);

  const handleLikeToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (liked) {
        await axiosInstance.delete(`/v1/posts/${post.id}/unlike`, {
          params: { userId: currentUser.id },
        });
        setLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        await axiosInstance.post(`/v1/posts/${post.id}/like`, null, {
          params: { userId: currentUser.id },
        });
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Failed to toggle like", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (bookmarked) {
        await axiosInstance.delete(`/v1/posts/${post.id}/removeBookmark`, {
          params: { userId: currentUser.id },
        });
        setBookmarked(false);
      } else {
        await axiosInstance.post(`/v1/posts/${post.id}/bookmark`, null, {
          params: { userId: currentUser.id },
        });
        setBookmarked(true);
      }
    } catch (err) {
      console.error("Failed to toggle bookmark", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReply = () => {
    if (!currentUser || !userDetails?.username) return;

    openReplyModal({
      replyToPostId: post.id,
      prefillText: `@${userDetails.username} `,
    });
  };

  return (
    // <div className="bg-neutral-800 p-4 rounded-md border border-yellow-700/30 hover:border-yellow-500 shadow-sm hover:shadow-md transition">
    <div
      className={`bg-neutral-800 p-4 rounded-md border shadow-sm hover:shadow-md transition ${post.replyToPostId
          ? "border-blue-500/50" // ✅ reply posts get blue border
          : "border-yellow-700/30 hover:border-yellow-500" // ✅ normal posts keep yellow styling
        }`}
    >
      {/* Header: User Info */}
      <div className="flex flex-col gap-1 mb-2">
        {post.replyToPostId && (
          <span className="text-xs text-blue-400 italic">
            Replying to @{post.replyToUsername}
          </span>
        )}
        {/* Header: User Info */}
        <div className="flex items-start gap-3 mb-2">
          <img
            src="https://images.unsplash.com/photo-1511367461989-f85a21fda167?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1031"
            alt="User"
            className="w-10 h-10 rounded-full object-cover border border-yellow-500"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-yellow-100">
                {userDetails?.displayname || "User"}
              </span>
              <span className="text-yellow-400 text-sm">
                {" "}
                @{userDetails?.username || "user"}
              </span>
            </div>
            <p className="text-yellow-200 text-sm mt-1">{post.text}</p>
          </div>

          {/* Three-dot menu only for owner */}
          {isOwner && (
            <div className="ml-auto relative">
              <button
                onClick={() => setShowMenu((prev) => !prev)}
                className="p-2 rounded-full hover:bg-neutral-700"
              >
                <FiMoreHorizontal />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-neutral-900 border border-yellow-700 rounded-md shadow-lg">
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2 hover:bg-neutral-800 transition"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post image or video */}
      {post.media?.url && (
        <div className="mt-2 rounded-md overflow-hidden border border-yellow-700/30 bg-black">
          {post.media.type?.startsWith("video") ? (
            <video
              src={post.media.url}
              controls
              className="w-full max-h-[400px] object-contain"
            />
          ) : (
            <img
              src={post.media.url}
              alt="Post preview"
              className="w-full max-h-[400px] object-contain"
            />
          )}
        </div>
      )}

      {/* Poll */}
      <Poll post={post} />

      {/* Actions */}
      <div className="flex justify-between mt-4 text-yellow-400 text-sm flex-wrap">
        <button
          title="Reply"
          onClick={handleOpenReply}
          className="flex items-center gap-1 hover:text-yellow-200 transition"
        >
          <FiMessageCircle />
          <span>{post.replyCount || 0}</span>
        </button>
        <button
          title="Repost"
          className="flex items-center gap-1 hover:text-yellow-200 transition"
        >
          <FiRepeat />
          <span>0</span>
        </button>
        <button
          title="Share"
          className="flex items-center gap-1 hover:text-yellow-200 transition"
        >
          <FiShare />
          <span>0</span>
        </button>
        <button
          title="Bookmark"
          onClick={handleBookmarkToggle}
          className={`flex items-center gap-1 transition ${bookmarked ? "text-yellow-900" : "hover:text-yellow-200"
            }`}
        >
          <FiBookmark />
        </button>
        <button
          title="Like"
          onClick={handleLikeToggle}
          className={`flex items-center gap-1 transition ${liked ? "text-red-500" : "hover:text-yellow-200"
            }`}
        >
          <FiHeart />
          <span>{likeCount}</span>
        </button>
        <button
          title="Views"
          className="flex items-center gap-1 hover:text-yellow-200 transition"
        >
          <FiEye />
          <span>{post.viewCount}</span>
        </button>
      </div>
    </div>
  );
}

export default PostCard;
