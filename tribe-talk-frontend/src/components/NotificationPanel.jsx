import { Bell, Check, CheckCheck, RefreshCcw, RefreshCcwDot, X } from "lucide-react";
import { use, useCallback, useContext, useEffect, useState } from "react";
import { notificationService } from "../services/notificationService";
import NotificationItem from "./NotificationItem";
import { GlobalContext } from "./GlobalContext";

const Tabs = ["all", "like", "retweet", "reply", "follow", "mention"];

const NotificationPanel = ({ userId }) => {
    const [notifications, setNotifications] = useState({
        all: [],
        like: [],
        retweet: [],
        reply: [],
        follow: [],
        mention: []
    });

    const [page, setPage] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [size, setSize] = useState(10);
    const [hasMore, setHasMore] = useState(true);
    const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
    const { unReadNotificationCount, setUnReadNotificationCount, liveNotifications, setLiveNotifications } = useContext(GlobalContext);
    const [activeTab, setActiveTab] = useState("all");

    useEffect(() => {
        // Prepend live notifications to the list
        if (liveNotifications.length > 0) {

            const firstNotification = liveNotifications[0];
            const type = firstNotification.type?.toLowerCase();

            setNotifications(prev => ({
                ...prev,
                all: [firstNotification, ...prev.all],
                like: type === "like" ? [firstNotification, ...prev.like] : prev.like,
                retweet: type === "retweet" ? [firstNotification, ...prev.retweet] : prev.retweet,
                reply: type === "reply" ? [firstNotification, ...prev.reply] : prev.reply,
                follow: type === "follow" ? [firstNotification, ...prev.follow] : prev.follow,
                mention: type === "mention" ? [firstNotification, ...prev.mention] : prev.mention,
            }));

            setLiveNotifications(prev => prev.slice(1));
        }
    }, [liveNotifications]);


    useEffect(() => {
        if (userId) {

            setNotifications({
                all: [],
                like: [],
                retweet: [],
                reply: [],
                follow: [],
                mention: []
            });

            setPage(-1);
            setHasMore(true);
            fetchUnReadCount();

            //Request notification permission on component mount
            if (Notification.permission === "default") {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        console.log("Notification permission granted.");
                    }
                });
            }
        }


    }, [userId]);

    useEffect(() => {
        if (page === -1) {
            setPage(0);
            return;
        }
        fetchNotifications();
    }, [page]);

    const fetchNotifications = async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        try {
            const data = await notificationService.fetchNotifications(userId, page, size);
            const categorized = {
                all: [],
                like: [],
                retweet: [],
                reply: [],
                follow: [],
                mention: []
            };

            data.content.forEach(notification => {
                const type = notification.type?.toLowerCase();
                const category = ["like", "retweet", "reply", "follow", "mention"].includes(type) ? type : "all";
                categorized.all.push(notification);
                if (category !== "all") {
                    categorized[category].push(notification);
                }

            });

            // Merge with existing notifications if not first page
            setNotifications(prev => ({
                all: page === 0 ? categorized.all : [...prev.all, ...categorized.all],
                like: page === 0 ? categorized.like : [...prev.like, ...categorized.like],
                retweet: page === 0 ? categorized.retweet : [...prev.retweet, ...categorized.retweet],
                reply: page === 0 ? categorized.reply : [...prev.reply, ...categorized.reply],
                follow: page === 0 ? categorized.follow : [...prev.follow, ...categorized.follow],
                mention: page === 0 ? categorized.mention : [...prev.mention, ...categorized.mention]
            }));


            setHasMore(!data.last);
            //setPage(page);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUnReadCount = async () => {
        try {
            const count = await notificationService.fetchUnReadCount(userId);
            setUnReadNotificationCount(count);
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    };

    const loadMore = () => {
        if (!isLoading && hasMore) {
            setPage(prev => prev + 1);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        setNotifications(prev => {
            const updated = {};

            Object.keys(prev).forEach(key => {
                updated[key] = prev[key].map(item =>
                    item.id === notificationId
                        ? { ...item, readStatus: true }
                        : item
                );
            });

            return updated;
        });

        setUnReadNotificationCount(prev => Math.max(prev - 1, 0));
    };

    const handleMarkAllAsRead = async () => {
        try {
            setIsMarkingAllRead(true);
            await notificationService.markAllAsRead(userId);
            setNotifications(prev => {
                const updated = {};
                Object.keys(prev).forEach(key => {
                    updated[key] = prev[key].map(n => ({ ...n, readStatus: true }));
                });
                return updated;
            });
            setUnReadNotificationCount(0);
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        } finally {
            setIsMarkingAllRead(false);
        }
    };
    return (
        <>
            <div className="max-w-2xl mx-auto px-4 py-6 text-gray-900 dark:text-yellow-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Notifications</h2>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleMarkAllAsRead}
                            disabled={isMarkingAllRead}
                            className="flex items-center gap-2 cursor-pointer text-yellow-400 dark:text-gray-600 hover:text-yellow-900 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isMarkingAllRead ? (
                                <RefreshCcw size={20} className="animate-spin" />
                            ) : (
                                <CheckCheck size={20} />
                            )}
                            <span className="hidden sm:inline">
                                {isMarkingAllRead ? "Marking..." : "Mark all as read"}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 border-b border-yellow-700 mb-4">
                    {Tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-2 font-semibold capitalize cursor-pointer ${activeTab === tab ? "border-b-2 border-yellow-400 text-yellow-100" : "text-yellow-400 "}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div>
                    {notifications[activeTab].length === 0 ? (
                        <div className="text-center py-12  text-gray-500">
                            <Bell size={48} className="mx-auto mb-4" />
                            <p className="text-lg">No notifications to show.</p>
                        </div>
                    ) : (
                        notifications[activeTab].map(notification => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onRead={handleMarkAsRead}
                            />
                        ))
                    )}
                </div>

                {hasMore && (
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={loadMore}
                            className="px-4 py-2 bg-yellow-500 text-neutral-900 cursor-pointer rounded-full hover:bg-yellow-700 transition"
                            disabled={isLoading}
                        >
                            <RefreshCcwDot className={`inline-block mr-2 ${isLoading ? "animate-spin" : ""}`} size={16} />
                            <span className="hidden md:inline">{isLoading ? "Loading..." : "Load More"}</span>
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}



export default NotificationPanel;
