import { useEffect, useState, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { AuthContext } from "../../auth/AuthContext";
import { GlobalContext } from "../GlobalContext";
import { useNavigate } from "react-router-dom";
import PostCard from "../Post/PostCard";
import { FiCalendar } from "react-icons/fi";
import EditProfileModal from "./EditProfileModal";

function Profile() {
  const [activeTab, setActiveTab] = useState("posts");
  const [originalPosts, setOriginalPosts] = useState([]);
  const [replyPosts, setReplyPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  const { user } = useContext(AuthContext);
  const { followersCount, followingCount } = useContext(GlobalContext);

  const navigate = useNavigate();
  const userId = user?.userId;

  // ==========================
  // Fetch profile (Mongo)
  // ==========================
  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get(`/api/users/user-profile/${userId}`);
        setUserProfile(res.data);
      } catch {
        toast.error("Failed to load profile");
      }
    };

    fetchProfile();
  }, [userId]);

  // ==========================
  // Fetch posts
  // ==========================
  useEffect(() => {
    if (!userProfile?.userId) return;

    const fetchPosts = async () => {
      try {
        const res = await axiosInstance.get(
          `/api/v1/posts/userPost?userId=${userProfile.userId}`
        );
        const all = res.data;
        setOriginalPosts(all.filter((p) => p.replyToPostId === null));
        setReplyPosts(all.filter((p) => p.replyToPostId !== null));
      } catch {
        toast.warn("Failed to fetch posts");
      }
    };

    fetchPosts();
  }, [userProfile]);

  // ==========================
  // Fetch liked posts
  // ==========================
  useEffect(() => {
    if (!userProfile?.userId) return;

    const fetchLiked = async () => {
      try {
        const res = await axiosInstance.get(
          `/api/v1/posts/liked?userId=${userProfile.userId}`
        );
        setLikedPosts(res.data);
      } catch {
        toast.warn("Failed to fetch liked posts");
      }
    };

    fetchLiked();
  }, [userProfile]);

  if (!userProfile) return null;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 text-yellow-100">

      {/* Cover */}
      <div className="relative h-40 rounded-md overflow-hidden mb-20">
        <img
          src={userProfile.coverPictureUrl}
          alt="Cover"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Avatar + Button */}
      <div className="relative flex items-center gap-4 -mt-28 mb-6 px-2">
        <img
          src={userProfile.profilePictureUrl}
          alt="Avatar"
          className="w-24 h-24 rounded-full border-4 border-neutral-900 object-cover"
        />
        <div className="ml-auto mt-6">
          <button
            onClick={() => setShowEdit(true)}
            className="px-4 py-2 bg-yellow-500 text-neutral-900 font-semibold rounded-full hover:bg-yellow-400"
          >
            Edit profile
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="mb-2 px-2">
        <h2 className="text-xl font-bold">{userProfile.displayName}</h2>
        <p className="text-yellow-400 text-sm">@{userProfile.username}</p>
        {userProfile.bio && (
          <p className="mt-2 text-sm">{userProfile.bio}</p>
        )}
      </div>

      {/* Joined */}
      <div className="flex items-center gap-2 text-sm mb-4 px-2">
        <FiCalendar />
        <span>
          Joined {new Date(userProfile.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Followers */}
      <div className="flex gap-6 text-sm mb-6 px-2">
        <button onClick={() => navigate("/connections?tab=following")}>
          <strong>{followingCount}</strong> Following
        </button>
        <button onClick={() => navigate("/connections?tab=followers")}>
          <strong>{followersCount}</strong> Followers
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-yellow-800 px-2 mb-4">
        {["posts", "replies", "likes"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 font-semibold capitalize ${
              activeTab === tab
                ? "border-b-2 border-yellow-400"
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
          (originalPosts.length
            ? originalPosts.map((p) => <PostCard key={p._id} post={p} />)
            : <p>No posts</p>)}

        {activeTab === "replies" &&
          (replyPosts.length
            ? replyPosts.map((p) => <PostCard key={p._id} post={p} />)
            : <p>No replies</p>)}

        {activeTab === "likes" &&
          (likedPosts.length
            ? likedPosts.map((p) => <PostCard key={p._id} post={p} />)
            : <p>No likes</p>)}
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <EditProfileModal
          userDetails={userProfile}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => setUserProfile(updated)}
        />
      )}
    </div>
  );
}

export default Profile;
