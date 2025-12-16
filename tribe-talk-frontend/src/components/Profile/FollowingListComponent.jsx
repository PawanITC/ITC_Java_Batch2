import { useEffect, useState, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { AuthContext } from "../../auth/AuthContext";
import UserCard from "../user/UserCard";

function FollowingList() {
  const { user } = useContext(AuthContext);
  const userId = user?.userId;

  const [following, setFollowing] = useState([]);

  useEffect(() => {
    if (!userId) return;

    const fetchFollowing = async () => {
      try {
        const res = await axiosInstance.get(`/api/follow/following-list/${userId}`);
        setFollowing(res.data);
      } catch {
        toast.error("Failed to load following list");
      }
    };
    fetchFollowing();
  }, [userId]);

  return (
    <div className="p-4 text-yellow-200">
      <h1 className="text-xl font-semibold mb-4">Following</h1>
      {following.length === 0 && <p className="text-yellow-400">Not following anyone yet.</p>}
      <div className="space-y-2">
        {following.map(u => (
          <UserCard
            key={u.id}
            userId={u.id}
            displayName={u.displayname}
            username={u.username}
            profileImageUrl={u.profilePictureUrl}
          />
        ))}
      </div>
    </div>
  );
}

export default FollowingList;
