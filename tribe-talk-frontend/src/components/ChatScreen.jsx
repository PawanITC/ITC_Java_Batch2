import { useEffect, useState } from "react";
import { FiImage, FiSend } from "react-icons/fi";
import { FaRegSmile } from "react-icons/fa";
import axiosInstance from "../services/axiosInstance";
import EmojiPicker from "emoji-picker-react";

function ChatScreen({ user, currentUser, stompClient }) {
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toIdString = (id) => id?.toString?.() ?? "";

  // ✅ Room ID logic
  let roomId;
  if (user?.type === "group") {
    if (user.id) {
      roomId = user.id;
    } else {
      const participantIds = [
        ...user.members.map((m) => toIdString(m.id)),
        toIdString(currentUser.id),
      ].filter(Boolean);
      const uniqueIds = [...new Set(participantIds)];
      roomId = uniqueIds
        .map(Number)
        .sort((a, b) => a - b)
        .map(String)
        .join("_");
    }
  } else if (user?.id && currentUser?.id) {
    const a = Number(currentUser.id);
    const b = Number(user.id);
    roomId = a < b ? `${a}_${b}` : `${b}_${a}`;
  }

  // Load previous messages
  useEffect(() => {
    if (!roomId) return;
    setIsLoading(true);
    axiosInstance.get(`/api/chat/messages/${roomId}`)
      .then((res) => setMessages(res.data))
      .catch((err) => console.error("Error fetching messages:", err))
      .finally(() => setIsLoading(false));
  }, [roomId]);

  // Subscribe to WebSocket topic
  useEffect(() => {
    if (!stompClient || !roomId) return;

    const destination =
      user?.type === "group"
        ? `/topic/group/${roomId}`
        : `/topic/chat/${roomId}`;

    const subscription = stompClient.subscribe(destination, (msg) => {
      const newMessage = JSON.parse(msg.body);
      setMessages((prev) => [...prev, newMessage]);

      const markAsRead = async () => {
        if (
          Number(newMessage.receiverId) === currentUser.id &&
          !newMessage.isRead
        ) {
          try {
            await axiosInstance.put("/api/chat/mark-as-read", {
              senderId: newMessage.senderId,
              receiverId: newMessage.receiverId,
            });
            console.log("Marked incoming message as read");
          } catch (err) {
            console.error("Failed to mark incoming message as read", err);
          }
        }
      };

      markAsRead();
    });

    return () => subscription.unsubscribe();
  }, [stompClient, roomId, user, currentUser]);

  // Send message
  const handleSend = () => {
    if (!messageInput.trim() || !stompClient) return;

    const chatMessage = {
      senderId: currentUser.id,
      content: messageInput,
      chatRoomId: roomId,
      senderUsername: currentUser.displayname,
      isRead: false,
      isGroup: user?.type === "group",
      receiverId: user?.type === "group" ? null : user.id,
      groupMembers: user?.type === "group" ? user.members.map((u) => u.id) : null,
      timestamp: Date.now(),
    };

    stompClient.publish({
      destination: user?.type === "group" ? "/app/chat.sendGroup" : "/app/chat.send",
      body: JSON.stringify(chatMessage),
    });

    setMessageInput("");
  };

  const handleEmojiClick = (emojiData) => {
    setMessageInput((prev) => prev + emojiData.emoji);
  };

  // ✅ Header label logic
  let headerLabel;
  if (user?.type === "group") {
    headerLabel = user.name || "Group Chat";
  } else {
    headerLabel = user.displayname || user.username || `User ${user.id}`;
  }

  // ✅ Helpers
  const formatTime = (ts) => {
    if (!ts) return "";
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    const date = new Date(ts);
    return date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
  };

  // ✅ Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const dateKey = formatDate(msg.timestamp);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {});

  return (
    <div className="flex flex-col w-full max-w-[600px] h-[90vh] bg-black text-yellow-100 border border-yellow-700 rounded-xl shadow-lg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-yellow-700">
        <div className="flex items-center gap-2">
          <img
            src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${user?.username || "group"}`}
            alt={headerLabel}
            className="w-8 h-8 rounded-full object-cover"
          />
          <h2 className="font-semibold text-lg">{headerLabel}</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-yellow-400 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-2"></div>
              <p>Loading messages...</p>
            </div>
          </div>
        ) : (
          <>
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                {/* ✅ Date divider */}
                <div className="text-center text-yellow-400 text-sm mb-2">{date}</div>
                {msgs.map((msg, index) => {
                  const isSender =
                    msg?.senderId?.toString?.() === currentUser?.id?.toString?.();
                  return (
                    <div
                      key={index}
                      className={`flex w-full mb-2 ${isSender ? "justify-end" : "justify-start"
                        }`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${isSender
                          ? "bg-yellow-700 text-black"
                          : "bg-neutral-800 text-yellow-100"
                          }`}
                      >
                        {/* ✅ Show sender name in group chats */}
                        {user?.type === "group" && (
                          <p className="text-xs font-bold mb-1">
                            {msg.senderUsername || `User ${msg.senderId}`}
                          </p>
                        )}
                        <p>{msg?.content}</p>
                        {/* ✅ Show timestamp */}
                        <p className="text-xs text-yellow-400 mt-1 text-right">
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-yellow-500 text-sm text-center">
                No messages yet. Say hi!
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-t border-yellow-700 relative">
        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
          <FaRegSmile className="text-yellow-400 text-xl cursor-pointer" />
        </button>

        {showEmojiPicker && (
          <div className="absolute bottom-12 left-4 z-50">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}

        <input
          type="text"
          placeholder="Start a new message"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="flex-1 bg-transparent text-yellow-100 placeholder-yellow-400 focus:outline-none"
        />
        <button onClick={handleSend}>
          <FiSend className="text-yellow-400 text-xl cursor-pointer" />
        </button>
      </div>
    </div>
  );
}

export default ChatScreen;