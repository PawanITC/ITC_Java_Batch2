import { useState } from "react";
import axios from "axios";
import { AiOutlineGithub } from "react-icons/ai";
import { FiUser, FiLock } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import CreateAccountModal from "../components/CreateAccountModal";
import { toast } from "react-toastify";
import Logo from "/src/assets/logo.png";
import axiosInstance from "../services/axiosInstance";

function Home() {
  const [showModal, setShowModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const navigate=useNavigate();
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGithubLogin = async (e) => {
    e.preventDefault();
    const BACKEND_URL=import.meta.env.VITE_API_BASE_URL;
    const GITHUB_CLIENT_ID=import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUrl=`http://localhost:8080/api/github/callback`;
    const githubAuthUrl=`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email`;
    window.location.href="http://localhost:8080/oauth2/authorization/github";
    
  }
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    const { username, password } = loginForm;

    // Basic validation
    if (!username.trim() || !password.trim()) {
      toast.warn("Please fill in both email and password.");
      return;
    }

    try {
      const response = await axiosInstance.post('/auth/login', {
        username: username,
        password: password,
      });
      const token = response?.data?.token;
      if (!token) {
        toast.error("Unexpected response. Please try again.");
        return;
      }
      toast.success("Login successful!");
      navigate('/mainpage');
      // Optional: redirect or fetch user profile here
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message || "Login failed. Please try again.";
      if(message){
        toast.error(message);  
        return;
      }
      if (!status) {
        toast.error("Network error. Please check your connection.");
        return;
      }
      toast.error("Login failed. Please try again.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-neutral-900 text-yellow-100">
      {/* Left side: Logo */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 md:px-12 py-12">
        <img
          src={Logo}
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
          <button className="cursor-pointer w-full max-w-md flex items-center justify-center gap-3 px-4 py-1 bg-white text-neutral-900 rounded-full border border-gray-300 shadow-sm hover:bg-yellow-100 transition duration-200" type="button" onClick={handleGithubLogin}>
            <AiOutlineGithub className="text-xl" />
            <span className="font-medium">Sign in with Github</span>
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

        <form
          className="w-full max-w-md space-y-4"
          onSubmit={handleLoginSubmit}
        >
          <div className="flex items-center border border-yellow-500 rounded-md bg-neutral-900 px-3 py-2">
            <FiUser className="text-yellow-400 mr-2" />
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={loginForm.username}
              onChange={handleLoginChange}
              placeholder="Enter your username"
              className="bg-transparent w-full text-yellow-100 placeholder-yellow-400 focus:outline-none"
            />
          </div>
          <div className="flex items-center border border-yellow-500 rounded-md bg-neutral-900 px-3 py-2">
            <FiLock className="text-yellow-400 mr-2" />
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={loginForm.password}
              onChange={handleLoginChange}
              placeholder="Enter your password"
              className="bg-transparent w-full text-yellow-100 placeholder-yellow-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className={
              "cursor-pointer w-full flex items-center justify-center gap-3 px-4 py-1 rounded-full border border-gray-300 shadow-sm transition duration-200"
            }
          >
            <span className="font-medium">Sign In</span>
          </button>
        </form>
      </div>

      {showModal && <CreateAccountModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

export default Home;
