import { useEffect, useState, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { AuthContext } from "../../auth/AuthContext";
import { GlobalContext } from "../GlobalContext";
 
function SuggestedUsers() {
  const { user } = useContext(AuthContext);
  const { followingCount, setFollowingCount } = useContext(GlobalContext);
 
  const [users, setUsers] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [hoverMap, setHoverMap] = useState({}); // NEW
  const userId = user?.userId;
 
  const fetchSuggestedUsers = async () => {
    if (!userId) return;
    try {
      const res = await axiosInstance.get(`/api/users/suggested-users/${userId}`);
      setUsers(res.data);
 
      const map = {};
      res.data.forEach((u) => {
        map[u.id] = u.isFollowing || false;
      });
      setFollowingMap(map);
    } catch {
      toast.error("Failed to load suggested users.");
    }
  };
 
  useEffect(() => {
    fetchSuggestedUsers();
  }, [userId]);
 
  const toggleFollow = async (targetId) => {
    const isFollowing = followingMap[targetId];
    const url = isFollowing ? "/api/follow/unfollow-user" : "/api/follow/follow-user";
    const method = isFollowing ? "delete" : "post";
 
    try {
      await axiosInstance({ method, url, data: { followerId: userId, followingId: targetId } });
      setFollowingMap((prev) => ({ ...prev, [targetId]: !isFollowing }));
 
      setFollowingCount((prev) => (isFollowing ? prev - 1 : prev + 1));
      toast.success(isFollowing ? "Unfollowed!" : "Followed!");
    } catch {
      toast.error("Could not update follow status.");
    }
  };
 
  return (
    <div className="bg-neutral-800 border border-yellow-700/40 rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-4">You Might Like</h2>
      <ul className="space-y-4">
 
        {users.length === 0 ? (
          <p className="text-yellow-400 text-sm">No users to suggest.</p>
        ) : (
          users.map((u) => {
            const isFollowing = followingMap[u.id];
            const isHovering = hoverMap[u.id];
 
            return (
              <li key={u.id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-yellow-100">{u.displayname}</p>
                  <p className="text-sm text-yellow-400">@{u.username}</p>
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
          })
        )}
 
      </ul>
    </div>
  );
}
 
export default SuggestedUsers;