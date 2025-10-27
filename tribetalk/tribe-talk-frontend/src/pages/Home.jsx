import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FiMail, FiLock } from "react-icons/fi";
import { Link } from "react-router-dom";
import CreateAccountModal from "../components/CreateAccountModal";

function Home() {
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-neutral-900 text-yellow-100">
      {/* Left side: Logo */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 md:px-12 py-12">
        <img
          src="/src/assets/logo.png"
          alt="TribeTalk Logo"
          className="w-[300px] md:w-[450px] h-auto object-contain"
        />
      </div>

      {/* Right side: Sign-up*/}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 md:px-12 py-12 space-y-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center">
          Sign up to start your journey
        </h2>

        <div className="text-sm text-yellow-300 text-center max-w-md">
          <p>
            By signing up you agree to the{" "}
            <Link
              to="/terms"
              className="underline text-yellow-100 hover:text-yellow-200 transition duration-200"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="underline text-yellow-100 hover:text-yellow-200 transition duration-200"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div className="w-full max-w-md space-y-4">
          <button className="cursor-pointer w-full max-w-md flex items-center justify-center gap-3 px-4 py-1 bg-white text-neutral-900 rounded-full border border-gray-300 shadow-sm hover:bg-yellow-100 transition duration-200">
            <FcGoogle className="text-xl" />
            <span className="font-medium">Sign in with Google</span>
          </button>

          <button
            className="cursor-pointer w-full max-w-md flex items-center justify-center gap-3 px-4 py-1 bg-white text-neutral-900 rounded-full border border-gray-300 shadow-sm hover:bg-yellow-100 transition duration-200"
            onClick={() => setShowModal(true)}
          >
            <span className="font-medium">Create account</span>
          </button>
        </div>

        <div className="flex items-center w-full max-w-md gap-2">
          <div className="grow h-px bg-yellow-700" />
          <span className="text-sm text-yellow-400">
            Already have an account?
          </span>
          <div className="grow h-px bg-yellow-700" />
        </div>

        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center border border-yellow-500 rounded-md bg-neutral-900 px-3 py-2">
            <FiMail className="text-yellow-400 mr-2" />
            <input
              type="email"
              placeholder="Enter your email"
              className="bg-transparent w-full text-yellow-100 placeholder-yellow-400 focus:outline-none"
            />
          </div>
          <div className="flex items-center border border-yellow-500 rounded-md bg-neutral-900 px-3 py-2">
            <FiLock className="text-yellow-400 mr-2" />
            <input
              type="password"
              placeholder="Enter your password"
              className="bg-transparent w-full text-yellow-100 placeholder-yellow-400 focus:outline-none"
            />
          </div>
          <button className="cursor-pointer w-full max-w-md flex items-center justify-center gap-3 px-4 py-1 bg-white text-neutral-900 rounded-full border border-gray-300 shadow-sm hover:bg-yellow-100 transition duration-200">
            <span className="font-medium">Sign In</span>
          </button>
        </div>
      </div>

      {showModal && <CreateAccountModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

export default Home;
