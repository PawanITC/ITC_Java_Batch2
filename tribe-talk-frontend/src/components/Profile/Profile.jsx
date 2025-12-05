import { useEffect, useState, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { AuthContext } from "../../auth/AuthContext";
import { GlobalContext } from "../GlobalContext";
import PostCard from "../Post/PostCard";
import { FiCalendar } from "react-icons/fi";

function Profile() {
  const { user } = useContext(AuthContext);
  const {
    followersCount,
    setFollowersCount,
    followingCount,
    setFollowingCount,
  } = useContext(GlobalContext);

  const userId = user?.userId;

  const [userDetails, setUserDetails] = useState(null);

  // Current view → POSTS | FOLLOWERS | FOLLOWING
  const [view, setView] = useState("POSTS");

  // Posts
  const [posts, setPosts] = useState([]);

  // Follow lists
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);

  // Fetch logged user data
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await axiosInstance.get(`/api/users/loggedUser`);
        setUserDetails(res.data);
      } catch (err) {
        toast.error("Error fetching user details");
      }
    };

    fetchUserDetails();
  }, []);

  // Fetch posts
  useEffect(() => {
    if (!userDetails?.id) return;

    const getPosts = async () => {
      try {
        const res = await axiosInstance.get(
          `/api/v1/posts/userPost?userId=${userDetails.id}`
        );

        const originals = res.data.filter((p) => p.replyToPostId === null);
        setPosts(originals);
      } catch (err) {
        toast.error("Failed to load posts");
      }
    };

    getPosts();
  }, [userDetails]);

  // Load followers
  const loadFollowers = async () => {
    try {
      const res = await axiosInstance.get(`/api/follow/followers-list/${userId}`);
      setFollowersList(res.data);
    } catch {
      toast.error("Failed to load followers");
    }
  };

  // Load following
  const loadFollowing = async () => {
    try {
      const res = await axiosInstance.get(`/api/follow/following-list/${userId}`);
      setFollowingList(res.data);
    } catch {
      toast.error("Failed to load following");
    }
  };

  // Follow / Unfollow
  const toggleFollow = async (targetUserId, isCurrentlyFollowing) => {
    try {
      if (isCurrentlyFollowing) {
        await axiosInstance.delete(`/api/follow/unfollow-user`, {
          data: { followerId: userId, followingId: targetUserId },
        });

        setFollowingCount((prev) => prev - 1);
        toast.success("Unfollowed");
      } else {
        await axiosInstance.post(`/api/follow/follow-user`, {
          followerId: userId,
          followingId: targetUserId,
        });

        setFollowingCount((prev) => prev + 1);
        toast.success("Followed");
      }

      loadFollowers();
      loadFollowing();
    } catch {
      toast.error("Action failed");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 text-yellow-100">

      {/* Cover */}
      <div className="relative h-40 rounded-md overflow-hidden mb-16">
        <img
          src="https://images.unsplash.com/photo-1503264116251-35a269479413"
          alt="cover"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Avatar + Edit */}
      <div className="relative flex items-center gap-4 -mt-20 mb-4 px-2">
        <img
          src="https://images.unsplash.com/photo-1536164261511-3a17e671d380"
          className="w-24 h-24 rounded-full border-4 border-neutral-900"
        />
        <button className="ml-auto px-4 py-2 bg-yellow-500 text-neutral-900 font-semibold rounded-full">
          Edit profile
        </button>
      </div>

      {/* Name + Username */}
      <div className="px-2 mb-2">
        <h1 className="text-xl font-bold">{userDetails?.displayname}</h1>
        <p className="text-yellow-400">@{userDetails?.username}</p>
      </div>

      {/* Join Date */}
      <div className="px-2 flex items-center gap-2 text-sm mb-4">
        <FiCalendar />
        Joined October 2025
      </div>

      {/* FOLLOWERS & FOLLOWING with ACTIVE underline */}
      <div className="px-2 flex gap-6 text-sm mb-6">

        {/* Following */}
        <button
          onClick={() => {
            setView("FOLLOWING");
            loadFollowing();
          }}
          className={`pb-1 ${
            view === "FOLLOWING"
              ? "border-b-2 border-yellow-400 text-yellow-100 font-semibold"
              : "text-yellow-400"
          }`}
        >
          <strong>{followingCount}</strong> Following
        </button>

        {/* Followers */}
        <button
          onClick={() => {
            setView("FOLLOWERS");
            loadFollowers();
          }}
          className={`pb-1 ${
            view === "FOLLOWERS"
              ? "border-b-2 border-yellow-400 text-yellow-100 font-semibold"
              : "text-yellow-400"
          }`}
        >
          <strong>{followersCount}</strong> Followers
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="px-2 space-y-4">

        {/* POSTS */}
        {view === "POSTS" &&
          (posts.length > 0 ? (
            posts.map((p) => <PostCard key={p._id} post={p} />)
          ) : (
            <p className="text-yellow-400">No posts yet</p>
          ))}

        {/* FOLLOWERS LIST */}
        {view === "FOLLOWERS" &&
          (followersList.length > 0 ? (
            followersList.map((u) => (
              <div
                key={u.id}
                className="flex justify-between items-center p-2 border-b border-yellow-800"
              >
                <div>
                  <p className="font-semibold">{u.displayname}</p>
                  <p className="text-yellow-400">@{u.username}</p>
                </div>

                <button
                  onClick={() => toggleFollow(u.id, true)}
                  className="px-3 py-1 bg-neutral-700 border border-yellow-400 text-yellow-400 rounded-full"
                >
                  Unfollow
                </button>
              </div>
            ))
          ) : (
            <p className="text-yellow-400">No followers yet</p>
          ))}

        {/* FOLLOWING LIST */}
        {view === "FOLLOWING" &&
          (followingList.length > 0 ? (
            followingList.map((u) => (
              <div
                key={u.id}
                className="flex justify-between items-center p-2 border-b border-yellow-800"
              >
                <div>
                  <p className="font-semibold">{u.displayname}</p>
                  <p className="text-yellow-400">@{u.username}</p>
                </div>

                <button
                  onClick={() => toggleFollow(u.id, true)}
                  className="px-3 py-1 bg-neutral-700 border border-yellow-400 text-yellow-400 rounded-full"
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
