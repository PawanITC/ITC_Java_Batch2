
import Sidebar from "../components/Sidebar";
import PostCard from "../components/Post/PostCard";
import SuggestionSidebar from "../components/Suggestion/SuggestionSibebar";
import MainHeader from "../components/MainHeader";
import { useEffect, useState, useContext } from "react";
import axiosInstance from "../services/axiosInstance";
import { AuthContext } from "../auth/AuthContext";
import { toast } from "react-toastify";


function MainPage() {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const fetchPublicPosts = async () => {
            try {
                const res = await axiosInstance.get(
                    `/api/v1/posts/all`
                );
                setPosts(res.data);
            } catch (err) {
                console.error(err);
                toast.warn("Failed to load all posts");
            }
        };

        fetchPublicPosts();
    }, []);

  return (
    <div className="flex bg-neutral-900 text-yellow-200 min-h-screen">
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col md:flex-row grow md:ml-64 ml-20">
        {/* Post Feed */}
        <main className="w-full md:w-2/3 max-w-2xl mx-auto">
          <MainHeader />
          <div className="px-4 py-6 space-y-4">
              {posts.length > 0 ? (
                  posts.map((post) => (
                      <PostCard
                          key={post._id}
                          post={post}
                      />
                  ))
              ) : (
                  <p className="text-yellow-400">No public posts found</p>
              )}
          </div>
        </main>

        {/* Suggestions Sidebar */}
        <SuggestionSidebar />
      </div>
    </div>
  );
}

export default MainPage;