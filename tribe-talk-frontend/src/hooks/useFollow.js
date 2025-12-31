import { useState, useContext } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../services/axiosInstance";
import { GlobalContext } from "../components/GlobalContext";
import { AuthContext } from "../auth/AuthContext";

export const useFollow = (initialUsers = []) => {
  const { setFollowingCount } = useContext(GlobalContext);
  const { user } = useContext(AuthContext);
  const userId = user?.userId;

  // Initialize following state from API data
  const [followingState, setFollowingState] = useState(() => {
    const map = {};
    initialUsers.forEach((u) => {
      map[u.id] = !!u.isFollowing; // true if already following
    });
    return map;
  });

  const toggleFollow = async (targetId) => {
    if (!userId) {
      toast.error("You must be logged in to follow users.");
      return;
    }

    const isFollowingNow = !!followingState[targetId];

    try {
      await axiosInstance({
        method: isFollowingNow ? "delete" : "post",
        url: isFollowingNow ? "/api/follow/unfollow-user" : "/api/follow/follow-user",
        data: { followerId: userId, followingId: targetId },
      });

      setFollowingState((prev) => ({ ...prev, [targetId]: !isFollowingNow }));

      // Update global count
      setFollowingCount((c) =>
        typeof c === "number"
          ? (isFollowingNow ? Math.max(0, c - 1) : c + 1)
          : 1
      );

      toast.success(!isFollowingNow ? "Followed!" : "Unfollowed!");
    } catch (err) {
      toast.error("Could not update follow status.");
    }
  };

  return { followingState, toggleFollow, setFollowingState };
};
