import { useEffect, useState } from "react";
import PostCard from "../Post/PostCard";
import axiosInstance from "../../services/axiosInstance";

function MentionsTab({ query }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMentionPosts = async () => {
      try {
        const res = await axiosInstance.get("/api/v1/search/mentions", {
          params: { q: query },
        });
        setPosts(res.data);
      } catch (err) {
        console.error("Failed to load mention posts:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMentionPosts();
  }, [query]);

  if (loading) return <p className="text-yellow-400">Loading mentions...</p>;
  if (posts.length === 0)
    return <p className="text-yellow-400">No posts mention this user.</p>;

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
export default MentionsTab;
