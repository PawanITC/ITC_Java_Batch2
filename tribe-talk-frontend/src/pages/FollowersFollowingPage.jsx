import { useContext, useState, useEffect } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import SuggestionSidebar from "../components/Suggestion/SuggestionSibebar";
import MainHeader from "../components/MainHeader";
import FollowersListComponent from "../components/Profile/FollowersListComponent";
import FollowingListComponent from "../components/Profile/FollowingListComponent";
import { AuthContext } from "../auth/AuthContext";
import axiosInstance from "../services/axiosInstance";

function FollowersFollowingPage() {
  const { user } = useContext(AuthContext);
  const { userId } = useParams(); // Get userId from URL
  const [viewedUser, setViewedUser] = useState(null);
  const [activeTab, setActiveTab] = useState("followers"); // default tab
  const [searchParams] = useSearchParams();

  // Fetch the viewed user's profile
  useEffect(() => {
    if (!userId) return;

    axiosInstance
      .get(`/api/users/user-profile/${userId}`)
      .then((res) => setViewedUser(res.data))
      .catch((err) => console.error("Failed to load user profile:", err));
  }, [userId]);

  // Read ?tab=followers or ?tab=following from URL
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl === "followers" || tabFromUrl === "following") {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  return (
    <div className="flex bg-neutral-900 text-yellow-200 min-h-screen">
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col md:flex-row grow md:ml-64 ml-20">
        {/* Main center feed */}
        <main className="w-full md:w-2/3 max-w-2xl mx-auto">
          <MainHeader />

          {/* User Header */}
          <div className="px-4 pt-6 pb-2">
            <h2 className="text-xl font-bold text-yellow-100">{viewedUser?.displayName || "Loading..."}</h2>
            <p className="text-yellow-400 text-sm">@{viewedUser?.username || ""}</p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mt-2 border-b border-yellow-700/30">
            <button
              className={`relative py-3 text-sm font-semibold text-center transition ${activeTab === "followers"
                  ? "text-yellow-300 after:absolute after:bottom-0 after:left-1/4 after:right-1/4 after:border-b-2 after:border-yellow-400"
                  : "text-yellow-500 hover:text-yellow-300"
                }`}
              onClick={() => setActiveTab("followers")}
            >
              Followers
            </button>

            <button
              className={`relative py-3 text-sm font-semibold text-center transition ${activeTab === "following"
                  ? "text-yellow-300 after:absolute after:bottom-0 after:left-1/4 after:right-1/4 after:border-b-2 after:border-yellow-400"
                  : "text-yellow-500 hover:text-yellow-300"
                }`}
              onClick={() => setActiveTab("following")}
            >
              Following
            </button>
          </div>

          {/* Content Section */}
          <div className="px-4 py-6 space-y-4">
            {activeTab === "followers" ? (
              <FollowersListComponent userId={userId} />
            ) : (
              <FollowingListComponent userId={userId} />
            )}
          </div>
        </main>

        {/* Suggestions Sidebar */}
        <SuggestionSidebar />
      </div>
    </div>
  );
}

export default FollowersFollowingPage;
