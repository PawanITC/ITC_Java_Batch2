import { FiHome, FiUser } from "react-icons/fi";
import logo from "../assets/logo.png";
function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col justify-between h-screen w-64 bg-neutral-900 text-yellow-100 px-6 py-4 border-r border-yellow-800 fixed left-0 top-0 z-40">
      <div className="space-y-8">
        <nav className="flex flex-col space-y-4">
          <button className="cursor-pointer flex flex-col"></button>
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;
