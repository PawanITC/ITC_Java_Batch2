import { useRef, useState } from "react";
import axiosInstance from "../../services/axiosInstance";
import UserHoverCard from "./HoverUserCard";

const cache = new Map();

function HoverUserWrapper({ userId, children }) {
  const [data, setData] = useState(null);
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const timerRef = useRef(null);

  const fetchHoverData = async () => {
    if (cache.has(userId)) {
      setData(cache.get(userId));
      return;
    }

    try {
      const [profile, followers, following] = await Promise.all([
        axiosInstance.get(`/api/users/user-profile/${userId}`),

        axiosInstance.get(`/api/users/${userId}/followers-count`),
        axiosInstance.get(`/api/users/${userId}/following-count`)
      ]);

      const merged = {
        ...profile.data,
        followersCount: followers.data,
        followingCount: following.data
      };

      cache.set(userId, merged);
      setData(merged);
    } catch (e) {
      console.error("Hover fetch failed", e);
    }
  };

  const handleEnter = (e) => {
    setPos({ x: e.clientX + 12, y: e.clientY + 12 });

    timerRef.current = setTimeout(() => {
      setShow(true);
      fetchHoverData();
    }, 300);
  };

  const handleLeave = () => {
    clearTimeout(timerRef.current);
    setShow(false);
  };

  return (
    <>
      <span
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className="inline-block"
      >
        {children}
      </span>

      {show && (
        <div
          style={{ top: pos.y, left: pos.x }}
          className="fixed z-[9999]"
        >
          <UserHoverCard user={data} />
        </div>
      )}
    </>
  );
}

export default HoverUserWrapper;
