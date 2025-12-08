import { useEffect, useState, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { AuthContext } from "../../auth/AuthContext";
import { GlobalContext } from "../GlobalContext";

function FollowingPage() {
  const { user } = useContext(AuthContext);
  const { followingCount, setFollowingCount } = useContext(GlobalContext);

  const [followingList, setFollowingList] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const userId = user?.userId;

  const fetchFollowingList = async () => {
    if (!userId) return;
    try {
      const res = await axiosInstance.get(`/api/follow/following-list/${userId}`);
      setFollowingList(res.data);
      const map = {};
      res.data.forEach((u) => (map[u.id] = true));
      setFollowingMap(map);
    } catch {
      toast.error("Failed to load following list.");
    }
  };

  useEffect(() => {
    fetchFollowingList();
  }, [userId]);

  const toggleFollow = async (targetId) => {
    const isFollowing = followingMap[targetId];
    const url = isFollowing ? "/api/follow/unfollow-user" : "/api/follow/follow-user";
    const method = isFollowing ? "delete" : "post";

    try {
      await axiosInstance({ method, url, data: { followerId: userId, followingId: targetId } });
      if (isFollowing) {
        setFollowingList((prev) => prev.filter((u) => u.id !== targetId));
        setFollowingCount((prev) => prev - 1);
        toast.success("Unfollowed!");
      } else {
        setFollowingCount((prev) => prev + 1);
        toast.success("Followed!");
      }
      setFollowingMap((prev) => ({ ...prev, [targetId]: !isFollowing }));
    } catch {
      toast.error("Failed to update follow status.");
    }
  };

  return (
    <div className="p-4 bg-neutral-900 rounded-xl">
      <h1 className="text-2xl font-bold text-yellow-300 mb-4">Following</h1>
      {followingList.length === 0 ? (
        <p className="text-yellow-400">You are not following anyone yet.</p>
      ) : (
        <ul className="space-y-4">
          {followingList.map((u) => (
            <li key={u.id} className="flex items-center justify-between border-b border-yellow-700/40 py-2">
              <div>
                <p className="text-yellow-100 font-semibold">{u.displayname}</p>
                <p className="text-yellow-400 text-sm">@{u.username}</p>
              </div>
              <button
                onClick={() => toggleFollow(u.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  followingMap[u.id] ? "bg-neutral-700 text-yellow-400 border border-yellow-400" : "bg-yellow-500 text-neutral-900 hover:bg-yellow-400"
                }`}
              >
                {followingMap[u.id] ? "Following" : "Follow"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FollowingPage;
