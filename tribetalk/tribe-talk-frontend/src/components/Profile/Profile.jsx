import { FiCalendar } from "react-icons/fi";
import { useState } from "react";
import PostCard from "../Post/PostCard";

function Profile() {
  const [activeTab, setActiveTab] = useState("posts");

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 text-yellow-100">
      {/* Cover Image */}
      <div className="relative h-40 rounded-md overflow-hidden mb-20">
        <img
          src="https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&q=80&w=1200"
          alt="Cover"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Avatar + Button */}
      <div className="relative flex items-center gap-4 -mt-28 mb-6 px-2">
        <img
          src="https://images.unsplash.com/photo-1536164261511-3a17e671d380?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=682"
          alt="User Avatar"
          className="w-24 h-24 rounded-full border-4 border-neutral-900 object-cover"
        />
        <div className="ml-auto mt-6">
          <button className="px-4 py-2 bg-yellow-500 text-neutral-900 font-semibold rounded-full hover:bg-yellow-400 transition">
            Set up profile
          </button>
        </div>
      </div>

      {/* Name and Handle */}
      <div className="mb-2 px-2">
        <h2 className="text-xl font-bold">User</h2>
        <p className="text-yellow-400 text-sm">@user</p>
      </div>

      {/* Meta Info */}
      <div className="flex items-center gap-2 text-sm text-yellow-100 mb-4 px-2">
        <FiCalendar />
        <span>Joined October 2025</span>
      </div>

      {/* Stats */}
      <div className="flex gap-6 text-sm text-yellow-200 mb-6 px-2">
        <span>
          <strong className="text-yellow-100">1</strong> Following
        </span>
        <span>
          <strong className="text-yellow-100">0</strong> Followers
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-yellow-800 px-2 mb-4">
        {["posts", "replies", "likes"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 font-semibold capitalize ${
              activeTab === tab
                ? "border-b-2 border-yellow-400 text-yellow-100"
                : "text-yellow-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4 px-2">
        {activeTab === "posts" && (
          <>
            <PostCard />
            <PostCard />
          </>
        )}
        {activeTab === "replies" && (
          <>
            <PostCard />
          </>
        )}
        {activeTab === "likes" && (
          <>
            <PostCard />
            <PostCard />
            <PostCard />
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;
