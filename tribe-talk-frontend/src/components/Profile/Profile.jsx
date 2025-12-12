import { useEffect, useState, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { AuthContext } from "../../auth/AuthContext";
import { GlobalContext } from "../GlobalContext";
import { useNavigate } from "react-router-dom";
import PostCard from "../Post/PostCard";
import { FiCalendar } from "react-icons/fi";

function Profile() {
  const [activeTab, setActiveTab] = useState("posts");
  const [originalPosts, setOriginalPosts] = useState([]);
  const [replyPosts, setReplyPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [userDetails, setUserDetails] = useState(null);

  const { user } = useContext(AuthContext);
  const {
    followersCount,
    followingCount,
  } = useContext(GlobalContext);

  const navigate = useNavigate();
  const userId = user?.userId;

  // Fetch logged-in user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await axiosInstance.get(`/users/loggedUser`);
        setUserDetails(res.data);
      } catch (err) {
        toast.warn("Error fetching user details");
      }
    };
    fetchUserDetails();
  }, []);

  // Fetch user's posts & replies
  useEffect(() => {
    if (!userDetails?.id) return;

    const fetchPosts = async () => {
      try {
        const res = await axiosInstance.get(
          `/api/v1/posts/userPost?userId=${userDetails.id}`
        );
        const all = res.data;
        setOriginalPosts(all.filter((p) => p.replyToPostId === null));
        setReplyPosts(all.filter((p) => p.replyToPostId !== null));
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
        const res = await axiosInstance.get(
          `/api/v1/posts/liked?userId=${userDetails.id}`
        );
        setLikedPosts(res.data);
      } catch (err) {
        toast.warn("Failed to fetch liked posts");
      }
    };
    fetchLikedPosts();
  }, [userDetails]);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 text-yellow-100">

      {/* Cover */}
      <div className="relative h-40 rounded-md overflow-hidden mb-20">
        <img
          src="https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&q=80&w=1200%22"
          alt="Cover" className="w-full h-full object-cover"
        />
      </div>

      {/* Avatar */}
      <div className="relative flex items-center gap-4 -mt-28 mb-6 px-2">
        <img
          src="https://images.unsplash.com/photo-1536164261511-3a17e671d380?auto=format&fit=crop&q=80&w=682%22"
          alt="User Avatar"
          className="w-24 h-24 rounded-full border-4 border-neutral-900 object-cover"
        />
        <div className="ml-auto mt-6">
          <button className="px-4 py-2 bg-yellow-500 text-neutral-900 font-semibold rounded-full hover:bg-yellow-400 transition">
            Set up profile
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="mb-2 px-2">
        <h2 className="text-xl font-bold">{userDetails?.displayname}</h2>
        <p className="text-yellow-400 text-sm">@{userDetails?.username}</p>
      </div>

      {/* Joined Info */}
      <div className="flex items-center gap-2 text-sm text-yellow-100 mb-4 px-2">
        <FiCalendar />
        <span>Joined October 2025</span>
      </div>

      {/* Followers / Following Counts */}
      <div className="flex gap-6 text-sm text-yellow-200 mb-6 px-2">
        <button onClick={() => navigate("/connections?tab=following")}>
          <strong className="text-yellow-100">{followingCount}</strong> Following
        </button>
        <button onClick={() => navigate("/connections?tab=followers")}>
          <strong className="text-yellow-100">{followersCount}</strong> Followers
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-yellow-800 px-2 mb-4">
        {["posts", "replies", "likes"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 font-semibold capitalize ${activeTab === tab
              ? "border-b-2 border-yellow-400 text-yellow-100"
              : "text-yellow-400"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4 px-2">
        {activeTab === "posts" &&
          (originalPosts.length > 0 ? (
            originalPosts.map((post) => <PostCard key={post._id} post={post} />)
          ) : (
            <p className="text-yellow-400">No posts found</p>
          ))}

        {activeTab === "replies" &&
          (replyPosts.length > 0 ? (
            replyPosts.map((post) => <PostCard key={post._id} post={post} />)
          ) : (
            <p className="text-yellow-400">No replies found</p>
          ))}

        {activeTab === "likes" &&
          (likedPosts.length > 0 ? (
            likedPosts.map((post) => <PostCard key={post._id} post={post} />)
          ) : (
            <p className="text-yellow-400">No liked posts</p>
          ))}
      </div>
    </div>
  );
}

export default Profile;