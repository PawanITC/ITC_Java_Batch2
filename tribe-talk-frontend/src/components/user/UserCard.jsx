import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser } from "react-icons/fi";

function UserCard({ user, isFollowing, onToggleFollow }) {
  const [hover, setHover] = useState(false);
  const navigate = useNavigate();

  const profileImageUrl = user?.profileImageUrl || user?.profilePictureUrl;
  const hasImage =
    profileImageUrl &&
    typeof profileImageUrl === "string" &&
    profileImageUrl.trim() !== "";

  const handleUserClick = () => {
    if (user?.id) {
      navigate(`/profile/${user.id}`);
    }
  };

  return (
    <div
      className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-neutral-800 border border-yellow-700/40"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* LEFT SIDE */}
      <div
        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
        onClick={handleUserClick}
      >
        {/* PROFILE IMAGE OR FALLBACK */}
        {hasImage ? (
          <img
            src={profileImageUrl}
            alt={user.username}
            className="w-10 h-10 rounded-full object-cover border border-yellow-500"
            loading="lazy"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center border border-yellow-500">
            <FiUser className="text-neutral-900 dark:text-neutral-900" />
          </div>
        )}

        {/* USER INFO */}
        <div>
          <p className="font-semibold text-yellow-700 dark:text-yellow-200">
            {user.displayname}
          </p>
          <p className="text-sm text-yellow-900 dark:text-yellow-200">
            @{user.username}
          </p>
        </div>
      </div>

      {/* FOLLOW BUTTON */}
      {onToggleFollow && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFollow();
          }}
          className={`px-3 py-1 rounded-full text-sm font-medium transition cursor-pointer
            ${isFollowing
              ? hover
                ? "bg-black border border-red-500 text-red-500"
                : "bg-neutral-700 border border-yellow-400 text-yellow-400"
              : "bg-yellow-500 text-neutral-900 hover:bg-yellow-400"
            }`}
        >
          {isFollowing
            ? hover
              ? "Unfollow"
              : "Following"
            : "Follow"}
        </button>
      )}
    </div>
  );
}

export default UserCard;
