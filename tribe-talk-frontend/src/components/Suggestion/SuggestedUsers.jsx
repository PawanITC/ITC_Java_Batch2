import { useEffect, useState, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { AuthContext } from "../../auth/AuthContext";
import { GlobalContext } from "../GlobalContext";
import UserCard from "../user/UserCard";

function SuggestedUsers() {
  const { user } = useContext(AuthContext);
  const { setFollowingCount } = useContext(GlobalContext);

  const userId = user?.userId;

  const [users, setUsers] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [suggestedRes, followingRes] = await Promise.all([
          axiosInstance.get(`/api/users/suggested-users/${userId}`),
          axiosInstance.get(`/api/follow/following-list/${userId}`),
        ]);

        setUsers(suggestedRes.data);

        const map = {};
        followingRes.data.forEach(u => (map[u.id] = true));
        setFollowingMap(map);

      } catch {
        toast.error("Failed to load suggestions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const toggleFollow = async (targetId) => {
    const isFollowing = followingMap[targetId];

    try {
      await axiosInstance({
        method: isFollowing ? "delete" : "post",
        url: isFollowing
          ? "/api/follow/unfollow-user"
          : "/api/follow/follow-user",
        data: { followerId: userId, followingId: targetId },
      });

      setFollowingMap(prev => ({
        ...prev,
        [targetId]: !isFollowing,
      }));

      setFollowingCount(prev => (isFollowing ? prev - 1 : prev + 1));
    } catch {
      toast.error("Action failed");
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 border border-yellow-700/40 rounded-xl p-4">
      <h2 className="text-lg font-semibold text-yellow-700 dark:text-yellow-200 mb-4">You might like</h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-yellow-400 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400 mx-auto mb-2"></div>
            <p className="text-sm">Loading suggestions...</p>
          </div>
        </div>
      ) : users.length === 0 ? (
        <p className="text-yellow-400 dark:text-yellow-200 text-sm">No suggestions</p>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <UserCard
              key={u.id}
              user={u}
              isFollowing={!!followingMap[u.id]}
              onToggleFollow={() => toggleFollow(u.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SuggestedUsers;
