import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { notificationService } from "../services/notificationService";
import { AuthContext } from "../auth/AuthContext";
import { useNotificationWebSocket } from "../services/useWebSocket";
import axiosInstance from "../services/axiosInstance";


export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const { user } = useContext(AuthContext) || {};
  

  // Notifications
  const [unReadNotificationCount, setUnReadNotificationCount] = useState(0);
 
  const [liveNotifications, setLiveNotifications] = useState([]);
   const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
 const userId = user?.userId;

//   // Real-time follow system
//   const [followEvent, setFollowEvent] = useState(null);

  const handleNewNotification = useCallback((notification) => {
    setUnReadNotificationCount((prev) => prev + 1);
    setLiveNotifications((prev) => [notification, ...prev]);
  }, []);

  const isConnected = useNotificationWebSocket(user?.userId, handleNewNotification);

  // Fetch initial counts once on mount
 useEffect(() => {
  if (!userId) return;

  const fetchCounts = async () => {
    try {
      const followersRes = await axiosInstance.get(`/api/users/${userId}/followers-count`);
      const followingRes = await axiosInstance.get(`/api/users/${userId}/following-count`);
      setFollowersCount(followersRes.data);
      setFollowingCount(followingRes.data);
      console.log("Following Count = ",followingCount);
      console.log("Followers Count = ",followersCount);
    } catch (err) {
      console.error(" Error fetching follow counts from Global Context "+err);
    }
  };

  fetchCounts();
}, [userId]);


  // Fetch unread notifications on mount
  useEffect(() => {
    if (!user?.userId) return;

    notificationService
      .fetchUnReadCount(user.userId)
      .then(setUnReadNotificationCount)
      .catch((err) =>
        console.error("Error fetching unread notification count:", err)
      );
  }, [user]);


  return (
    <GlobalContext.Provider
      value={{
        // Notifications
        unReadNotificationCount,
        setUnReadNotificationCount,
        liveNotifications,
        setLiveNotifications,

        // // Real-time follow
        // followEvent,
        // setFollowEvent,

        followersCount,
        setFollowersCount,
        followingCount,
        setFollowingCount
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
