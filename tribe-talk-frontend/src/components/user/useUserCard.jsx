import { useEffect, useState, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import { AuthContext } from "../../auth/AuthContext";

export default function useUserCard(targetUserId) {
  const { user } = useContext(AuthContext);
  const myUserId = user?.userId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetUserId || !myUserId) return;

    const fetchData = async () => {
      try {
        const [
          userRes,
          followersRes,
          followingRes,
          myFollowingRes,
        ] = await Promise.all([
          axiosInstance.get(`/api/users/${targetUserId}`),
          axiosInstance.get(`/api/users/${targetUserId}/followers-count`),
          axiosInstance.get(`/api/users/${targetUserId}/following-count`),
          axiosInstance.get(`/api/follow/following-list/${myUserId}`),
        ]);

        const isFollowing = myFollowingRes.data.some(
          (u) => u.id === targetUserId
        );

        setData({
          user: userRes.data,
          followers: followersRes.data,
          following: followingRes.data,
          isFollowing,
        });
      } catch (err) {
        console.error("Hover card failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [targetUserId, myUserId]);

  return { data, loading };
}
