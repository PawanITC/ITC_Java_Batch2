import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../services/axiosInstance";
import { toast } from "react-toastify";

function CreateAccountModal({ onClose }) {
  const navigate=useNavigate();
  const [form, setForm] = useState({
    displayname: "",
    username: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister=async (e)=>{
    e.preventDefault();

    const {displayname,username,email,password}=form;

    if(!username || !email || !password || !displayname){
      toast.warn('Please fill in all fields');
      return false;
    }
    try{
      await axiosInstance.post('/api/users/save',{
        username:username,
        displayname:displayname,
        password:password,
        email:email
      });
      toast.success('Successfully Registered');
      navigate('/main');
    }
    catch(error){
      console.log(error);
      const errorMessage=error.response?.data?.message || 'Unexpected Error, Please try again';
      toast.warn(errorMessage);
    }
  }

  return (
    <form onSubmit={handleRegister}>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-neutral-900 text-yellow-100 rounded-lg p-6 w-full max-w-md space-y-5 shadow-xl border border-yellow-700">
          <h2 className="text-2xl font-bold text-center text-yellow-300">
            Create Your Account
          </h2>

          {/* Display Name */}
          <input
            type="text"
            name="displayname"
            value={form.displayname}
            onChange={handleChange}
            placeholder="Display Name"
            className="w-full px-4 py-2 rounded-md border border-yellow-500 bg-neutral-900 text-yellow-100 placeholder-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 transition"
          />

          {/* Username */}
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Username"
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


          {/* Buttons */}
          <div className="flex justify-between mt-6">
            <button
              className="cursor-pointer px-4 py-2 border border-yellow-500 text-yellow-300 rounded-md hover:bg-yellow-100 hover:text-neutral-900 transition"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="cursor-pointer px-4 py-2 bg-yellow-500 text-neutral-900 font-semibold rounded-md hover:bg-yellow-400 transition" type="submit">
              Submit
            </button>
          </div>
        </div>
      </div>
    </form>
    
  );
}

export default CreateAccountModal;
