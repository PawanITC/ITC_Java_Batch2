import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import "react-toastify/dist/ReactToastify.css";

function CreateAccountModal({ onClose }) {
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);

    const BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { username, email, password, confirmPassword } = form;

        // Basic validation
        if (
            !username.trim() ||
            !email.trim() ||
            !password.trim() ||
            !confirmPassword.trim()
        ) {
            toast.warn("Please fill in all fields");
            return;
        }

        if (password !== confirmPassword) {
            toast.warn("Passwords do not match.");
            return;
        }

        const strongPasswordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!strongPasswordRegex.test(password)) {
            toast.warn(
                "Use at least 8 characters with uppercase, lowercase, number, and special symbol."
            );
            return;
        }

        try {


            const response = await axios.post(
                `${BASE_URL}/api/users/save`,  // Keep /api here since this uses axios directly, not axiosInstance
                { username, email, password }  // Fixed: send as object
            );

            if (response?.status === 201 || response?.status === 200) {
                toast.success("User registered successfully!");
                onClose();
            } else {
                toast.error("Unexpected response. Please try again.");
            }
        } catch (error) {
            const status = error?.response?.status;
            const message = error?.response?.data?.message;

            const errorMessages = {
                400: "Invalid input. Please check your details.",
                409: "Email already exists.",
                500: "Server error. Please try again later.",
            };

            if (!status) {
                toast.error("Network error. Please check your connection.");
            } else {
                toast.error(
                    errorMessages[status] ||
                    message ||
                    "Registration failed. Please try again."
                );
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <form
                onSubmit={handleSubmit}
                className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-yellow-100 rounded-lg p-6 w-full max-w-md space-y-5 shadow-xl border border-yellow-700"
            >
                <h2 className="text-2xl font-bold text-center text-yellow-300">
                    Create Your Account
                </h2>

                {/* Username */}
                <div className="flex items-center border border-yellow-500 rounded-md bg-white dark:bg-neutral-900 px-3 py-2">
                    <FiUser className="text-yellow-400 dark:text-gray-600 mr-2" />
                    <input
                        type="text"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        placeholder="Username"
                        className="bg-transparent w-full text-gray-900 dark:text-yellow-100 placeholder-yellow-400 focus:outline-none"
                    />
                </div>

                {/* Email */}
                <div className="flex items-center border border-yellow-500 rounded-md bg-white dark:bg-neutral-900 px-3 py-2">
                    <FiMail className="text-yellow-400 dark:text-gray-600 mr-2" />
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Email"
                        className="bg-transparent w-full text-gray-900 dark:text-yellow-100 placeholder-yellow-400 focus:outline-none"
                    />
                </div>

                {/* Password */}
                <div
                    className="relative flex items-center border border-yellow-500 rounded-md bg-white dark:bg-neutral-900 px-3 py-2">
                    <FiLock className="text-yellow-400 dark:text-gray-600 mr-2" />
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Password"
                        className="bg-transparent w-full text-gray-900 dark:text-yellow-100 placeholder-yellow-400 focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 text-yellow-400 dark:text-gray-600"
                    >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                </div>

                {/* Confirm Password */}
                <div
                    className="relative flex items-center border border-yellow-500 rounded-md bg-white dark:bg-neutral-900 px-3 py-2">
                    <FiLock className="text-yellow-400 dark:text-gray-600 mr-2" />
                    <input
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm Password"
                        className="bg-transparent w-full text-gray-900 dark:text-yellow-100 placeholder-yellow-400 focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 text-yellow-400 dark:text-gray-600"
                    >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                </div>

                {/* Buttons */}
                <div className="flex justify-between mt-6">
                    <button
                        className="cursor-pointer px-4 py-2 border border-yellow-500 text-yellow-300 rounded-md hover:bg-yellow-100 hover:text-neutral-900 transition"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className={
                            "cursor-pointer px-4 py-2 font-semibold rounded-md transition"
                        }
                    >
                        "Submit"
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreateAccountModal;
