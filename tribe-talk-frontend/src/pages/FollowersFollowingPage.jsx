import { useEffect, useState, useContext } from "react";
import axiosInstance from "../services/axiosInstance";
import { toast } from "react-toastify";
import { AuthContext } from "../auth/AuthContext";

function FollowersListComponent() {
  const { user } = useContext(AuthContext);
  const userId = user?.userId;

  const [followers, setFollowers] = useState([]);
  const [followingMap, setFollowingMap] = useState({});

  const fetchFollowers = async () => {
    try {
      const res = await axiosInstance.get(`/follow/followers-list/${userId}`);
      setFollowers(res.data);
    } catch {
      toast.error("Failed to load followers list");
    }
  };

  const fetchMyFollowing = async () => {
    try {
      const res = await axiosInstance.get(`/follow/following-list/${userId}`);
      const map = {};
      res.data.forEach((u) => (map[u.id] = true));
      setFollowingMap(map);
    } catch {
      toast.error("Failed to load follow status");
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchFollowers();
    fetchMyFollowing();
  }, [userId]);

  const toggleFollow = async (targetId) => {
    const isFollowing = followingMap[targetId];
    const method = isFollowing ? "delete" : "post";
    const url = isFollowing ? "/api/follow/unfollow-user" : "/api/follow/follow-user";

    try {
      await axiosInstance({
        method,
        url,
        data: { followerId: userId, followingId: targetId },
      });

      setFollowingMap((prev) => ({
        ...prev,
        [targetId]: !isFollowing,
      }));

      toast.success(isFollowing ? "Unfollowed!" : "Followed!");
    } catch {
      toast.error("Operation failed");
    }
  };

  return (
    <div className="p-4 text-yellow-200">
      <h1 className="text-xl font-semibold mb-4">Followers</h1>

      {followers.length === 0 && (
        <p className="text-yellow-400">No followers found.</p>
      )}

      <ul className="space-y-4">
        {followers.map((u) => (
          <li
            key={u.id}
            className="flex items-center justify-between bg-neutral-800 border border-yellow-700/40 p-3 rounded-xl"
          >
            <div>
              <p className="font-semibold text-yellow-100">{u.displayname}</p>
              <p className="text-sm text-yellow-400">@{u.username}</p>
            </div>

            <button
              onClick={() => toggleFollow(u.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${followingMap[u.id]
                ? "bg-neutral-700 text-yellow-400 border border-yellow-400"
                : "bg-yellow-500 text-neutral-900 hover:bg-yellow-400"
                }`}
            >
              {followingMap[u.id] ? "Following" : "Follow"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FollowersListComponent;
