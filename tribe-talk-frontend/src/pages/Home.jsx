import { useContext, useEffect, useState, useCallback } from "react";
import { AiOutlineGithub } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
import { FiUser, FiLock } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Logo from "/src/assets/logo.png";
import axiosInstance from "../services/axiosInstance";
import CreateAccountModal from "../components/CreateAccountModal";
import { AuthContext } from "../auth/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || window.location.origin;
const GITHUB_AUTH_URL = `${API_BASE_URL}/oauth2/authorization/github`;
const GOOGLE_AUTH_URL = `${API_BASE_URL}/oauth2/authorization/google`;

function Home() {
    const { isAuthenticated, setIsAuthenticated, loading, user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [showModal, setShowModal] = useState(false);
    const [justLoggedIn, setJustLoggedIn] = useState(false);
    const [loginForm, setLoginForm] = useState({ username: "", password: "" });

    /**
     * Redirect user if authenticated
     */
    useEffect(() => {
        if (!loading && isAuthenticated && !justLoggedIn) {
            toast.info("Redirecting to your Home page");
            navigate("/main", { replace: true });
        }
    }, [loading, isAuthenticated, navigate]);

    /**
     * Update login form state
     */
    const handleLoginChange = (e) => {
        const { name, value } = e.target;
        setLoginForm((prev) => ({ ...prev, [name]: value }));
    };

    /**
     * Generic OAuth redirect handler
     */
    const handleOAuthLogin = useCallback((url) => {
        // Use replace() instead of href to avoid React Router warnings
        window.location.replace(url);
    }, []);

    /**
     * Manual login handler
     */
    const handleLoginSubmit = async (e) => {
        e.preventDefault();

        const { username, password } = loginForm;

        if (!username.trim() || !password.trim()) {
            toast.warn("Please fill in both email and password.");
            return;
        }

        try {
            const loginResponse = await axiosInstance.post("/api/auth/login", {
                username,
                password,
            });

            const loggedData = {
                username: loginResponse.data.token,
                userId: loginResponse.data.userId
            };

            console.log("Login response:", loginResponse.data);
            setJustLoggedIn(true);
            setIsAuthenticated(true);
            setUser(loggedData);
            toast.success("Login successful!");
            navigate("/main", { replace: true });
        } catch (error) {
            console.error(error);
            const message =
                error?.response?.data?.token ||
                "Login failed. Please try again.";
            toast.error(message);
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen w-full bg-neutral-900 text-yellow-100">
            {/* Left side */}
            <div className="w-full md:w-1/2 flex items-center justify-center px-6 md:px-12 py-12">
                <img
                    src={Logo}
                    alt="TribeTalk Logo"
                    className="w-[300px] md:w-[450px] h-auto object-contain"
                />
            </div>

            {/* Right side */}
            <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 md:px-12 py-12 space-y-8">
                <h2 className="text-3xl md:text-4xl font-bold text-center">
                    Sign up to start your journey
                </h2>

                <div className="text-sm text-yellow-300 text-center max-w-md">
                    <p>
                        By signing up you agree to the{" "}
                        <Link className="underline text-yellow-100 hover:text-yellow-200" to="/terms">
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link className="underline text-yellow-100 hover:text-yellow-200" to="/privacy">
                            Privacy Policy
                        </Link>
                        .
                    </p>
                </div>

                {/* Social Auth Buttons */}
                <div className="w-full max-w-md space-y-4">
                    <button
                        className="cursor-pointer w-full flex items-center justify-center gap-3 px-4 py-1 bg-white text-neutral-900 rounded-full border border-gray-300 shadow-sm hover:bg-yellow-100 transition"
                        type="button"
                        onClick={() => handleOAuthLogin(GOOGLE_AUTH_URL)}
                    >
                        <FcGoogle className="text-xl" />
                        <span className="font-medium">Sign in with Google</span>
                    </button>

                    <button
                        className="cursor-pointer w-full flex items-center justify-center gap-3 px-4 py-1 bg-white text-neutral-900 rounded-full border border-gray-300 shadow-sm hover:bg-yellow-100 transition"
                        type="button"
                        onClick={() => handleOAuthLogin(GITHUB_AUTH_URL)}
                    >
                        <AiOutlineGithub className="text-xl" />
                        <span className="font-medium">Sign in with Github</span>
                    </button>

                    <button
                        className="cursor-pointer w-full flex items-center justify-center gap-3 px-4 py-1 bg-white text-neutral-900 rounded-full border border-gray-300 shadow-sm hover:bg-yellow-100 transition"
                        onClick={() => setShowModal(true)}
                    >
                        <span className="font-medium">Create account</span>
                    </button>
                </div>

                {/* Divider */}
                <div className="flex items-center w-full max-w-md gap-2">
                    <div className="grow h-px bg-yellow-700" />
                    <span className="text-sm text-yellow-400">Already have an account?</span>
                    <div className="grow h-px bg-yellow-700" />
                </div>

                {/* Login Form */}
                <form className="w-full max-w-md space-y-4" onSubmit={handleLoginSubmit}>
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
                        className="cursor-pointer w-full flex items-center justify-center gap-3 px-4 py-1 rounded-full border border-gray-300 shadow-sm transition"
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