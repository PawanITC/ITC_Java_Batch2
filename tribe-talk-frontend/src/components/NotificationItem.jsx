import { Heart, Repeat2 } from "lucide-react";
import { AtSign, Bell, MessageSquare, UserPlus } from "lucide-react";
import { notificationService } from "../services/notificationService";

const NotificationItem = ({ notification,onRead,onDelete }) => {

    const getIcon = () => {
        const iconClass= "w-8 h-8";
        switch (notification.type) {
            case "LIKE": return <Heart className={`${iconClass} text-red-500`} />;
            case "RETWEET" : return <Repeat2 className={`${iconClass} text-green-500`} />;
            case "REPLY" : return <MessageSquare className={`${iconClass} text-blue-500`} />;
            case "FOLLOW" : return <UserPlus className={`${iconClass} text-purple-500`} />;
            case "MENTION" : return <AtSign className={`${iconClass} text-yellow-500`} />;
            default: return <Bell className={`${iconClass} text-gray-500`} />;
        }
    };

    const handleInvite=() => {
        
    };

    const toggleRead=async (id) => {
      if(notification.readStatus) return;
      try{
        const updated= await notificationService.markAsRead(id);
        onRead(id);
      }
      catch(error){
        console.error("Error marking notification as read:",error);
      }

    };

    

    const formatTime=(datestring) => {
        const date=new Date(datestring);
        const now=new Date();
        const diffMs=now-date;
        const diffMins=Math.floor(diffMs/60000);
        
        if(diffMins<1) return "Just now";
        if(diffMins<60) return `${diffMins}m ago`;
        const diffHours=Math.floor(diffMins/60);
        if(diffHours<24) return `${diffHours}h ago`;
        const diffDays=Math.floor(diffHours/24);
        return `${diffDays}d ago`;

    };

    return (
        <div
              key={notification.id}
              className={`relative p-4 my-1 rounded-lg transition-all dark:bg-neutral-800 hover:bg-gray-700 cursor-pointer ${
                !notification.readStatus ? 'bg-gray-50' : ''
              }`}
              onClick={() => toggleRead(notification.id)}
            >
              <div className="flex gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    {notification.actorProfileImage && notification.actorProfileImage!=="" ? (
                      <img 
                        src={notification.actorProfileImage} 
                        alt={notification.actorUsername} 
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-yellow-800 to-yellow-500 flex items-center justify-center text-2xl">
                        {notification.actorUsername.charAt(0).toUpperCase()}
                      </div>
                  )}
                  {notification.type === 'like' && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">❤️</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1">
                      <span className="font-semibold text-white-900">@{notification.actorUsername}</span>
                      <span className="text-gray-600 ml-2">{notification.payload}</span>
                    </div>
                    {!notification.readStatus && (
                      <div className="w-2.5 h-2.5 bg-yellow-600 rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <span>{formatTime(notification.createdAt)}</span>
                  </div>

                  {notification.content && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 text-gray-700 text-sm sm:text-base">
                      {notification.content}
                    </div>
                  )}

                  {notification.type === 'invite' && (
                    <div className="flex gap-3 mt-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleInvite(notification.id, false)}
                        className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                      >
                        Ignore
                      </button>
                      <button
                        onClick={() => handleInvite(notification.id, true)}
                        className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                      >
                        Accept
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
    )};

    export default NotificationItem;

