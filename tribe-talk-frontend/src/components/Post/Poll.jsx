import { useState } from "react";
import axiosInstance from "../../services/axiosInstance.js";

function Poll({ post, user }) {
    const [localPost, setLocalPost] = useState(post);
    const poll = localPost.poll;
    const isExpired = poll?.expiresAt ? new Date(poll.expiresAt) < new Date() : false;

    const totalVotes = poll?.totalVotes ?? (poll?.options?.reduce((sum, o) => sum + o.votes, 0) || 0);

    const handleVote = async (optionIndex) => {
        if (isExpired) return;
        try {
            console.log(user);
            const res = await axiosInstance.post(`/v1/posts/${localPost.id}/vote`, null, {
                params: { optionIndex, userId: user.userId },
            });
            setLocalPost(res.data); // updated votes/percentages from backend
        } catch (e) {
            console.error("Vote failed", e);
        }
    };

    if (!poll) return null;

    return (
        <div className="mt-3 space-y-3">
            {poll.options.map((opt, idx) => {
                const percentage = opt.percentage ?? (totalVotes > 0 ? (opt.votes * 100) / totalVotes : 0);
                return (
                    <button
                        key={idx}
                        onClick={() => handleVote(idx)}
                        disabled={isExpired}
                        className="w-full text-left"
                    >
                        <div className="flex items-center justify-between text-sm text-yellow-300 mb-1">
                            <span>{opt.option}</span>
                            <span>{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-md overflow-hidden h-7">
                            <div
                                className="bg-yellow-500 h-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </button>
                );
            })}
            <div className="flex justify-between text-xs text-yellow-400 dark:text-gray-600">
                <span>{totalVotes} votes</span>
                {poll.expiresAt && (
                    <span>Ends {new Date(poll.expiresAt).toLocaleString()}</span>
                )}
            </div>
        </div>
    );
}

export default Poll;
