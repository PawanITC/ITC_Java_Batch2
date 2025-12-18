import { useState } from "react";
import { FiUser } from "react-icons/fi";

function UserCard({ user, isFollowing, onToggleFollow }) {
  const [hover, setHover] = useState(false);

  const hasImage =
    user?.profilePictureUrl &&
    typeof user.profilePictureUrl === "string" &&
    user.profilePictureUrl.trim() !== "";

  return (
    <div
      className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-neutral-800 border border-yellow-700/40"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* LEFT SIDE */}
      <div className="flex items-center gap-3">
        {/* PROFILE IMAGE OR FALLBACK */}
        {hasImage ? (
          <img
            src={user.profilePictureUrl}
            alt={user.username}
            className="w-10 h-10 rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
            <FiUser className="text-neutral-900 dark:text-neutral-200" />
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
          onClick={onToggleFollow}
          className={`px-3 py-1 rounded-full text-sm font-medium transition
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
