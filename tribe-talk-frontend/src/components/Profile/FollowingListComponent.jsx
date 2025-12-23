import { useEffect, useState, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { AuthContext } from "../../auth/AuthContext";
import UserCard from "../user/UserCard";

function FollowingList({ userId: viewedUserId }) {
  const { user } = useContext(AuthContext);
  const loggedInUserId = user?.userId;

  const [users, setUsers] = useState([]);
  const [followingMap, setFollowingMap] = useState({});

  useEffect(() => {
    if (!viewedUserId || !loggedInUserId) return;

    const fetchFollowing = async () => {
      try {
        const [viewedUserFollowingRes, loggedInUserFollowingRes] = await Promise.all([
          axiosInstance.get(`/api/follow/following-list/${viewedUserId}`),
          axiosInstance.get(`/api/follow/following-list/${loggedInUserId}`),
        ]);

        setUsers(viewedUserFollowingRes.data);

        const map = {};
        loggedInUserFollowingRes.data.forEach(u => (map[u.id] = true));
        setFollowingMap(map);

      } catch {
        toast.error("Failed to load following list");
      }
    };

    fetchFollowing();
  }, [viewedUserId, loggedInUserId]);

  const toggleFollow = async (targetId) => {
    const isFollowing = followingMap[targetId];

    try {
      await axiosInstance({
        method: isFollowing ? "delete" : "post",
        url: isFollowing
          ? "/api/follow/unfollow-user"
          : "/api/follow/follow-user",
        data: { followerId: loggedInUserId, followingId: targetId },
      });

      setFollowingMap(prev => ({
        ...prev,
        [targetId]: !isFollowing,
      }));
    } catch {
      toast.error("Action failed");
    }
  };

  return (
    <div className="p-4 text-yellow-200">
      <h1 className="text-xl font-semibold mb-4">Following</h1>

      {users.length === 0 ? (
        <p className="text-yellow-400">Not following anyone yet.</p>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <UserCard
              key={u.id}
              user={u}
              isFollowing={followingMap[u.id]}
              onToggleFollow={() => toggleFollow(u.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FollowingList;
