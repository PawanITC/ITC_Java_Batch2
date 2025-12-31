import { useEffect, useState } from "react";
import PostCard from "../Post/PostCard";
import axiosInstance from "../../services/axiosInstance";

function HashtagsTab({ query }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHashtagPosts = async () => {
      try {
         const res = await axiosInstance.get("/api/v1/search/hashtags", {
          params: { q: query },
        });
        setPosts(res.data);
      } catch (err) {
        console.error("Failed to load hashtag posts:", err);
      } finally {
        setLoading(false);
      }
    };

    loadHashtagPosts();
  }, [query]);

  if (loading) return <p className="text-yellow-400">Loading hashtag posts...</p>;
  if (posts.length === 0) return <p className="text-yellow-400">No posts found for this hashtag.</p>;

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
export default HashtagsTab;
