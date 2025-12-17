import { useEffect, useState } from "react";
import PostCard from "../Post/PostCard";
import axiosInstance from "../../services/axiosInstance";

function PostsTab({ query }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axiosInstance.get("/api/v1/search/posts", {
          params: { q: query },
        });
        setPosts(res.data);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [query]);

  if (loading) return <p className="text-yellow-400">Loading posts...</p>;
  if (posts.length === 0)
    return <p className="text-yellow-400">No posts found.</p>;

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
export default PostsTab;
