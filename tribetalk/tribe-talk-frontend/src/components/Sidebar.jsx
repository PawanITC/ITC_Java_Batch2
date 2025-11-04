import {
  FiHome,
  FiSearch,
  FiBell,
  FiMail,
  FiBookmark,
  FiUser,
} from "react-icons/fi";
import { HiOutlineUserGroup } from "react-icons/hi";
import { MdOutlinePostAdd } from "react-icons/md";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PostModal from "./Post/PostModal";

function Sidebar() {
  const navItems = [
    { icon: <FiHome />, label: "Home" },
    { icon: <FiSearch />, label: "Explore" },
    { icon: <FiBell />, label: "Notifications" },
    { icon: <FiMail />, label: "Messages" },
    { icon: <FiBookmark />, label: "Bookmarks" },
    { icon: <HiOutlineUserGroup />, label: "Communities" },
    { icon: <FiUser />, label: "Profile" },
  ];

  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const navigate = useNavigate();

  return (
    <aside className="fixed top-0 left-0 h-screen w-20 md:w-64 bg-neutral-900 text-yellow-100 border-r border-yellow-800 px-2 md:px-6 py-4 z-50">
      <div className="flex flex-col h-full justify-between">
        {/* Top: Logo and Navigation */}
        <div className="flex flex-col md:space-y-6">
          <div className="flex justify-center md:justify-start mb-6 h-20 items-center">
            <img
              src={logo}
              alt="TribeTalk Logo"
              className="w-10 h-10 md:w-32 md:h-auto"
            />
          </div>

          <nav className="flex flex-col justify-center items-center md:items-start gap-6 md:gap-4 grow">
            {navItems.map(({ icon, label }, idx) => (
              <Link
                to={label === "Home" ? "/main" : `/${label.toLowerCase()}`}
                key={idx}
                className="flex flex-col md:flex-row items-center md:items-start gap-0 md:gap-4 px-2 py-2 rounded-md hover:bg-yellow-700 transition"
              >
                <span className="text-xl">{icon}</span>
                <span className="hidden md:inline text-sm font-medium">
                  {label}
                </span>
              </Link>
            ))}
          </nav>

          <div className="flex justify-center md:justify-start mt-6">
            <button
              onClick={() => setShowPostModal(true)}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-yellow-500 text-neutral-900 font-semibold rounded-full hover:bg-yellow-400 transition"
            >
              <MdOutlinePostAdd className="text-xl" />
              <span className="hidden md:inline">Post</span>
            </button>
          </div>
        </div>

        {/* Bottom: Profile */}
        <div className="relative">
          <button
            onClick={() => setShowAccountMenu((prev) => !prev)}
            className="w-full text-left"
          >
            <div className="flex items-center justify-center md:justify-start gap-3 py-4 border-t border-yellow-800">
              <img
                src="https://images.unsplash.com/photo-1536164261511-3a17e671d380?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=682"
                alt="Default Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="hidden md:flex flex-col">
                <span className="text-sm font-semibold">User</span>
                <span className="text-xs text-yellow-400">@username</span>
              </div>
            </div>
          </button>

          {showAccountMenu && (
            <div className="absolute bottom-16 left-4 bg-neutral-900 text-yellow-100 rounded-md shadow-lg border border-yellow-700 w-64 z-50">
              <button
                className="w-full text-left px-4 py-3 hover:bg-neutral-800 transition"
                onClick={() => {
                  localStorage.removeItem("accessToken");
                  console.log("Logged out");
                  navigate("/");
                }}
              >
                Log out <span className="text-yellow-400">@user</span>
              </button>
            </div>
          )}
        </div>
      </div>
      {showPostModal && <PostModal onClose={() => setShowPostModal(false)} />}
    </aside>
  );
}

export default Sidebar;
