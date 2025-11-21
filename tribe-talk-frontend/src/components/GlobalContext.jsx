import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { notificationService } from "../services/notificationService";
import { AuthContext } from "../auth/AuthContext";
import { useNotificationWebSocket } from "../services/useWebSocket";

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const { user } = useContext(AuthContext) || {};

  // Notifications
  const [unReadNotificationCount, setUnReadNotificationCount] = useState(0);
  const [liveNotifications, setLiveNotifications] = useState([]);

  // Real-time follow system
  const [followEvent, setFollowEvent] = useState(null);

  const handleNewNotification = useCallback((notification) => {
    setUnReadNotificationCount((prev) => prev + 1);
    setLiveNotifications((prev) => [notification, ...prev]);
  }, []);

  const isConnected = useNotificationWebSocket(user?.userId, handleNewNotification);

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

        // Real-time follow
        followEvent,
        setFollowEvent,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
