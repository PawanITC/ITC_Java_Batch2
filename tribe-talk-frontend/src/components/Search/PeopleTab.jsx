import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser } from "react-icons/fi";
import axiosInstance from "../../services/axiosInstance";

function PeopleTab({ query }) {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPeople = async () => {
      try {
        const res = await axiosInstance.get("/api/v1/search/people", {
          params: { q: query }
        });
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to load people:", err);
      }
    };

    loadPeople();
  }, [query]);

  if (users.length === 0) {
    return <p className="text-yellow-400">No people found.</p>;
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between bg-neutral-800 border border-yellow-700/40 rounded-lg px-4 py-3"
        >
          {/* Left: Avatar + Info */}
          <div
            className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition"
            onClick={() => navigate(`/profile/${user.id}`)}
          >
            {/* User Avatar */}
            {user.profileImageUrl && user.profileImageUrl.trim() !== "" ? (
              <img
                src={user.profileImageUrl}
                alt={user.displayname || user.username}
                className="w-12 h-12 rounded-full object-cover border border-yellow-500"
                loading="lazy"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center border border-yellow-500">
                <FiUser className="text-neutral-900" size={24} />
              </div>
            )}
            <div>
              <div className="font-semibold text-yellow-100">@{user.displayname}</div>
              <div className="text-sm text-yellow-400">@{user.username}</div>
            </div>
          </div>

          {/* Right: Follow Button */}
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-1 rounded-full"
            onClick={(e) => e.stopPropagation()}
          >
            Follow
          </button>
        </div>
      ))}
    </div>
  );
}

export default PeopleTab;
