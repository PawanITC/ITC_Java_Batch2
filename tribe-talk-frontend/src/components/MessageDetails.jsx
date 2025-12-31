import { FiSearch, FiX } from "react-icons/fi";
import { useState, useEffect } from "react";
import axiosInstance from "../services/axiosInstance";

function MessageDetails({ currentUser, setSelectedUser }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [groupedChats, setGroupedChats] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allUsersRes = await axiosInstance.get(`/api/users/all`);
        setUsers(allUsersRes.data);
      } catch (err) {
        console.error("Error fetching users", err);
      }
    };
    fetchData();
  }, []);

  const handleFetchGroupedChats = async () => {
    if (!currentUser) return;
    try {
      const res = await axiosInstance.get(
        `/api/chat/conversations/user/${currentUser.id}`
      );
      setGroupedChats(res.data);
    } catch (err) {
      console.error("Error fetching grouped chats", err);
    }
  };

  const handleFetchUnreadChats = async () => {
    if (!currentUser) return;
    try {
      const res = await axiosInstance.get(
        `/api/chat/conversations/unread/${currentUser.id}`
      );
      setGroupedChats(res.data);
    } catch (err) {
      console.error("Error fetching unread chats", err);
    }
  };

  const handleFetchGroups = async () => {
    if (!currentUser) return;
    try {
      const res = await axiosInstance.get(
        `/api/chat/groups/${currentUser.id}`
      );
      setGroupedChats(res.data);
    } catch (err) {
      console.error("Error fetching groups", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      handleFetchGroupedChats();
    }
  }, [currentUser]);

  const toIdString = (id) => id?.toString?.() ?? "";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 text-yellow-100 relative">
      <h1 className="text-xl font-bold mb-4">Messages</h1>

      <div className="flex items-center gap-2 bg-neutral-800 border border-yellow-700 rounded-full px-4 py-2 mb-4">
        <FiSearch className="text-yellow-400 text-lg" />
        <input
          type="text"
          placeholder="Search people or groups"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent w-full text-yellow-100 placeholder-yellow-400 focus:outline-none"
        />
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={handleFetchGroupedChats}
          className="px-4 py-2 rounded-lg border border-yellow-700 text-yellow-100 bg-neutral-900 hover:bg-neutral-800 transition"
        >
          All
        </button>
        <button
          onClick={handleFetchUnreadChats}
          className="px-4 py-2 rounded-lg border border-yellow-700 text-yellow-100 bg-neutral-900 hover:bg-neutral-800 transition"
        >
          Unread
        </button>
        <button
          onClick={handleFetchGroups}
          className="px-4 py-2 rounded-lg border border-yellow-700 text-yellow-100 bg-neutral-900 hover:bg-neutral-800 transition"
        >
          Groups
        </button>
      </div>

      {Object.entries(groupedChats).map(([roomId, messages]) => {
        const lastMessage = messages[0];

        if (lastMessage?.isGroup || lastMessage?.group) {
          const memberIds = (lastMessage.groupMembers || []).map(toIdString);
          const currentId = toIdString(currentUser.id);

          // Build full participant list: sender + groupMembers
          const participantIds = [
            toIdString(lastMessage.senderId),
            ...memberIds,
          ].filter(Boolean);

          // Generate roomId (no duplicate currentId)
          const sortedIds = participantIds
            .map(Number)
            .sort((a, b) => a - b)
            .map(String);
          const generatedRoomId = sortedIds.join("_");

          // Exclude current user for label
          const otherMembers = users.filter(
            (u) =>
              participantIds.includes(toIdString(u.id)) &&
              toIdString(u.id) !== currentId
          );

          let label;
          let plainLabel;

          if (otherMembers.length > 0) {
            const firstOther =
              otherMembers[0].displayname || otherMembers[0].username;
            const othersCount = otherMembers.length - 1;

            if (othersCount > 0) {
              const tooltipNames = otherMembers
                .slice(1)
                .map((m) => m.displayname || m.username)
                .join(", ");

              label = (
                <>
                  {firstOther} and{" "}
                  <span title={tooltipNames} className="underline cursor-help">
                    {othersCount} other{othersCount > 1 ? "s" : ""}
                  </span>
                </>
              );
              plainLabel = `${firstOther} and ${othersCount} other${othersCount > 1 ? "s" : ""}`;
            } else {
              label = firstOther;
              plainLabel = firstOther;
            }
          } else {
            label = "Group Chat";
            plainLabel = "Group Chat";
          }

          return (
            <button
              key={generatedRoomId}
              onClick={() =>
                setSelectedUser({
                  type: "group",
                  id: generatedRoomId,
                  name: plainLabel, // string for chat header
                  members: memberIds,
                })
              }
              className="w-full text-left bg-neutral-800 p-4 rounded-md border border-yellow-700/40 mb-2 hover:bg-yellow-700/10 transition"
            >
              <p className="text-yellow-100 font-semibold">{label}</p>
              <p className="text-yellow-400 text-sm">
                Last message: {lastMessage.content}
              </p>
            </button>
          );
        } else {
          const otherUserId =
            Number(lastMessage.senderId) === currentUser.id
              ? lastMessage.receiverId
              : lastMessage.senderId;
          const otherUser = users.find((u) => u.id === Number(otherUserId));

          return (
            <button
              key={roomId}
              onClick={() => setSelectedUser(otherUser)}
              className="w-full text-left bg-neutral-800 p-4 rounded-md border border-yellow-700/40 mb-2 hover:bg-yellow-700/10 transition flex items-center gap-3"
            >
              {/* Profile Image */}
              {otherUser?.profileImageUrl && otherUser.profileImageUrl.trim() !== "" ? (
                <img
                  src={otherUser.profileImageUrl}
                  alt={otherUser.displayname || otherUser.username}
                  className="w-12 h-12 rounded-full object-cover border border-yellow-500 flex-shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center border border-yellow-500 flex-shrink-0">
                  <span className="text-neutral-900 font-bold text-lg">
                    {(otherUser?.displayname || otherUser?.username || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <p className="text-yellow-100 font-semibold truncate">
                  {otherUser?.displayname || `User ${otherUserId}`}
                </p>
                <p className="text-yellow-400 text-sm flex items-center gap-2 truncate">
                  Last message: {lastMessage.content}
                  {!lastMessage.isRead &&
                    lastMessage.receiverId === currentUser.id && (
                      <span className="text-yellow-500 text-xs font-bold ml-2">
                        ● Unread
                      </span>
                    )}
                </p>
              </div>
            </button>
          );
        }
      })}
    </div>
  );
}

export default MessageDetails;