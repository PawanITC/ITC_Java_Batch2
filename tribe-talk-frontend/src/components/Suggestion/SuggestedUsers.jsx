import { useEffect, useState, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { GlobalContext } from "../GlobalContext";
import { AuthContext } from "../../auth/AuthContext";


function SuggestedUsers() {
  const [users, setUsers] = useState([]);
  const [following, setFollowing] = useState({});
  //   const [currentUser, setCurrentUser] = useState(null);
  const { followingCount, setFollowingCount } = useContext(GlobalContext);
  const { user } = useContext(AuthContext);

  const userId = user?.userId;


  const { setFollowEvent } = useContext(GlobalContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // const userRes = await axiosInstance.get("/api/users/loggedUser");
        // const loggedUser = userRes.data;
        // setCurrentUser(loggedUser);

        const suggestedRes = await axiosInstance.get(`/users/suggested-users/${userId}`);
        const suggestedUsers = suggestedRes.data;
        setUsers(suggestedUsers);

        // Initialize local following state
        const initialFollowing = {};
        suggestedUsers.forEach((user) => {
          initialFollowing[userId] = user.isFollowing || false; // assumes API provides this
        });
        setFollowing(initialFollowing);
      } catch (error) {
        toast.error("Failed to load suggested users.");
      }
    };

    fetchData();
  }, []);

  const toggleFollow = async (followingUserId) => {
    if (!followingUserId) {
      toast.error("User not loaded yet.");
      return;
    }
    console.log("Following is ", following);
    let isFollowing = following[followingUserId] | false;
    const url = isFollowing
      ? `/follow/unfollow-user`
      : `/follow/follow-user`;
    const method = isFollowing ? "delete" : "post";

    try {

      await axiosInstance({
        method,
        url,
        data: { followerId: userId, followingId: followingUserId },
      });
      //   // Fire global follow event
      //   setFollowEvent({
      //     followerId: currentUser.id,
      //     followingId: userId,
      //     action: isFollowing ? "UNFOLLOW" : "FOLLOW",
      //     timestamp: Date.now(),
      //   });

      // Update local button state instantly

      setFollowing((prev) => ({ ...prev, [followingUserId]: !isFollowing }));
      isFollowing = following[followingUserId];
      console.log("isFollowing", isFollowing);
      if (!isFollowing) {
        console.log("you pressed follow ")
        console.log("isFollowing", isFollowing);
        setFollowingCount(prev => prev + 1);
      }
      else setFollowingCount(prev => prev - 1);

      toast.success(isFollowing ? "Unfollowed!" : "Followed!");
    } catch (error) {
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
              <p className="font-semibold text-yellow-100">{user.displayname}</p>
              <p className="text-sm text-yellow-400">@{user.username}</p>
            </div>
            <button
              onClick={() => toggleFollow(user.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${following[user.id]
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
