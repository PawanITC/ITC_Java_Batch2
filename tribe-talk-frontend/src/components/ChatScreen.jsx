import { useEffect, useState } from "react";
import { FiImage, FiSend } from "react-icons/fi";
import { FaRegSmile } from "react-icons/fa";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";

/**
 * ChatScreen component
 * ---------------------
 * Props:
 *  - user: the selected person you are chatting with
 *  - currentUserId: id of the logged-in user
 *  - stompClient: shared websocket connection (passed from parent)
 */
function ChatScreen({ user, currentUser, stompClient }) {
    const [messageInput, setMessageInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const roomId =
        currentUser.id < user.id
            ? `${currentUser.id}_${user.id}`
            : `${user.id}_${currentUser.id}`;

    // Load previous messages when chat opens or roomId changes
    useEffect(() => {
        if (!roomId) return;

        // Fetch messages from backend
        fetch(`http://localhost:8081/api/chat/messages/${roomId}`)
            .then((res) => res.json())
            .then((data) => setMessages(data))
            .catch((err) => console.error("Error fetching messages:", err));
    }, [roomId]);

    useEffect(() => {
        if (!stompClient || !roomId) return;

        const subscription = stompClient.subscribe(`/topic/chat/${roomId}`, (msg) => {
            const newMessage = JSON.parse(msg.body);
            setMessages((prev) => [...prev, newMessage]);
            const markAsRead = async () => {
                if (Number(newMessage.receiverId) === currentUser.id && !newMessage.isRead) {
                try {
                    await axios.put("http://localhost:8081/api/chat/mark-as-read", {
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
    }, [stompClient, roomId]);

    const handleSend = () => {
        if (!messageInput.trim() || !stompClient) return;

        const chatMessage = {
            senderId: currentUser.id,
            receiverId: user.id,
            content: messageInput,
            chatRoomId: roomId,
            senderUsername:currentUser.displayname,
            isRead:false
        };

        stompClient.publish({
            destination: "/app/chat.send",
            body: JSON.stringify(chatMessage),
        });

        setMessageInput("");
    };

    useEffect(() => {
        const markMessagesAsRead = async () => {
            try {
            await axios.put(`http://localhost:8081/api/chat/mark-as-read`, {
                senderId: user.id,
                receiverId: currentUser.id,
            });
            console.log("Marked messages as read");
            } catch (err) {
            console.error("Failed to mark messages as read", err);
            }
        };

        if (user && currentUser) {
            markMessagesAsRead();
        }
        }, [user, currentUser]);

        const handleEmojiClick = (emojiData) => {
        setMessageInput((prev) => prev + emojiData.emoji);
        };

    return (
            <div className="flex flex-col w-full max-w-[600px] h-[90vh] bg-black text-yellow-100 border border-yellow-700 rounded-xl shadow-lg">
                <div className="flex items-center justify-between px-4 py-3 border-b border-yellow-700">
                <div className="flex items-center gap-2">
                    <img
                        src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${user.username}`}
                        alt={user.displayname}
                        className="w-8 h-8 rounded-full object-cover"
                    />
                    <h2 className="font-semibold text-lg">{user.displayname}</h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 flex flex-col">
               {Array.isArray(messages) && messages.length > 0 ? (
                messages.map((msg, index) => {
                    const isSender = msg?.senderId?.toString?.() === currentUser?.id?.toString?.();
                    return (
                    <div
                        key={index}
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                        isSender
                            ? "bg-yellow-700 text-black self-end"
                            : "bg-neutral-800 text-yellow-100 self-start"
                        }`}
                    >
                        {msg?.content}
                    </div>
                    );
                })
                ) : (
                <p className="text-yellow-500 text-sm text-center">No messages yet. Say hi!</p>
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
