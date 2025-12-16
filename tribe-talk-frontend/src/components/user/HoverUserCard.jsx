import { useState } from "react";
import axiosInstance from "../../services/axiosInstance";

function HoverUserCard({ userId, children }) {
  const [hoverData, setHoverData] = useState(null);
  const [open, setOpen] = useState(false);

  const handleEnter = async () => {
    setOpen(true);
    if (hoverData) return;

    const [followers, following] = await Promise.all([
      axiosInstance.get(`/api/users/${userId}/followers-count`),
      axiosInstance.get(`/api/users/${userId}/following-count`)
    ]);

    setHoverData({
      followers: followers.data,
      following: following.data,
    });
  };

  return (
    <div
      onMouseEnter={handleEnter}
      onMouseLeave={() => setOpen(false)}
      className="relative"
    >
      {children}

      {open && hoverData && (
        <div className="absolute top-14 left-0 bg-neutral-900 border border-yellow-700 rounded-xl p-4 w-64 z-50">
          <p className="font-semibold mb-2">Connections</p>
          <div className="flex gap-4 text-sm">
            <span><strong>{hoverData.followers}</strong> Followers</span>
            <span><strong>{hoverData.following}</strong> Following</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default HoverUserCard;
