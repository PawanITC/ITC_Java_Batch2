import { useEffect, useState, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { AuthContext } from "../../auth/AuthContext";
import { GlobalContext } from "../GlobalContext";
import PostCard from "../Post/PostCard";
import { FiCalendar } from "react-icons/fi";

function Profile() {
  const { user } = useContext(AuthContext);
  const { followersCount, followingCount } = useContext(GlobalContext);

  const userId = user?.userId;

  const [mainTab, setMainTab] = useState("posts"); // posts | following | followers

  const [posts, setPosts] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);

  const [userDetails, setUserDetails] = useState(null);

  // Fetch logged-in user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await axiosInstance.get(`/api/users/loggedUser`);
        setUserDetails(res.data);
      } catch (err) {
        toast.warn("Failed to load user details");
      }
    };
    fetchUserDetails();
  }, []);

  // Fetch posts
  useEffect(() => {
    if (mainTab !== "posts" || !userId) return;

    const fetchPosts = async () => {
      try {
        const res = await axiosInstance.get(
          `/api/v1/posts/userPost?userId=${userId}`
        );
        setPosts(res.data);
      } catch (err) {
        toast.warn("Failed to load posts");
      }
    };

    fetchPosts();
  }, [mainTab, userId]);

  // Fetch followers list
  useEffect(() => {
    if (mainTab !== "followers" || !userId) return;

    const fetchFollowers = async () => {
      try {
        const res = await axiosInstance.get(`/api/follow/followers-list/${userId}`);
        setFollowersList(res.data);
      } catch (err) {
        toast.warn("Failed to load followers");
      }
    };

    fetchFollowers();
  }, [mainTab, userId]);

  // Fetch following list
  useEffect(() => {
    if (mainTab !== "following" || !userId) return;

    const fetchFollowing = async () => {
      try {
        const res = await axiosInstance.get(`/api/follow/following-list/${userId}`);
        setFollowingList(res.data);
      } catch (err) {
        toast.warn("Failed to load following list");
      }
    };

    fetchFollowing();
  }, [mainTab, userId]);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 text-yellow-100">
      
      {/* Cover */}
      <div className="relative h-40 rounded-md overflow-hidden mb-20">
        <img
          src="https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&q=80&w=1400"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Avatar + Button */}
      <div className="relative flex items-center gap-4 -mt-28 mb-6 px-2">
        <img
          src="https://images.unsplash.com/photo-1536164261511-3a17e671d380?auto=format&fit=crop&q=80&w=700"
          className="w-24 h-24 rounded-full border-4 border-neutral-900 object-cover"
        />
        <div className="ml-auto mt-6">
          <button className="px-4 py-2 bg-yellow-500 text-neutral-900 font-semibold rounded-full hover:bg-yellow-400 transition">
            Edit profile
          </button>
        </div>
      </div>

      {/* Username */}
      <div className="mb-2 px-2">
        <h2 className="text-xl font-bold">{userDetails?.displayname}</h2>
        <p className="text-yellow-400 text-sm">@{userDetails?.username}</p>
      </div>

      {/* Joined */}
      <div className="flex items-center gap-2 text-sm text-yellow-200 mb-4 px-2">
        <FiCalendar />
        <span>Joined October 2025</span>
      </div>

      {/* Counts */}
      <div className="flex gap-6 text-sm text-yellow-200 mb-6 px-2">
        <span>
          <strong className="text-yellow-100">{followingCount}</strong> Following
        </span>
        <span>
          <strong className="text-yellow-100">{followersCount}</strong> Followers
        </span>
      </div>

      {/* MAIN TABS */}
      <div className="flex gap-6 border-b border-yellow-800 px-2 mb-4">
        {["posts", "following", "followers"].map((tab) => (
          <button
            key={tab}
            onClick={() => setMainTab(tab)}
            className={`pb-2 font-semibold capitalize ${
              mainTab === tab
                ? "border-b-2 border-yellow-400 text-yellow-100"
                : "text-yellow-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <div className="px-2">
        
        {/* POSTS TAB */}
        {mainTab === "posts" && (
          <div className="space-y-4">
            {posts.length > 0 ? (
              posts.map((p) => (
                <PostCard key={p._id} post={p} userDetails={userDetails} />
              ))
            ) : (
              <p className="text-yellow-400">No posts found.</p>
            )}
          </div>
        )}

        {/* FOLLOWING LIST */}
        {mainTab === "following" && (
          <div className="space-y-3">
            {followingList.length > 0 ? (
              followingList.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-3 border-b border-yellow-900"
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${u.displayname}`}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-semibold">{u.displayname}</p>
                    <p className="text-yellow-400 text-sm">@{u.username}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-yellow-400">Not following anyone.</p>
            )}
          </div>
        )}

        {/* FOLLOWERS LIST */}
        {mainTab === "followers" && (
          <div className="space-y-3">
            {followersList.length > 0 ? (
              followersList.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-3 border-b border-yellow-900"
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${u.displayname}`}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-semibold">{u.displayname}</p>
                    <p className="text-yellow-400 text-sm">@{u.username}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-yellow-400">No followers yet.</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default Profile;
