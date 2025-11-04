import { useState } from "react";
import { FiImage, FiSend } from "react-icons/fi";
import { FaRegSmile } from "react-icons/fa";

function ChatScreen({ user }) {
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, sender: "them", text: "Hey there!" },
    { id: 2, sender: "me", text: "Hi! How are you?" },
  ]);

  const handleSend = () => {
    if (messageInput.trim()) {
      setMessages([
        ...messages,
        { id: Date.now(), sender: "me", text: messageInput },
      ]);
      setMessageInput("");
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md h-[90vh] bg-black text-yellow-100 rounded-lg border border-yellow-700 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-yellow-700">
        <div className="flex items-center gap-2">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover"
          />
          <h2 className="font-semibold text-lg">{user.name}</h2>
        </div>
        <span className="text-yellow-400 text-sm">🌻</span>
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-xs px-4 py-2 rounded-lg ${
              msg.sender === "me"
                ? "bg-yellow-700 text-black self-end"
                : "bg-neutral-800 text-yellow-100 self-start"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-yellow-700">
        <FiImage className="text-yellow-400 text-xl cursor-pointer" />
        <FaRegSmile className="text-yellow-400 text-xl cursor-pointer" />
        <input
          type="text"
          placeholder="Start a new message"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
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
