import axiosInstance from "../services/axiosInstance";
import React, { useEffect, useState } from 'react'
import { FiSearch, FiX } from 'react-icons/fi';

const SelectUser = ({ onClose, onUserSelect }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch current user + all users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [loggedUserRes, allUsersRes] = await Promise.all([
          axiosInstance.get(`/users/loggedUser`),
          axiosInstance.get(`api/users/all`),
        ]);

        setCurrentUser(loggedUserRes.data);
        setUsers(allUsersRes.data);
      } catch (err) {
        console.error("Error fetching users", err);
      }
    };

    fetchData();
  }, []);

  const filtered =
  searchQuery.trim().length === 0 || !Array.isArray(users) || users.length === 0
      ? []
      : users
          .filter((u) => currentUser && u.id !== currentUser.id)
          .filter((u) =>
            u.displayname.toLowerCase().includes(searchQuery.toLowerCase())
          );

  return (
    <>
      {/* ⛔ FULL SCREEN OVERLAY */}
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">

        {/* POPUP CARD */}
        <div className="bg-neutral-900 border border-yellow-700 rounded-2xl p-6 w-96 text-yellow-100 relative">

          {/* CLOSE BUTTON */}
          <button
            className="absolute top-3 right-3 text-yellow-400 text-xl"
            onClick={onClose}
          >
            <FiX />
          </button>

          <h2 className="text-xl font-bold mb-4">Start New Chat</h2>

          {/* SEARCH BAR */}
          <div className="flex items-center gap-2 bg-neutral-800 border border-yellow-700 rounded-full px-4 py-2 mb-4">
            <FiSearch className="text-yellow-400 text-lg" />
            <input
              type="text"
              placeholder="Search users..."
              className="bg-transparent w-full text-yellow-100 focus:outline-none placeholder-yellow-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* USER LIST */}
          <div className="max-h-64 overflow-y-auto space-y-2">

            {searchQuery.trim().length === 0 ? (
              <p className="text-yellow-400 text-sm text-center">
                Type to search users…
              </p>
            ) : filtered.length > 0 ? (
              filtered.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onUserSelect(user)}
                  className="flex items-center gap-3 w-full px-3 py-2 bg-neutral-800 rounded-lg border border-yellow-700/40 hover:bg-yellow-700/20 transition"
                >
                  <img
                    src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${user.username}`}
                    className="w-10 h-10 rounded-full"
                  />

                  <div className="text-left">
                    <p className="font-semibold">{user.displayname}</p>
                    <p className="text-sm text-yellow-400">@{user.username}</p>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-yellow-400 text-sm">No users found.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SelectUser;
