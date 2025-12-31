import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axiosInstance from "../../services/axiosInstance";
import PostCard from "./PostCard";

function PostDetails() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
    fetchReplies();
  }, [postId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-yellow-400 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-2"></div>
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-yellow-400 text-center">
          <p>Post not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ Full post */}
      <PostCard post={post} />

      {/* ✅ Replies */}
      <div className="mt-6 space-y-4">
        {replies.length > 0 ? (
          replies.map((reply) => (
            <PostCard key={reply.id} post={reply} />
          ))
        ) : (
          <p className="text-yellow-400 text-center py-4">No replies yet</p>
        )}
      </div>
    </div>
  );
}

export default PostDetails;
