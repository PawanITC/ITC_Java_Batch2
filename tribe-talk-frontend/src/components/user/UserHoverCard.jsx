function UserHoverCard({ user }) {
  if (!user) return null;

  return (
    <div className="absolute z-50 w-72 bg-neutral-900 border border-yellow-700/40 rounded-xl shadow-xl p-4">
      <div className="flex gap-3">
        <img
          src={user.profileImage}
          alt="avatar"
          className="w-12 h-12 rounded-full object-cover"
        />

        <div>
          <p className="font-semibold text-yellow-100">
            {user.displayname}
          </p>
          <p className="text-sm text-yellow-400">
            @{user.username}
          </p>
        </div>
      </div>

      {user.bio && (
        <p className="text-sm mt-3 text-yellow-200">
          {user.bio}
        </p>
      )}

      <div className="flex gap-4 mt-3 text-sm text-yellow-300">
        <span>
          <strong className="text-yellow-100">
            {user.followingCount}
          </strong>{" "}
          Following
        </span>
        <span>
          <strong className="text-yellow-100">
            {user.followersCount}
          </strong>{" "}
          Followers
        </span>
      </div>
    </div>
  );
}

export default UserHoverCard;
