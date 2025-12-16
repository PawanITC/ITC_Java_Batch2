import { useEffect, useState, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { AuthContext } from "../../auth/AuthContext";
import UserCard from "../user/UserCard";

function FollowersList() {
  const { user } = useContext(AuthContext);
  const userId = user?.userId;

  const [followers, setFollowers] = useState([]);

  useEffect(() => {
    if (!userId) return;

    const fetchFollowers = async () => {
      try {
        const res = await axiosInstance.get(`/api/follow/followers-list/${userId}`);
        setFollowers(res.data);
      } catch {
        toast.error("Failed to load followers list");
      }
    };
    fetchFollowers();
  }, [userId]);

  return (
    <div className="p-4 text-yellow-200">
      <h1 className="text-xl font-semibold mb-4">Followers</h1>
      {followers.length === 0 && <p className="text-yellow-400">No followers found.</p>}
      <div className="space-y-2">
        {followers.map(u => (
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

export default FollowersList;
