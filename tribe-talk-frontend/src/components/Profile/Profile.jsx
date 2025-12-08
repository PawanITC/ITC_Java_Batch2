import { useEffect, useState, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { AuthContext } from "../../auth/AuthContext";
import { GlobalContext } from "../GlobalContext";
import PostCard from "../Post/PostCard";
import { FiCalendar } from "react-icons/fi";

function Profile() {
  const { user } = useContext(AuthContext);
  const { followersCount, followingCount, setFollowersCount, setFollowingCount } = useContext(GlobalContext);
  const userId = user?.userId;

  const [userDetails, setUserDetails] = useState(null);
  const [originalPosts, setOriginalPosts] = useState([]);
  const [replyPosts, setReplyPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [openList, setOpenList] = useState(null); // "followers" | "following" | null
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [followingMap, setFollowingMap] = useState({});

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await axiosInstance.get(`/api/users/loggedUser`);
        setUserDetails(res.data);
      } catch {
        toast.warn("Error fetching user details");
      }
    };
    fetchUserDetails();
  }, []);

  // Fetch posts
  useEffect(() => {
    if (!userDetails?.id) return;
    const fetchPosts = async () => {
      try {
        const res = await axiosInstance.get(`/api/v1/posts/userPost?userId=${userDetails.id}`);
        const all = res.data;
        setOriginalPosts(all.filter((p) => !p.replyToPostId));
        setReplyPosts(all.filter((p) => p.replyToPostId));
      } catch {
        toast.warn("Failed to fetch posts");
      }
    };
    fetchPosts();
  }, [userDetails]);

  // Fetch liked posts
  useEffect(() => {
    if (!userDetails?.id) return;
    const fetchLikedPosts = async () => {
      try {
        const res = await axiosInstance.get(`/api/v1/posts/liked?userId=${userDetails.id}`);
        setLikedPosts(res.data);
      } catch {
        toast.warn("Failed to fetch liked posts");
      }
    };
    fetchLikedPosts();
  }, [userDetails]);

  // Fetch followers
  const fetchFollowersList = async () => {
    try {
      const res = await axiosInstance.get(`/api/follow/followers-list/${userId}`);
      setFollowersList(res.data);
      const map = {};
      res.data.forEach((u) => (map[u.id] = u.isFollowing || false));
      setFollowingMap((prev) => ({ ...prev, ...map }));
    } catch {
      toast.warn("Failed to fetch followers");
    }
  };

  // Fetch following
  const fetchFollowingList = async () => {
    try {
      const res = await axiosInstance.get(`/api/follow/following-list/${userId}`);
      setFollowingList(res.data);
      const map = {};
      res.data.forEach((u) => (map[u.id] = true));
      setFollowingMap((prev) => ({ ...prev, ...map }));
    } catch {
      toast.warn("Failed to fetch following");
    }
  };

  const handleShowFollowers = () => {
    setOpenList("followers");
    fetchFollowersList();
  };

  const handleShowFollowing = () => {
    setOpenList("following");
    fetchFollowingList();
  };

  const toggleFollow = async (targetId) => {
    const isFollowing = followingMap[targetId];
    const method = isFollowing ? "delete" : "post";
    const url = isFollowing ? "/api/follow/unfollow-user" : "/api/follow/follow-user";

    try {
      await axiosInstance({ method, url, data: { followerId: userId, followingId: targetId } });
      setFollowingMap((prev) => ({ ...prev, [targetId]: !isFollowing }));

      // Update counts and list
      if (isFollowing) {
        setFollowingCount((prev) => prev - 1);
        setFollowingList((prev) => prev.filter((u) => u.id !== targetId));
      } else {
        setFollowingCount((prev) => prev + 1);
      }

      toast.success(isFollowing ? "Unfollowed!" : "Followed!");
    } catch {
      toast.error("Failed to update follow status");
    }
  };

  const renderUserListModal = () => {
    const list = openList === "followers" ? followersList : followingList;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-end">
        <div className="w-full max-w-md bg-neutral-800 border border-yellow-700 rounded-t-2xl p-6 animate-slideUp shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{openList === "followers" ? "Followers" : "Following"}</h2>
            <button onClick={() => setOpenList(null)} className="text-yellow-400 text-sm">Close</button>
          </div>
          {list.length === 0 ? (
            <p className="text-yellow-400">No users found</p>
          ) : (
            list.map((u) => (
              <div key={u.id} className="flex justify-between items-center py-3 border-b border-yellow-700/40">
                <div>
                  <p className="font-semibold">{u.displayname}</p>
                  <p className="text-yellow-400">@{u.username}</p>
                </div>
                <button
                  onClick={() => toggleFollow(u.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    followingMap[u.id]
                      ? "bg-neutral-700 text-yellow-400 border border-yellow-500"
                      : "bg-yellow-500 text-neutral-900 hover:bg-yellow-400"
                  }`}
                >
                  {followingMap[u.id] ? "Following" : "Follow"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderPostsTab = () => {
    const data = activeTab === "posts" ? originalPosts : activeTab === "replies" ? replyPosts : likedPosts;
    if (data.length === 0) return <p className="text-yellow-400">No {activeTab} found</p>;
    return data.map((p) => <PostCard key={p._id} post={p} />);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 text-yellow-100">
      {openList && renderUserListModal()}

      {/* Cover & Avatar */}
      <div className="relative h-40 rounded-md overflow-hidden mb-20">
        <img src="https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&q=80&w=1200" alt="Cover" className="w-full h-full object-cover" />
      </div>
      <div className="relative flex items-center gap-4 -mt-28 mb-6 px-2">
        <img src="https://images.unsplash.com/photo-1536164261511-3a17e671d380?auto=format&fit=crop&q=80&w=682" alt="Avatar" className="w-24 h-24 rounded-full border-4 border-neutral-900 object-cover" />
      </div>

      {/* User Info */}
      <div className="mb-2 px-2">
        <h2 className="text-xl font-bold">{userDetails?.displayname}</h2>
        <p className="text-yellow-400 text-sm">@{userDetails?.username}</p>
      </div>

      <div className="flex items-center gap-2 text-sm text-yellow-100 mb-4 px-2">
        <FiCalendar />
        <span>Joined October 2025</span>
      </div>

      {/* Counts */}
      <div className="flex gap-6 text-sm text-yellow-200 mb-6 px-2">
        <button onClick={handleShowFollowing}>
          <strong className="text-yellow-100">{followingCount}</strong> Following
        </button>
        <button onClick={handleShowFollowers}>
          <strong className="text-yellow-100">{followersCount}</strong> Followers
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-yellow-800 px-2 mb-4">
        {["posts", "replies", "likes"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 font-semibold capitalize ${
              activeTab === tab ? "border-b-2 border-yellow-400 text-yellow-100" : "text-yellow-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4 px-2">{renderPostsTab()}</div>
    </div>
  );
}

export default Profile;
