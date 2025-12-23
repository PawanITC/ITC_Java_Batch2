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
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PostModal from "./Post/PostModal";
import { toast } from "react-toastify";
import { AuthContext } from "../auth/AuthContext";
import axiosInstance from "../services/axiosInstance";
import { GlobalContext } from "./GlobalContext";

function Sidebar() {
  const navItems = [
    { icon: <FiHome />, label: "Home" },
    { icon: <FiSearch />, label: "Explore" },
    { icon: <FiBell />, label: "Notifications" },
    { icon: <FiMail />, label: "Messages" },
    { icon: <FiBookmark />, label: "Bookmarks" },
    // { icon: <HiOutlineUserGroup />, label: "Communities" },
    { icon: <FiUser />, label: "Profile" },
  ];

  const [showAccountMenu, setShowAccountMenu] = useState(false);
  //const [showPostModal, setShowPostModal] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, setIsAuthenticated, user, setUser } =
    useContext(AuthContext);
  const { unReadNotificationCount, openPostModal, userProfile } = useContext(GlobalContext);
  const logoutHandler = async (e) => {
    try {
      const response = await axiosInstance.post("/api/auth/logout", {});
      setIsAuthenticated(false);
      setUser(null);
      toast.info("You have been logged out");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };
  return (
    <aside className="fixed top-0 left-0 h-screen w-20 md:w-64 bg-white dark:bg-neutral-900 text-gray-900 dark:text-yellow-100 border-r border-yellow-800 px-2 md:px-6 py-4 z-50">
      <div className="flex flex-col w-full h-full justify-between">
        {/* Top: Logo and Navigation */}
        <div className="flex flex-col md:space-y-6">
          <div className="flex justify-center md:justify-start mb-6 items-center align-center self-center" >
            <Link to="/main">
              <img
                src={logo}
                alt="TribeTalk Logo"
                className="w-10 h-10 md:w-32 md:h-auto rounded-md mt-3 shadow-[0px_20px_30px_-10px_rgb(38,57,77)] dark:shadow-none cursor-pointer hover:opacity-80 transition"
              />
            </Link>
          </div>

          <nav className="flex flex-col justify-center mt-2 items-center md:items-start gap-6 md:gap-4 grow">
            {navItems.map(({ icon, label }, idx) => {
              // Determine the navigation path
              let path;
              if (label === "Home") {
                path = "/main";
              } else if (label === "Profile") {
                path = `/profile/${user?.userId || ''}`;
              } else {
                path = `/${label.toLowerCase()}`;
              }

              return (
                <Link
                  to={path}
                  key={idx}
                  className="w-full flex flex-col md:flex-row items-center md:items-start gap-0 md:gap-4 px-2 py-2 rounded-md hover:bg-yellow-700 hover:text-white dark:hover:bg-neutral-800 dark:hover:text-yellow-200 transition"
                >
                  {label === "Notifications" && (
                    <div className="relative">
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                        {unReadNotificationCount}
                      </span>
                      <span className="text-xl">{icon}</span>
                    </div>
                  )}
                  {label !== "Notifications" && (
                    <span className="text-xl">{icon}</span>
                  )}
                  <span className="hidden md:inline text-sm font-medium">
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="flex justify-center md:justify-start mt-6">
            <button
              // onClick={() => setShowPostModal(true)}
              onClick={openPostModal}
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
              {/* User Avatar */}
              {userProfile?.profileImageUrl && userProfile.profileImageUrl.trim() !== "" ? (
                <img
                  src={`${userProfile.profileImageUrl}?t=${Date.now()}`}
                  alt={userProfile.displayname || "User"}
                  className="w-10 h-10 rounded-full object-cover border border-yellow-500"
                  loading="lazy"
                  key={userProfile.profileImageUrl}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center border border-yellow-500">
                  <FiUser className="text-neutral-900" size={20} />
                </div>
              )}
              <div className="hidden md:flex flex-col">
                {/* <span className="text-sm font-semibold">
                  {loggedUser?.displayname || ""}
                </span>
                <span className="text-xs text-yellow-400 dark:text-gray-600">
                  @{loggedUser?.username || ""}
                </span> */}

                <span className="text-sm font-semibold">{userProfile?.displayname || ''}</span>
                <span className="text-xs text-yellow-400 dark:text-gray-600">{'@' + (userProfile?.username || '')}</span>
              </div>
            </div>
          </button>

          {showAccountMenu && (
            <div className="absolute bottom-16 left-4 bg-white dark:bg-neutral-900 text-gray-900 dark:text-yellow-100 rounded-md shadow-lg border border-yellow-700 w-64 z-50">
              <button
                className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:bg-neutral-800 transition"
                onClick={logoutHandler}
              >
                Log out{" "}
                <span className="text-yellow-400 dark:text-gray-600">
                  {"@" + (userProfile?.username || "")}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
      {/* {showPostModal && <PostModal onClose={() => setShowPostModal(false)} userDetails={userDetails}/>} */}
    </aside>
  );
}

export default Sidebar;
