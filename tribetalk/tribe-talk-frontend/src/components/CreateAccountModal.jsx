import { useState } from "react";

function CreateAccountModal({ onClose }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    dob: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-neutral-900 text-yellow-100 rounded-lg p-6 w-full max-w-md space-y-5 shadow-xl border border-yellow-700">
        <h2 className="text-2xl font-bold text-center text-yellow-300">
          Create Your Account
        </h2>

        {/* Name */}
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Name"
          className="w-full px-4 py-2 rounded-md border border-yellow-500 bg-neutral-900 text-yellow-100 placeholder-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 transition"
        />

        {/* Email */}
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full px-4 py-2 rounded-md border border-yellow-500 bg-neutral-900 text-yellow-100 placeholder-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 transition"
        />

        {/* Password */}
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Password"
          className="w-full px-4 py-2 rounded-md border border-yellow-500 bg-neutral-900 text-yellow-100 placeholder-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 transition"
        />

        {/* Date of Birth */}
        <div>
          <label className="block text-sm text-yellow-300 mb-1">
            Date of Birth
          </label>
          <input
            type="date"
            name="dob"
            value={form.dob}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-md border border-yellow-500 bg-neutral-900 text-yellow-100 placeholder-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 transition"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-between mt-6">
          <button
            className="cursor-pointer px-4 py-2 border border-yellow-500 text-yellow-300 rounded-md hover:bg-yellow-100 hover:text-neutral-900 transition"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="cursor-pointer px-4 py-2 bg-yellow-500 text-neutral-900 font-semibold rounded-md hover:bg-yellow-400 transition">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateAccountModal;
