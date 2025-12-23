import { useEffect, useState, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { AuthContext } from "../../auth/AuthContext";
import { GlobalContext } from "../GlobalContext";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PostCard from "../Post/PostCard";
import { FiCalendar } from "react-icons/fi";
import EditProfileModal from "./EditProfileModal";
import defaultAvatar from "../../assets/default-avatar.jpg";
import defaultCover from "../../assets/default-cover.jpg";
function Profile() {
  const [activeTab, setActiveTab] = useState("posts");
  const [originalPosts, setOriginalPosts] = useState([]);
  const [replyPosts, setReplyPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [viewedUserFollowersCount, setViewedUserFollowersCount] = useState(0);
  const [viewedUserFollowingCount, setViewedUserFollowingCount] = useState(0);

  const { user } = useContext(AuthContext);
  const { refreshUserProfile } = useContext(GlobalContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams(); // Get userId from URL
  const loggedInUserId = user?.userId;
  const isOwnProfile = loggedInUserId && userId && parseInt(userId) === loggedInUserId;

  // ======================
  // Fetch profile
  // ======================
  useEffect(() => {
    if (!userId) return;

    axiosInstance
      .get(`/api/users/user-profile/${userId}`)
      .then((res) => setUserProfile(res.data))
      .catch(() => toast.error("Failed to load profile"));
  }, [userId]);

  // ======================
  // Fetch follower/following counts for viewed user
  // ======================
  useEffect(() => {
    if (!userId) return;

    const fetchCounts = () => {
      // Fetch followers count
      axiosInstance
        .get(`/api/users/${userId}/followers-count`)
        .then((res) => setViewedUserFollowersCount(res.data))
        .catch(() => console.error("Failed to fetch followers count"));

      // Fetch following count
      axiosInstance
        .get(`/api/users/${userId}/following-count`)
        .then((res) => setViewedUserFollowingCount(res.data))
        .catch(() => console.error("Failed to fetch following count"));
    };

    fetchCounts();
  }, [userId, location]); // Refetch when userId or location changes

  // ======================
  // Fetch posts
  // ======================
  useEffect(() => {
    if (!userProfile?.userId) return;

    axiosInstance
      .get(`/api/v1/posts/userPost?userId=${userProfile.userId}`)
      .then((res) => {
        setOriginalPosts(res.data.filter((p) => p.replyToPostId === null));
        setReplyPosts(res.data.filter((p) => p.replyToPostId !== null));
      })
      .catch(() => toast.warn("Failed to fetch posts"));
  }, [userProfile]);

  // ======================
  // Fetch liked posts
  // ======================
  useEffect(() => {
    if (!userProfile?.userId) return;

    axiosInstance
      .get(`/api/v1/posts/liked?userId=${userProfile.userId}`)
      .then((res) => setLikedPosts(res.data))
      .catch(() => toast.warn("Failed to fetch liked posts"));
  }, [userProfile]);

  if (!userProfile) return null;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 text-yellow-100">

      {/* Cover */}
      <div className="relative h-40 rounded-md overflow-hidden mb-20">
        <img
          src={userProfile.coverImageUrl || defaultCover}
          alt="Cover"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Avatar + Edit */}
      <div className="relative flex items-center gap-4 -mt-28 mb-6 px-2">
        <img
          src={userProfile.profileImageUrl || defaultAvatar}
          alt="Avatar"
          className="w-24 h-24 rounded-full border-4 border-neutral-900 object-cover"
        />
        {isOwnProfile && (
          <div className="ml-auto mt-6">
            <button
              onClick={() => setShowEdit(true)}
              className="px-4 py-2 bg-yellow-500 text-neutral-900 font-semibold rounded-full cursor-pointer"
            >
              Edit profile
            </button>
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="mb-2 px-2">
        <h2 className="text-xl font-bold">{userProfile.displayName}</h2>
        <p className="text-yellow-400 text-sm">@{userProfile.username}</p>
        {userProfile.bio && <p className="mt-2 text-sm">{userProfile.bio}</p>}
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
        <button
          onClick={() => navigate(`/connections/${userId}?tab=following`)}
          className="cursor-pointer hover:underline transition"
        >
          <strong>{viewedUserFollowingCount}</strong> Following
        </button>
        <button
          onClick={() => navigate(`/connections/${userId}?tab=followers`)}
          className="cursor-pointer hover:underline transition"
        >
          <strong>{viewedUserFollowersCount}</strong> Followers
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-yellow-800 px-2 mb-4">
        {["posts", "replies", "likes"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 font-semibold capitalize ${activeTab === tab
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

      {showEdit && (
        <EditProfileModal
          userDetails={userProfile}
          onClose={() => setShowEdit(false)}
          onSaved={(updatedProfile) => {
            setUserProfile(updatedProfile);
            refreshUserProfile();
          }}
        />
      )}
    </div>
  );
}

export default Profile;
