import { useState, useEffect, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import { AuthContext } from "../../auth/AuthContext";
import { GlobalContext } from "../GlobalContext";
import { toast } from "react-toastify";

function UserCard({ userId, displayName, username, profileImageUrl }) {
  const { user } = useContext(AuthContext);
  const { followingCount, setFollowingCount } = useContext(GlobalContext);
  const currentUserId = user?.userId;

  const [isFollowing, setIsFollowing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverData, setHoverData] = useState(null);

  // Check if current user is following
  useEffect(() => {
    if (!currentUserId || !userId) return;
    const fetchFollowing = async () => {
      try {
        const res = await axiosInstance.get(`/api/follow/following-list/${currentUserId}`);
        const map = {};
        res.data.forEach((u) => (map[u.id] = true));
        setIsFollowing(!!map[userId]);
      } catch {
        console.error("Failed to load following status");
      }
    };
    fetchFollowing();
  }, [currentUserId, userId]);

  // Fetch hover data (followers & following count)
  const fetchHoverData = async () => {
    try {
      const [followersRes, followingRes] = await Promise.all([
        axiosInstance.get(`/api/users/${userId}/followers-count`),
        axiosInstance.get(`/api/users/${userId}/following-count`)
      ]);
      setHoverData({
        followers: followersRes.data,
        following: followingRes.data
      });
    } catch {
      console.error("Failed to load hover data");
    }
  };

  const toggleFollow = async () => {
    const url = isFollowing ? "/api/follow/unfollow-user" : "/api/follow/follow-user";
    const method = isFollowing ? "delete" : "post";

    try {
      await axiosInstance({
        method,
        url,
        data: { followerId: currentUserId, followingId: userId }
      });
      setIsFollowing(!isFollowing);
      setFollowingCount(prev => isFollowing ? prev - 1 : prev + 1);
      toast.success(isFollowing ? "Unfollowed!" : "Followed!");
    } catch {
      toast.error("Failed to update follow status");
    }
  };

  return (
    <div
      className="flex items-center justify-between p-2 bg-neutral-800 border border-yellow-700/40 rounded-lg relative"
      onMouseEnter={() => {
        setIsHovering(true);
        fetchHoverData();
      }}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex items-center gap-2">
        <img
          src={profileImageUrl || "/default_profile_icon.jpg"}
          alt={displayName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-yellow-100">{displayName}</p>
          <p className="text-sm text-yellow-400">@{username}</p>
        </div>
      </div>

      <button
        onClick={toggleFollow}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200
          ${isFollowing
            ? isHovering
              ? "bg-black border border-red-500 text-red-500"
              : "bg-neutral-700 border border-yellow-400 text-yellow-400"
            : "bg-yellow-500 text-neutral-900 hover:bg-yellow-400"
          }`}
      >
        {isFollowing
          ? isHovering
            ? "Unfollow"
            : "Following"
          : "Follow"}
      </button>

      {/* Hover popup */}
      {isHovering && hoverData && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-neutral-900 border border-yellow-700 rounded-lg p-2 z-50 text-yellow-200 text-sm shadow-lg">
          <p><strong>{hoverData.followers}</strong> Followers</p>
          <p><strong>{hoverData.following}</strong> Following</p>
        </div>
      )}
    </div>
  );
}

export default UserCard;
