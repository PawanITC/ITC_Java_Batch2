import { createContext, use, useCallback, useContext, useEffect, useState } from "react";
import { notificationService } from "../services/notificationService";
import { AuthContext } from "../auth/AuthContext";
import { useNotificationWebSocket } from "../services/useWebSocket";

export const GlobalContext = createContext();

export const GlobalProvider = ({children}) => {
    const [unReadNotificationCount, setUnReadNotificationCount] = useState(0);
    const {user, setUser} = useContext(AuthContext) || {};
    const [liveNotifications,setLiveNotifications]=useState([]);

    const handleNewNotification=useCallback((notification)=>{
        setUnReadNotificationCount(prev=>prev+1);
        setLiveNotifications(prev=>[notification,...prev]);
    }, []);
    

    const isConnected=useNotificationWebSocket(user?.userId,handleNewNotification);

    useEffect(() => {
        if (!user?.userId) return;
        notificationService.fetchUnReadCount(user?.userId).then((count) => {
            setUnReadNotificationCount(count);
        }).catch((error) => {
            console.error("Error fetching unread notification count:", error);
        });
    }, [user]);
    return (
        <GlobalContext.Provider value={{unReadNotificationCount,setUnReadNotificationCount,liveNotifications,setLiveNotifications}}>{children}</GlobalContext.Provider>
    )
};
