
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

                // Check if response is HTML (backend error/404)
                if (typeof res.data === 'string' && res.data.includes('<!doctype html>')) {
                    console.error("Backend returned HTML instead of JSON. API endpoint may not exist or backend is not running.");
                    toast.error("Backend API error - please check if the backend is running");
                    setPosts([]);
                    return;
                }

                // Ensure we always set an array
                if (Array.isArray(res.data)) {
                    setPosts(res.data);
                } else if (res.data && Array.isArray(res.data.posts)) {
                    // In case the response is wrapped in an object
                    setPosts(res.data.posts);
                } else {
                    console.warn("Unexpected API response format:", res.data);
                    setPosts([]);
                }
            } catch (err) {
                console.error("Error fetching posts:", err);
                console.error("Error details:", {
                    status: err.response?.status,
                    statusText: err.response?.statusText,
                    url: err.config?.url,
                    baseURL: err.config?.baseURL
                });

                if (err.response?.status === 401) {
                    toast.error("Authentication required - please login");
                } else if (err.response?.status === 404) {
                    toast.error("API endpoint not found - backend may not be running");
                } else {
                    toast.warn("Failed to load posts");
                }
                setPosts([]); // Set empty array on error
            }
        };

        fetchPublicPosts();
    }, []);

    return (
        <div className="flex bg-white dark:bg-neutral-900 text-yellow-200 dark:text-gray-900 min-h-screen">
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
                            <p className="text-yellow-400 dark:text-gray-600">No public posts found</p>
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