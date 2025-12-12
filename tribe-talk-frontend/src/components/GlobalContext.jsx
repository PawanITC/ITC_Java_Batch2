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

  //  GLOBAL POST MODAL STATE
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [replyContext, setReplyContext] = useState({
    replyToPostId: null,
    prefillText: ""
  });

  //  Open normal post modal
  const openPostModal = () => {
    setReplyContext({ replyToPostId: null, prefillText: "" });
    setIsPostModalOpen(true);
  };

  //  Open reply modal
  const openReplyModal = ({ replyToPostId, prefillText }) => {
    setReplyContext({ replyToPostId, prefillText });
    setIsPostModalOpen(true);
  };

  //  Close modal
  const closePostModal = () => {
    setIsPostModalOpen(false);
    setReplyContext({ replyToPostId: null, prefillText: "" });
  };

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
        const followersRes = await axiosInstance.get(`/users/${userId}/followers-count`);
        const followingRes = await axiosInstance.get(`/users/${userId}/following-count`);
        setFollowersCount(followersRes.data);
        setFollowingCount(followingRes.data);
        console.log("Following Count = ", followingCount);
        console.log("Followers Count = ", followersCount);
      } catch (err) {
        console.error(" Error fetching follow counts from Global Context " + err);
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
        setFollowingCount,


        //  Global Post Modal
        isPostModalOpen,
        openPostModal,
        openReplyModal,
        closePostModal,
        replyContext,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
