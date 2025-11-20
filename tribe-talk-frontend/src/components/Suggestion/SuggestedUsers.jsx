import { useEffect, useState } from "react";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";

function SuggestedUsers() {
    const [users, setUsers] = useState([]);
    const [following, setFollowing] = useState({});
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // ✅ Step 1: Get the logged-in user
                const userRes = await axiosInstance.get("/api/users/loggedUser");
                const loggedUser = userRes.data;
                setCurrentUser(loggedUser);

                console.log("Logged User:", loggedUser.displayname, "(ID:", loggedUser.id, ")");

                // ✅ Step 2: Get suggested users using the logged user's ID
                const suggestedRes = await axiosInstance.get(
                    `/api/users/suggested-users/${loggedUser.id}`
                );
                setUsers(suggestedRes.data);
                console.log("Suggested Users Loaded:", suggestedRes.data.length);
            } catch (error) {
                console.error("Error fetching data:", error);
                const message =
                    error?.response?.data?.message || "Failed to load suggested users.";
                toast.error(message);
            }
        };

        fetchData();
    }, []); // Only run once when component mounts

    const toggleFollow = async (userId) => {
        if (!currentUser) {
            toast.error("User not loaded yet.");
            return;
        }

        const isFollowing = following[userId];
        const url = isFollowing
            ? `/api/follow/unfollow-user`
            : `/api/follow/follow-user`;
        const method = isFollowing ? "delete" : "post";

        try {
            console.log(
                `${isFollowing ? "Unfollowing" : "Following"} user ${userId} by ${
                    currentUser.id
                }`
            );

            await axiosInstance({
                method,
                url,
                data: { followerId: currentUser.id, followingId: userId },
            });

            // ✅ Update UI instantly
            setFollowing((prev) => ({
                ...prev,
                [userId]: !isFollowing,
            }));

            toast.success(
                isFollowing
                    ? "Unfollowed successfully!"
                    : "Followed successfully!"
            );
        } catch (error) {
            console.error("Error toggling follow:", error);
            toast.error("Could not update follow status.");
        }
    };

    return (
        <div className="bg-neutral-800 border border-yellow-700/40 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-4">You Might Like</h2>
            <ul className="space-y-4">
                {users.length === 0 && (
                    <p className="text-yellow-400 text-sm">No users to suggest.</p>
                )}
                {users.map((user) => (
                    <li key={user.id} className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-yellow-100">
                                {user.displayname}
                            </p>
                            <p className="text-sm text-yellow-400">@{user.username}</p>
                        </div>
                        <button
                            onClick={() => toggleFollow(user.id)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                                following[user.id]
                                    ? "bg-neutral-700 text-yellow-400 border border-yellow-400"
                                    : "bg-yellow-500 text-neutral-900 hover:bg-yellow-400"
                            }`}
                        >
                            {following[user.id] ? "Following" : "Follow"}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default SuggestedUsers;
