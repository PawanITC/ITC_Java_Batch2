import { FiMessageSquare, FiEdit, FiSearch, FiX } from "react-icons/fi";
import { useState } from "react";
import ChatScreen from "./ChatScreen";

function MessageDetails() {
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const users = [
    {
      id: 1,
      name: "Elena",
      handle: "@xtinyelenaxo",
      avatar: "https://via.placeholder.com/40x40",
    },
    {
      id: 2,
      name: "Elena Vesnina",
      handle: "@EVesnina001",
      avatar: "https://via.placeholder.com/40x40",
    },
    {
      id: 3,
      name: "User",
      handle: "@user",
      avatar: "https://via.placeholder.com/40x40",
    },
    {
      id: 4,
      name: "Elena Cardone",
      handle: "@ElenaCardone",
      avatar: "https://via.placeholder.com/40x40",
    },
  ];

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isEmpty = messages.length === 0;
  const closeChat = () => setSelectedUser(null);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 text-yellow-100 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Messages</h1>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-neutral-800 border border-yellow-700 rounded-full px-4 py-2 mb-6">
        <FiSearch className="text-yellow-400 text-lg" />
        <input
          type="text"
          placeholder="Search people to message"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent w-full text-yellow-100 placeholder-yellow-400 focus:outline-none"
        />
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="mb-6 space-y-3">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="w-full flex items-center gap-3 bg-neutral-800 px-4 py-2 rounded-md border border-yellow-700/40 hover:bg-yellow-700/20 transition"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="text-left">
                  <p className="font-semibold text-yellow-100">{user.name}</p>
                  <p className="text-sm text-yellow-400">{user.handle}</p>
                </div>
              </button>
            ))
          ) : (
            <p className="text-sm text-yellow-400">No users found.</p>
          )}
        </div>
      )}

      {/* Empty Inbox */}
      <div className="min-h-[200px] flex flex-col items-center justify-center text-center">
        {isEmpty ? (
          <>
            <h2 className="text-lg font-semibold text-yellow-100 mb-2">
              Welcome to your inbox!
            </h2>
            <p className="text-sm text-yellow-400 max-w-sm mb-6">
              Drop a line, share posts and more with private conversations
              between you and others on TribeTalk.
            </p>
          </>
        ) : (
          <ul className="space-y-4 w-full">
            {messages.map((msg, i) => (
              <li
                key={i}
                className="bg-neutral-800 p-4 rounded-md border border-yellow-700/40"
              >
                <p>{msg.preview}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ChatScreen Popup */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="absolute top-4 right-4">
            <button
              onClick={closeChat}
              className="text-yellow-400 text-2xl hover:text-yellow-200"
            >
              <FiX />
            </button>
          </div>
          <ChatScreen user={selectedUser} />
        </div>
      )}
    </div>
  );
}

export default MessageDetails;
