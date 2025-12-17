import {
  FiMessageCircle,
  FiShare,
  FiBookmark,
  FiHeart,
  FiEye,
  FiRepeat,
  FiMoreHorizontal,
} from "react-icons/fi";
import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import Poll from "./Poll.jsx";
import MediaCollage from "./MediaCollage.jsx";
import { GlobalContext } from "../GlobalContext.jsx";
import { AuthContext } from "../../auth/AuthContext";

import { toast } from "react-toastify";

function PostCard({ post }) {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [userDetails, setUserDetails] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const [showMenu, setShowMenu] = useState(false);

  const { openReplyModal } = useContext(GlobalContext);
  const [now, setNow] = useState(new Date());

  const isOwner = user?.userId === post.userId; // only owner sees the delete menu

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/api/v1/posts/${post.id}`);
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
          axiosInstance.get("/api/users/loggedUser"),
          axiosInstance.get(`/api/users/${post.userId}`),
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

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000); // update every 1 minute

    return () => clearInterval(interval);
  }, []);

  const handleLikeToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (liked) {
        await axiosInstance.delete(`/api/v1/posts/${post.id}/unlike`, {
          params: { userId: currentUser.id },
        });
        setLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        await axiosInstance.post(`/api/v1/posts/${post.id}/like`, null, {
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
        await axiosInstance.delete(`/api/v1/posts/${post.id}/removeBookmark`, {
          params: { userId: currentUser.id },
        });
        setBookmarked(false);
      } else {
        await axiosInstance.post(`/api/v1/posts/${post.id}/bookmark`, null, {
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

  const handleOpenPost = () => {
    navigate(`/post/${post.id}`);
  };

  const formatPostTime = (timestamp) => {
    if (!timestamp) return "";

    const created = new Date(timestamp);
    const diffMs = now - created;

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;

    return created.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatFullDate = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div
      onClick={handleOpenPost}
      className={` bg-white dark:bg-neutral-900 p-4 rounded-md border shadow-sm hover:shadow-md transition ${post.replyToPostId
        ? "border-blue-500/50"
        : "border-yellow-700/30 hover:border-yellow-500"
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
              <span className="font-semibold text-gray-900 dark:text-yellow-100">
                {userDetails?.displayname || "User"}
              </span>
              <span className="text-yellow-400 dark:text-gray-600 text-sm">
                {" "}
                @{userDetails?.username || "user"}
              </span>
              <span
                className="text-gray-500 dark:text-yellow-500 text-xs cursor-default"
                title={formatFullDate(post.createdAt)}
              >
                • {formatPostTime(post.createdAt)}
              </span>
            </div>
            <p className="text-gray-700 dark:text-yellow-200 text-sm mt-1">{post.text}</p>
          </div>

          {/* Three-dot menu only for owner */}
          {isOwner && (
            <div className="ml-auto relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu((prev) => !prev);
                }}
                className="p-2 rounded-full hover:bg-gray-200 dark:bg-neutral-700"
              >
                <FiMoreHorizontal />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-neutral-900 border border-yellow-700 rounded-md shadow-lg">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:bg-neutral-800 transition"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {post.media && post.media.length > 0 && (
        <MediaCollage media={post.media} />
      )}

      {/* Poll */}
      <Poll post={post} user={user} />

      {/* Actions */}
      <div className="flex justify-between mt-4 text-yellow-400 dark:text-gray-600 text-sm flex-wrap">
        <button
          title="Reply"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenReply();
          }}
          className="flex items-center gap-1 hover:text-yellow-200 dark:hover:text-gray-900 dark:text-gray-700 transition"
        >
          <FiMessageCircle />
          <span>{post.replyCount || 0}</span>
        </button>
        <button
          title="Repost"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 hover:text-yellow-200 dark:hover:text-gray-900 dark:text-gray-700 transition"
        >
          <FiRepeat />
          <span>0</span>
        </button>
        <button
          title="Share"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 hover:text-yellow-200 dark:hover:text-gray-900 dark:text-gray-700 transition"
        >
          <FiShare />
          <span>0</span>
        </button>
        <button
          title="Bookmark"
          onClick={(e) => {
            e.stopPropagation();
            handleBookmarkToggle();
          }}
          className={`flex items-center gap-1 transition ${bookmarked ? "text-yellow-900" : "hover:text-yellow-200 dark:hover:text-gray-900"
            }`}
        >
          <FiBookmark />
        </button>
        <button
          title="Like"
          onClick={(e) => {
            e.stopPropagation();
            handleLikeToggle();
          }}
          className={`flex items-center gap-1 transition ${liked ? "text-red-500" : "hover:text-yellow-200 dark:hover:text-gray-900"
            }`}
        >
          <FiHeart />
          <span>{likeCount}</span>
        </button>
        <button
          title="Views"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 hover:text-yellow-200 dark:hover:text-gray-900 dark:text-gray-700 transition"
        >
          <FiEye />
          <span>{post.viewCount}</span>
        </button>
      </div>
    </div>
  );
}

export default PostCard;
