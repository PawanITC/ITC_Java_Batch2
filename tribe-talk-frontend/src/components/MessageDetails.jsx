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
            const res = await axiosInstance.get(`/api/chat/conversations/user/${currentUser.id}`);
            setGroupedChats(res.data);
            console.log("Grouped chats:", res.data);
        } catch (err) {
            console.error("Error fetching grouped chats", err);
        }
    };

    //First time rendring of of all the chats by default
    useEffect(() => {
        if (currentUser) {
            handleFetchGroupedChats();
        }
    }, [currentUser]);

    const handleFetchUnreadChats = async () => {
        if (!currentUser) return;
        try {
            const res = await axiosInstance.get(`/api/chat/conversations/unread/${currentUser.id}`);
            setGroupedChats(res.data);
            console.log("Unread chats:", res.data);
        } catch (err) {
            console.error("Error fetching unread chats", err);
        }
    };




    return (
        <div className="max-w-2xl mx-auto px-4 py-6 text-gray-900 dark:text-yellow-100 relative">
            <h1 className="text-xl font-bold mb-4">Messages</h1>

            {/* Search bar */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-800 border border-yellow-700 rounded-full px-4 py-2 mb-4">
                <FiSearch className="text-yellow-400 dark:text-gray-600 text-lg" />
                <input
                    type="text"
                    placeholder="Search people to message"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent w-full text-gray-900 dark:text-yellow-100 placeholder-yellow-400 focus:outline-none"
                />
            </div>
            <div className="flex gap-3 mb-4">
                <button
                    onClick={handleFetchGroupedChats}
                    className="px-4 py-2 rounded-lg border border-yellow-700 text-gray-900 dark:text-yellow-100 bg-white dark:bg-neutral-900 hover:bg-gray-100 dark:bg-neutral-800 transition"
                >
                    All
                </button>


                <button
                    onClick={handleFetchUnreadChats}
                    className="px-4 py-2 rounded-lg border border-yellow-700 text-gray-900 dark:text-yellow-100 bg-white dark:bg-neutral-900 hover:bg-gray-100 dark:bg-neutral-800 transition"
                >
                    Unread
                </button>



                <button className="px-4 py-2 rounded-lg border border-yellow-700 text-gray-900 dark:text-yellow-100 bg-white dark:bg-neutral-900 hover:bg-gray-100 dark:bg-neutral-800 transition">
                    Groups
                </button>
            </div>
            <div>

            </div>


            {Object.entries(groupedChats).length === 0 ? (
                // Show all users if no conversations exist
                <div>
                    <p className="text-yellow-400 dark:text-gray-600 text-sm mb-4">No conversations yet. Start chatting with someone!</p>
                    {users
                        .filter(u => u.id !== currentUser?.userId) // Don't show current user
                        .filter(u => !searchQuery || u.displayname?.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(user => (
                            <button
                                key={user.id}
                                onClick={() => setSelectedUser(user)}
                                className="w-full text-left bg-gray-100 dark:bg-neutral-800 p-4 rounded-md border border-yellow-700/40 mb-2 hover:bg-yellow-700/10 transition"
                            >
                                <p className="text-gray-900 dark:text-yellow-100 font-semibold">
                                    {user.displayname}
                                </p>
                                <p className="text-yellow-400 dark:text-gray-600 text-sm">
                                    @{user.username}
                                </p>
                            </button>
                        ))
                    }
                </div>
            ) : (
                // Show existing conversations
                Object.entries(groupedChats)
                    .filter(([roomId, messages]) => {
                        const lastMessage = messages[0];
                        const otherUserId = Number(lastMessage.senderId) === currentUser.id
                            ? lastMessage.receiverId
                            : lastMessage.senderId;

                        const otherUser = users.find(u => u.id === Number(otherUserId));


                        return (
                            !searchQuery ||
                            (otherUser?.displayname || "").toLowerCase().includes(searchQuery.toLowerCase())
                        );
                    })

                    .map(([roomId, messages]) => {
                        const lastMessage = messages[0];
                        const otherUserId = Number(lastMessage.senderId) === currentUser.id
                            ? lastMessage.receiverId
                            : lastMessage.senderId;

                        const otherUser = users.find(u => u.id === Number(otherUserId));

                        return (
                            <button
                                key={roomId}
                                onClick={() => setSelectedUser(otherUser)}
                                className="w-full text-left bg-gray-100 dark:bg-neutral-800 p-4 rounded-md border border-yellow-700/40 mb-2 hover:bg-yellow-700/10 transition"
                            >
                                <p className="text-gray-900 dark:text-yellow-100 font-semibold">
                                    Chat with {otherUser?.displayname || `User ${otherUserId}`}
                                </p>
                                <p className="text-yellow-400 dark:text-gray-600 text-sm flex items-center gap-2">
                                    Last message: {lastMessage.content}
                                    {!lastMessage.isRead && lastMessage.receiverId === currentUser.id && (
                                        <span className="text-yellow-500 text-xs font-bold ml-2">● Unread</span>
                                    )}
                                </p>

                            </button>
                        );
                    })
            )}


        </div>
    );
}

export default MessageDetails;
