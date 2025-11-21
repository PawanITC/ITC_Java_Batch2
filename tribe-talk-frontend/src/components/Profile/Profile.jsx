import { useEffect, useState, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { AuthContext } from "../../auth/AuthContext";
import { GlobalContext } from "../GlobalContext";
import PostCard from "../Post/PostCard";
import { FiCalendar } from "react-icons/fi";

function Profile() {
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const { user } = useContext(AuthContext);
  const { followEvent } = useContext(GlobalContext);

  const userId = user?.userId;

  // Fetch initial counts once on mount
 useEffect(() => {
  if (!userId) return;

  const fetchCounts = async () => {
    try {
      const followersRes = await axiosInstance.get(`/api/users/${userId}/followers-count`);
      const followingRes = await axiosInstance.get(`/api/users/${userId}/following-count`);
      setFollowersCount(followersRes.data);
      setFollowingCount(followingRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  fetchCounts();
}, [userId]);

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
    const fetchPosts = async () => {
      if (!userDetails?.id || activeTab !== "posts") return;
      try {
        const res = await axiosInstance.get(`/api/v1/posts/userPost?userId=${userDetails.id}`);
        setPosts(res.data);
      } catch (err) {
        toast.warn("Failed to fetch posts");
      }
    };
    fetchPosts();
  }, [activeTab, userDetails]);

  // Handle real-time follow updates
  useEffect(() => {
    if (!followEvent?.timestamp) return;

    const { followerId, followingId, action } = followEvent;

    // Update following count if current user is the follower
    if (followerId === userId) {
      setFollowingCount((prev) => (action === "FOLLOW" ? prev + 1 : prev - 1));
    }

    // Update followers count if current user is being followed
    if (followingId === userId) {
      setFollowersCount((prev) => (action === "FOLLOW" ? prev + 1 : prev - 1));
    }
  }, [followEvent, userId]);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 text-yellow-100">
      <div className="relative h-40 rounded-md overflow-hidden mb-20">
        <img
          src="https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&q=80&w=1200"
          alt="Cover"
          className="w-full h-full object-cover"
        />
      </div>

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

      <div className="mb-2 px-2">
        <h2 className="text-xl font-bold">{userDetails?.displayname}</h2>
        <p className="text-yellow-400 text-sm">@{userDetails?.username}</p>
      </div>

      <div className="flex items-center gap-2 text-sm text-yellow-100 mb-4 px-2">
        <FiCalendar />
        <span>Joined October 2025</span>
      </div>

      <div className="flex gap-6 text-sm text-yellow-200 mb-6 px-2">
        <span>
          <strong className="text-yellow-100">{followingCount}</strong> Following
        </span>
        <span>
          <strong className="text-yellow-100">{followersCount}</strong> Followers
        </span>
      </div>

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

      <div className="space-y-4 px-2">
        {activeTab === "posts" &&
          (posts.length > 0 ? (
            posts.map((post) => <PostCard key={post._id} post={post} userDetails={userDetails} />)
          ) : (
            <p className="text-yellow-400">No posts found</p>
          ))}
      </div>
    </div>
  );
}

export default Profile;
