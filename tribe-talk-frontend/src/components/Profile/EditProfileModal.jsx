import { useState, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { FiX, FiCamera } from "react-icons/fi";
import { AuthContext } from "../../auth/AuthContext";
import defaultAvatar from "../../assets/default-avatar.jpg";
import defaultCover from "../../assets/default-cover.jpg";

function EditProfileModal({ userDetails, onClose, onSaved }) {
  const { user } = useContext(AuthContext);
  const userId = user?.userId;

  const [form, setForm] = useState({
    displayName: userDetails?.displayName || "",
    bio: userDetails?.bio || "",
    location: userDetails?.location || "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const data = new FormData();
    data.append("displayName", form.displayName);
    data.append("bio", form.bio);
    data.append("location", form.location);

    if (profileImage) data.append("profileImage", profileImage);
    if (coverImage) data.append("coverImage", coverImage);

    try {
      setLoading(true);

      const res = await axiosInstance.patch(
        `/api/users/user-profile/${userId}`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success("Profile updated");
      onSaved(res.data);
      onClose();
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-start z-50">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-xl rounded-xl mt-10 overflow-hidden text-gray-900 dark:text-yellow-100">

        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-300 dark:border-neutral-700">
          <FiX onClick={onClose} className="cursor-pointer text-gray-900 dark:text-yellow-100" />
          <h3 className="font-semibold text-gray-900 dark:text-yellow-100">Edit profile</h3>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-yellow-500 text-neutral-900 px-4 py-1 rounded-full font-semibold hover:bg-yellow-400 disabled:opacity-50"
          >
            Save
          </button>
        </div>

        {/* Cover */}
        <div className="relative h-40 bg-neutral-200 dark:bg-neutral-800">
          <img
            src={
              coverImage
                ? URL.createObjectURL(coverImage)
                : userDetails?.coverImageUrl || defaultCover
            }
            className="w-full h-full object-cover"
            alt="Cover preview"
          />

          <label className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/40">
            <FiCamera size={22} />
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setCoverImage(e.target.files[0])}
            />
          </label>
        </div>

        {/* Avatar */}
        <div className="relative px-4">
          <div className="absolute -top-12">
            <label className="relative cursor-pointer">
              <img
                src={
                  profileImage
                    ? URL.createObjectURL(profileImage)
                    : userDetails?.profileImageUrl || defaultAvatar
                }
                className="w-24 h-24 rounded-full object-cover border-4 border-neutral-900"
                alt="Avatar preview"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                <FiCamera />
              </div>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setProfileImage(e.target.files[0])}
              />
            </label>
          </div>
        </div>

        {/* Form */}
        <div className="px-4 pt-16 pb-6 space-y-4">
          <input
            placeholder="Display name"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            className="w-full bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-yellow-100 placeholder-gray-500 dark:placeholder-gray-400 p-3 rounded border border-gray-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />

          <textarea
            placeholder="Bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="w-full bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-yellow-100 placeholder-gray-500 dark:placeholder-gray-400 p-3 rounded border border-gray-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            rows="3"
          />

          <input
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-yellow-100 placeholder-gray-500 dark:placeholder-gray-400 p-3 rounded border border-gray-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
      </div>
    </div>
  );
}

export default EditProfileModal;
