import { useEffect, useState, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { AuthContext } from "../../auth/AuthContext";
import { GlobalContext } from "../GlobalContext";
import PostCard from "../Post/PostCard";
import { FiCalendar } from "react-icons/fi";

function Profile() {
  const [activeTab, setActiveTab] = useState("posts"); // posts | replies | likes
  const [originalPosts, setOriginalPosts] = useState([]);
  const [replyPosts, setReplyPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [userDetails, setUserDetails] = useState(null);

  const { user } = useContext(AuthContext);
  const { followersCount, followingCount, setFollowersCount, setFollowingCount } = useContext(GlobalContext);

  const userId = user?.userId;
  const [showFollowersSection, setShowFollowersSection] = useState(false);
  const [showFollowingSection, setShowFollowingSection] = useState(false);

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await axiosInstance.get(`/api/users/loggedUser`);
        setUserDetails(res.data);
      } catch (err) {
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
        const allPosts = res.data;
        setOriginalPosts(allPosts.filter(post => post.replyToPostId === null));
        setReplyPosts(allPosts.filter(post => post.replyToPostId !== null));
      } catch (err) {
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
      } catch (err) {
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
    } catch (err) {
      toast.warn("Failed to fetch followers");
    }
  };

  // Fetch following
  const fetchFollowingList = async () => {
    try {
      const res = await axiosInstance.get(`/api/follow/following-list/${userId}`);
      setFollowingList(res.data);
    } catch (err) {
      toast.warn("Failed to fetch following");
    }
  };

  // Handle showing followers section
  const handleShowFollowers = () => {
    setShowFollowersSection(true);
    setShowFollowingSection(false);
    fetchFollowersList();
  };

  // Handle showing following section
  const handleShowFollowing = () => {
    setShowFollowingSection(true);
    setShowFollowersSection(false);
    fetchFollowingList();
  };

  // Follow/Unfollow user
  const handleFollowToggle = async (targetUserId, isFollowing) => {
    try {
      if (isFollowing) {
        await axiosInstance.delete(`/api/follow/unfollow-user`, { data: { followerId: userId, followingId: targetUserId } });
      } else {
        await axiosInstance.post(`/api/follow/follow-user`, { followerId: userId, followingId: targetUserId });
      }
      // Refresh lists and counts
      fetchFollowersList();
      fetchFollowingList();
    } catch (err) {
      toast.error("Failed to update follow status");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 text-yellow-100">
      {/* Cover */}
      <div className="relative h-40 rounded-md overflow-hidden mb-20">
        <img
          src="https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&q=80&w=1200"
          alt="Cover"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Avatar */}
      <div className="relative flex items-center gap-4 -mt-28 mb-6 px-2">
        <img
          src="https://images.unsplash.com/photo-1536164261511-3a17e671d380?auto=format&fit=crop&q=80&w=682"
          alt="User Avatar"
          className="w-24 h-24 rounded-full border-4 border-neutral-900 object-cover"
        />
        <div className="ml-auto mt-6">
          <button className="px-4 py-2 bg-yellow-500 text-neutral-900 font-semibold rounded-full hover:bg-yellow-400 transition">
            Set up profile
          </button>
        </div>
      </div>

      {/* Username */}
      <div className="mb-2 px-2">
        <h2 className="text-xl font-bold">{userDetails?.displayname}</h2>
        <p className="text-yellow-400 text-sm">@{userDetails?.username}</p>
      </div>

      {/* Join date */}
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

      {/* Tabs for posts/replies/likes */}
      <div className="flex gap-6 border-b border-yellow-800 px-2 mb-4">
        {["posts", "replies", "likes"].map(tab => (
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

      {/* CONTENT SECTION */}
      <div className="space-y-4 px-2">
        {/* POSTS */}
        {activeTab === "posts" &&
          (originalPosts.length > 0 ? (
            originalPosts.map(post => <PostCard key={post._id} post={post} />)
          ) : (
            <p className="text-yellow-400">No posts found</p>
          ))}

        {/* REPLIES */}
        {activeTab === "replies" &&
          (replyPosts.length > 0 ? (
            replyPosts.map(post => <PostCard key={post._id} post={post} />)
          ) : (
            <p className="text-yellow-400">No replies found</p>
          ))}

        {/* LIKES */}
        {activeTab === "likes" &&
          (likedPosts.length > 0 ? (
            likedPosts.map(post => <PostCard key={post._id} post={post} />)
          ) : (
            <p className="text-yellow-400">No liked posts</p>
          ))}

        {/* FOLLOWERS LIST */}
        {showFollowersSection &&
          (followersList.length > 0 ? (
            followersList.map(f => (
              <div key={f.id} className="flex justify-between items-center p-2 border-b border-yellow-800">
                <div>
                  <span className="font-semibold">{f.displayname}</span>
                  <span className="text-yellow-400 ml-2">@{f.username}</span>
                </div>
                <button
                  onClick={() => handleFollowToggle(f.id, true)}
                  className="px-3 py-1 bg-yellow-500 text-neutral-900 rounded-full hover:bg-yellow-400"
                >
                  Unfollow
                </button>
              </div>
            ))
          ) : (
            <p className="text-yellow-400">No followers yet</p>
          ))}

        {/* FOLLOWING LIST */}
        {showFollowingSection &&
          (followingList.length > 0 ? (
            followingList.map(f => (
              <div key={f.id} className="flex justify-between items-center p-2 border-b border-yellow-800">
                <div>
                  <span className="font-semibold">{f.displayname}</span>
                  <span className="text-yellow-400 ml-2">@{f.username}</span>
                </div>
                <button
                  onClick={() => handleFollowToggle(f.id, true)}
                  className="px-3 py-1 bg-yellow-500 text-neutral-900 rounded-full hover:bg-yellow-400"
                >
                  Unfollow
                </button>
              </div>
            ))
          ) : (
            <p className="text-yellow-400">Not following anyone</p>
          ))}
      </div>
    </div>
  );
}

export default Profile;
