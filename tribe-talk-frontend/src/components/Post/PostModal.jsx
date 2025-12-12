import { FiImage, FiSmile, FiBarChart2, FiCalendar, FiX } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useRef, useState, useContext } from "react";
import EmojiPopover from "./EmojiPopover";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { AuthContext } from "../../auth/AuthContext";

function PostModal({ onClose, replyToPostId = null, prefillText = "" }) {
    const { user } = useContext(AuthContext);
    const userId = user?.userId;
    console.log(user);
    const textRef = useRef(null);
    const fileInputRef = useRef(null);

    const [showEmojiPopover, setShowEmojiPopover] = useState(false);

    const [text, setText] = useState(prefillText);
    // const [media, setMedia] = useState(null);
    const [mediaFiles, setMediaFiles] = useState([]);
    const [pollOptions, setPollOptions] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [scheduledAt, setScheduledAt] = useState(null);

    const [showPoll, setShowPoll] = useState(false);
    const [pollDuration, setPollDuration] = useState({
        days: 1,
        hours: 0,
        minutes: 0,
    });

    const [visibility, setVisibility] = useState("EVERYONE");
    const [replyPermission, setReplyPermission] = useState("EVERYONE");
    const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
    const [showReplyDropdown, setShowReplyDropdown] = useState(false);

    const visibilityOptions = [
        { label: "Everyone", value: "EVERYONE" },
        { label: "Followers", value: "FOLLOWERS" },
        { label: "Mentioned", value: "MENTIONED" },
    ];

    const replyOptions = [
        { label: "Everyone", value: "EVERYONE" },
        { label: "Followed", value: "FOLLOWED" },
        { label: "Mentioned", value: "MENTIONED" },
    ];

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);

        const validFiles = files.filter(
            (file) => file.type.startsWith("image") || file.type.startsWith("video")
        );

        const oversized = validFiles.find((file) => file.size > MAX_FILE_SIZE);
        if (oversized) {
            toast.error("Each file must be less than 50 MB.");
            return;
        }

        setMediaFiles(validFiles);
    };

    const extractHashtags = (text) =>
        Array.from(new Set(text.match(/#\w+/g)))?.map((tag) => tag.slice(1)) || [];

    const extractMentions = (text) =>
        Array.from(new Set(text.match(/@\w+/g)))?.map((mention) =>
            mention.slice(1)
        ) || [];

    const extractUrls = (text) =>
        Array.from(new Set(text.match(/https?:\/\/[^\s]+/g))) || [];

    const MAX_FILE_SIZE = 50 * 1024 * 1024;

    const handlePost = async () => {
        const hasText = text.trim().length > 0;
        const hasMedia = mediaFiles.length > 0;
        const hasPoll =
            showPoll && pollOptions.some((opt) => opt.trim().length > 0);

        // Validate: must have at least one content type
        if (!hasText && !hasMedia && !hasPoll) {
            toast.error("Post must contain text, media, or a poll.");
            return;
        }

        let pollPayload = null;
        if (hasPoll) {
            const cleanedPollOptions = pollOptions
                .map((opt) => opt.trim())
                .filter((opt) => opt.length > 0);

            if (cleanedPollOptions.length < 2) {
                toast.error("Poll must have at least 2 options.");
                return;
            }

            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + pollDuration.days);
            expiresAt.setHours(expiresAt.getHours() + pollDuration.hours);
            expiresAt.setMinutes(expiresAt.getMinutes() + pollDuration.minutes);

            pollPayload = {
                options: cleanedPollOptions.map((opt) => ({ option: opt, votes: 0 })),
                expiresAt: expiresAt.toISOString(),
            };
        }

        const payload = {
            userId,
            text: hasText ? text : "",
            scheduledAt,
            visibility,
            replyPermission,
            hashtags: extractHashtags(text),
            mentions: extractMentions(text),
            urls: extractUrls(text),
            poll: pollPayload,
            replyToPostId,
        };

        const formData = new FormData();
        formData.append(
            "data",
            new Blob([JSON.stringify(payload)], { type: "application/json" })
        );

        mediaFiles.forEach((file) => {
            formData.append("media", file);
        });

        try {
            const res = await axiosInstance.post("/v1/posts/create", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true,  // Ensure cookies are sent
            });

            console.log("Post created:", res.data);

            if (scheduledAt) {
                toast.success(
                    "Post scheduled at " + new Date(scheduledAt).toLocaleString()
                );
            } else {
                toast.success("Post published!");
            }
            onClose();
        } catch (error) {
            console.error("Post failed:", error);
            toast.error("Failed to publish post.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-neutral-900 text-yellow-100 w-full max-w-xl rounded-lg p-6 relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-yellow-400 hover:text-yellow-200"
                >
                    <FiX size={20} />
                </button>

                {/* Header */}
                <h2 className="text-xl font-semibold mb-4">Create Post</h2>

                {/* Text Area */}
                {!showPoll ? (
                    <textarea
                        ref={textRef}
                        rows={4}
                        placeholder="What's happening?"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full bg-neutral-800 text-yellow-200 p-3 rounded-md border border-yellow-700/40 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                ) : (
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Ask a question"
                            className="w-full bg-neutral-800 text-yellow-200 p-3 rounded-md border border-yellow-700/40"
                        />

                        {pollOptions.map((opt, idx) => (
                            <input
                                key={idx}
                                type="text"
                                value={opt}
                                maxLength={25}
                                onChange={(e) => {
                                    const updated = [...pollOptions];
                                    updated[idx] = e.target.value;
                                    setPollOptions(updated);
                                }}
                                placeholder={`Choice ${idx + 1}`}
                                className="w-full bg-neutral-800 text-yellow-200 p-2 rounded-md border border-yellow-700/40"
                            />
                        ))}

                        {pollOptions.length < 4 && (
                            <button
                                onClick={() => setPollOptions([...pollOptions, ""])}
                                className="text-yellow-400 text-sm hover:text-yellow-200"
                            >
                                + Add option
                            </button>
                        )}

                        <div className="flex gap-2 text-sm text-yellow-300">
                            <label>
                                Days:
                                <select
                                    value={pollDuration.days}
                                    onChange={(e) =>
                                        setPollDuration({
                                            ...pollDuration,
                                            days: parseInt(e.target.value),
                                        })
                                    }
                                    className="ml-1 bg-neutral-800 text-yellow-100 p-1 rounded"
                                >
                                    {[...Array(8)].map((_, i) => (
                                        <option key={i} value={i}>
                                            {i}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Hours:
                                <select
                                    value={pollDuration.hours}
                                    onChange={(e) =>
                                        setPollDuration({
                                            ...pollDuration,
                                            hours: parseInt(e.target.value),
                                        })
                                    }
                                    className="ml-1 bg-neutral-800 text-yellow-100 p-1 rounded"
                                >
                                    {[...Array(24)].map((_, i) => (
                                        <option key={i} value={i}>
                                            {i}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Minutes:
                                <select
                                    value={pollDuration.minutes}
                                    onChange={(e) =>
                                        setPollDuration({
                                            ...pollDuration,
                                            minutes: parseInt(e.target.value),
                                        })
                                    }
                                    className="ml-1 bg-neutral-800 text-yellow-100 p-1 rounded"
                                >
                                    {[0, 1, 5, 10, 15, 30, 45].map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <button
                            onClick={() => {
                                setShowPoll(false);
                                setPollOptions([]);
                                setPollDuration({ days: 1, hours: 0, minutes: 0 });
                            }}
                            className="text-red-400 text-sm hover:text-red-300"
                        >
                            Remove poll
                        </button>
                    </div>
                )}

                {/* Inline Media Preview */}

                {mediaFiles.length > 0 && (
                    <div className="mt-3 flex gap-3 flex-wrap">
                        {mediaFiles.map((file, idx) => (
                            <div key={idx} className="relative">
                                <span
                                    onClick={() =>
                                        setMediaFiles(mediaFiles.filter((_, i) => i !== idx))
                                    }
                                    className="absolute top-1 right-1 bg-black/60 text-yellow-100 rounded-full p-1 cursor-pointer hover:bg-yellow-700"
                                >
                                    <FiX size={14} />
                                </span>

                                {file.type.startsWith("image") ? (
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt="preview"
                                        className="w-32 h-32 object-cover rounded-md border border-yellow-700"
                                    />
                                ) : (
                                    <video
                                        src={URL.createObjectURL(file)}
                                        controls
                                        className="w-32 h-32 rounded-md border border-yellow-700"
                                    />
                                )}

                                <div className="mt-1 text-xs text-yellow-400">
                                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Visibility Dropdown */}
                <div className="relative mt-3">
                    <button
                        onClick={() => setShowVisibilityDropdown((prev) => !prev)}
                        className="text-sm text-yellow-400 hover:text-yellow-200"
                    >
                        Who can see this post:{" "}
                        {visibilityOptions.find((opt) => opt.value === visibility)?.label}
                    </button>
                    {showVisibilityDropdown && (
                        <div className="absolute bg-neutral-800 border border-yellow-700 rounded shadow-md mt-2 z-10 w-64">
                            {visibilityOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    onClick={() => {
                                        setVisibility(opt.value);
                                        setShowVisibilityDropdown(false);
                                    }}
                                    className="px-4 py-2 text-yellow-100 hover:bg-yellow-700 cursor-pointer"
                                >
                                    {opt.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Reply Permission Dropdown */}
                <div className="relative mt-2">
                    <button
                        onClick={() => setShowReplyDropdown((prev) => !prev)}
                        className="text-sm text-yellow-400 hover:text-yellow-200"
                    >
                        Who can reply:{" "}
                        {replyOptions.find((opt) => opt.value === replyPermission)?.label}
                    </button>
                    {showReplyDropdown && (
                        <div className="absolute bg-neutral-800 border border-yellow-700 rounded shadow-md mt-2 z-10 w-64">
                            {replyOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    onClick={() => {
                                        setReplyPermission(opt.value);
                                        setShowReplyDropdown(false);
                                    }}
                                    className="px-4 py-2 text-yellow-100 hover:bg-yellow-700 cursor-pointer"
                                >
                                    {opt.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Date Picker */}
                {showDatePicker && (
                    <div className="mt-3">
                        <DatePicker
                            selected={scheduledAt}
                            onChange={(date) => setScheduledAt(date)}
                            showTimeSelect
                            dateFormat="Pp"
                            className="bg-neutral-800 text-yellow-200 p-2 rounded-md"
                        />
                    </div>
                )}

                {/* Emoji Picker */}
                {showEmojiPopover && (
                    <div className="relative mt-3">
                        <EmojiPopover
                            onClose={() => setShowEmojiPopover(false)}
                            onSelect={(emoji) => {
                                const textarea = textRef.current;
                                const start = textarea.selectionStart;
                                const end = textarea.selectionEnd;
                                const before = text.slice(0, start);
                                const after = text.slice(end);
                                const updatedText = before + emoji + after;
                                setText(updatedText);

                                // Move cursor after inserted emoji
                                setTimeout(() => {
                                    textarea.focus();
                                    textarea.selectionStart = textarea.selectionEnd =
                                        start + emoji.length;
                                }, 0);
                            }}
                        />
                    </div>
                )}

                {/* Action Icons */}
                <div className="flex items-center gap-4 mt-4 text-yellow-400 flex-wrap">
                    <button
                        title="Attach Photo or Video"
                        onClick={() => fileInputRef.current.click()}
                        className="hover:text-yellow-200 transition"
                    >
                        <FiImage size={20} />
                    </button>
                    <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        hidden
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />

                    <button
                        title="Add Emoji"
                        onClick={() => setShowEmojiPopover((prev) => !prev)}
                        className="hover:text-yellow-200 transition"
                    >
                        <FiSmile size={20} />
                    </button>

                    <button
                        title="Create Poll"
                        onClick={() => {
                            setShowPoll(true);
                            setPollOptions(["", ""]);
                        }}
                        className="hover:text-yellow-200 transition"
                    >
                        <FiBarChart2 size={20} />
                    </button>

                    <button
                        title="Schedule Post"
                        onClick={() => setShowDatePicker((prev) => !prev)}
                        className="hover:text-yellow-200 transition"
                    >
                        <FiCalendar size={20} />
                    </button>
                </div>

                {/* Post Button */}
                <div className="mt-6 text-right">
                    <button
                        onClick={handlePost}
                        className="bg-yellow-500 text-neutral-900 font-semibold px-4 py-2 rounded-full hover:bg-yellow-400 transition"
                    >
                        Post
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PostModal;
