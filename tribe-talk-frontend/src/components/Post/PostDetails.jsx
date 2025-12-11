import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axiosInstance from "../../services/axiosInstance";
import PostCard from "./PostCard";

function PostDetails() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);

  
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axiosInstance.get(`/api/v1/posts/${postId}`);
        setPost(res.data);
      } catch (err) {
        console.error("Failed to fetch post", err);
      }
    };

    const fetchReplies = async () => {
      try {
        const res = await axiosInstance.get(`/api/v1/posts/${postId}/replies`);
        setReplies(res.data);
      } catch (err) {
        console.error("Failed to fetch replies", err);
      }
    };

    fetchPost();
    fetchReplies();
  }, [postId]);

  if (!post) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* ✅ Full post */}
      <PostCard post={post} />

      {/* ✅ Replies */}
      <div className="mt-6 space-y-4">
        {replies.map((reply) => (
          <PostCard key={reply.id} post={reply} />
        ))}
      </div>
    </div>
  );
}

export default PostDetails;
