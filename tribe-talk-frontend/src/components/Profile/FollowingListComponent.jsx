import { useEffect, useState, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { AuthContext } from "../../auth/AuthContext";
import { GlobalContext } from "../GlobalContext";

function FollowingListComponent() {
  const { user } = useContext(AuthContext);
  const { followingCount, setFollowingCount } = useContext(GlobalContext);

  const [followingList, setFollowingList] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [hoverMap, setHoverMap] = useState({});   // NEW
  const userId = user?.userId;

  const fetchFollowingList = async () => {
    if (!userId) return;
    try {
      const res = await axiosInstance.get(`/api/follow/following-list/${userId}`);
      setFollowingList(res.data);

      const map = {};
      res.data.forEach(u => (map[u.id] = true));
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
      await axiosInstance({
        method,
        url,
        data: { followerId: userId, followingId: targetId },
      });

      if (isFollowing) {
        // Remove from list
        setFollowingList(prev => prev.filter((u) => u.id !== targetId));
        setFollowingCount(prev => prev - 1);
        toast.success("Unfollowed!");
      } else {
        setFollowingCount(prev => prev + 1);
        toast.success("Followed!");
      }

      setFollowingMap(prev => ({ ...prev, [targetId]: !isFollowing }));
    } catch {
      toast.error("Failed to update follow status.");
    }
  };

  return (
    <div className="p-4 text-yellow-200">
      <h1 className="text-xl font-semibold mb-4">Following</h1>

      {followingList.length === 0 ? (
        <p className="text-yellow-400">You are not following anyone yet.</p>
      ) : (
        <ul className="space-y-4">
          {followingList.map((u) => {
            const isFollowing = followingMap[u.id];
            const isHovering = hoverMap[u.id];

            return (
              <li
                key={u.id}
                className="flex items-center justify-between 
                           bg-neutral-800 border border-yellow-700/40 
                           p-3 rounded-xl"
              >
                <div>
                  <p className="text-yellow-100 font-semibold">{u.displayname}</p>
                  <p className="text-yellow-400 text-sm">@{u.username}</p>
                </div>

                <button
                  onClick={() => toggleFollow(u.id)}
                  onMouseEnter={() => {
                    if (isFollowing) {
                      setHoverMap((prev) => ({ ...prev, [u.id]: true }));
                    }
                  }}
                  onMouseLeave={() => {
                    if (isFollowing) {
                      setHoverMap((prev) => ({ ...prev, [u.id]: false }));
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200
                    ${
                      isFollowing
                        ? isHovering
                          ? "bg-black border border-red-500 text-red-500"
                          : "bg-neutral-700 border border-yellow-400 text-yellow-400"
                        : "bg-yellow-500 text-neutral-900 hover:bg-yellow-400"
                    }
                  `}
                >
                  {isFollowing
                    ? isHovering
                      ? "Unfollow"
                      : "Following"
                    : "Follow"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default FollowingListComponent;
