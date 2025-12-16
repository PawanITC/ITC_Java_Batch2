import { useEffect, useState, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { AuthContext } from "../../auth/AuthContext";
import UserCard from "../user/UserCard";

function SuggestedUsers() {
  const { user } = useContext(AuthContext);
  const userId = user?.userId;

  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!userId) return;

    const fetchSuggestedUsers = async () => {
      try {
        const res = await axiosInstance.get(`/api/users/suggested-users/${userId}`);
        setUsers(res.data);
      } catch {
        toast.error("Failed to load suggested users.");
      }
    };
    fetchSuggestedUsers();
  }, [userId]);

  return (
    <div className="bg-neutral-800 border border-yellow-700/40 rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-4">You Might Like</h2>
      {users.length === 0 ? (
        <p className="text-yellow-400 text-sm">No users to suggest.</p>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <UserCard
              key={u.id}
              userId={u.id}
              displayName={u.displayname}
              username={u.username}
              profileImageUrl={u.profilePictureUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SuggestedUsers;
