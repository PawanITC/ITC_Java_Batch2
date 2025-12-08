import { useEffect, useState, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { GlobalContext } from "../GlobalContext";
import { AuthContext } from "../../auth/AuthContext";

function FollowersPage() {
  const { user } = useContext(AuthContext);
  const { followersCount, setFollowersCount, followingCount, setFollowingCount } = useContext(GlobalContext);
  const userId = user?.userId;

  const [followersList, setFollowersList] = useState([]);
  const [followingMap, setFollowingMap] = useState({}); // who the logged-in user follows

  // Fetch followers list
  const fetchFollowersList = async () => {
    try {
      const res = await axiosInstance.get(`/api/follow/followers-list/${userId}`);
      const list = res.data || [];
      setFollowersList(list);

      // Initialize map of who the logged-in user is following
      const map = {};
      list.forEach((u) => {
        // API should provide `isFollowing` relative to logged-in user
        map[u.id] = !!u.isFollowing;
      });
      setFollowingMap(map);
    } catch {
      toast.error("Failed to fetch followers");
    }
  };

  useEffect(() => {
    if (userId) fetchFollowersList();
  }, [userId]);

  const toggleFollow = async (targetId) => {
    const isFollowing = followingMap[targetId];
    const method = isFollowing ? "delete" : "post";
    const url = isFollowing ? "/api/follow/unfollow-user" : "/api/follow/follow-user";

    try {
      await axiosInstance({ method, url, data: { followerId: userId, followingId: targetId } });

      // Update UI instantly
      setFollowingMap((prev) => ({ ...prev, [targetId]: !isFollowing }));

      // Update global following count
      if (isFollowing) setFollowingCount((prev) => Math.max(0, prev - 1));
      else setFollowingCount((prev) => prev + 1);

      toast.success(isFollowing ? "Unfollowed!" : "Followed!");
    } catch {
      toast.error("Failed to update follow status");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 text-yellow-100">
      <h2 className="text-2xl font-bold mb-4">Followers</h2>

      {followersList.length === 0 ? (
        <p className="text-yellow-400">No followers yet.</p>
      ) : (
        followersList.map((u) => (
          <div
            key={u.id}
            className="flex justify-between items-center py-3 border-b border-yellow-700/40"
          >
            <div>
              <p className="font-semibold">{u.displayname}</p>
              <p className="text-yellow-400">@{u.username}</p>
            </div>
            <button
              onClick={() => toggleFollow(u.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                followingMap[u.id]
                  ? "bg-neutral-700 text-yellow-400 border border-yellow-500"
                  : "bg-yellow-500 text-neutral-900 hover:bg-yellow-400"
              }`}
            >
              {followingMap[u.id] ? "Following" : "Follow"}
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default FollowersPage;
