import axiosInstance from "../services/axiosInstance";
import React, { useEffect, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

const SelectUser = ({ onClose, onUserSelect }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [loggedUserRes, allUsersRes] = await Promise.all([
          axiosInstance.get(`/api/users/loggedUser`),
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

  const toggleUserSelection = (user) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  };

  const handleCreateGroup = () => {
    if (selectedUsers.length > 1) {
      onUserSelect({ type: "group", members: selectedUsers });
      setSelectedUsers([]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-neutral-900 border border-yellow-700 rounded-2xl p-6 w-96 text-yellow-100 relative">
        <button
          className="absolute top-3 right-3 text-yellow-400 text-xl"
          onClick={onClose}
        >
          <FiX />
        </button>

        <h2 className="text-xl font-bold mb-4">Start New Chat</h2>

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

        <div className="max-h-64 overflow-y-auto space-y-2">
          {searchQuery.trim().length === 0 ? (
            <p className="text-yellow-400 text-sm text-center">Type to search users…</p>
          ) : filtered.length > 0 ? (
            filtered.map((user) => (
              <button
                key={user.id}
                onClick={() => toggleUserSelection(user)}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg border ${
                  selectedUsers.some((u) => u.id === user.id)
                    ? "bg-yellow-700 text-black"
                    : "bg-neutral-800 text-yellow-100"
                }`}
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

        <button
          onClick={handleCreateGroup}
          disabled={selectedUsers.length < 2}
          className="mt-4 w-full bg-yellow-700 text-black py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          Create Group Chat
        </button>
      </div>
    </div>
  );
};

export default SelectUser;