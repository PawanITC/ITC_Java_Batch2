import { useState ,useContext} from "react";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { FiX, FiCamera } from "react-icons/fi";
import { AuthContext } from "../../auth/AuthContext";

function EditProfileModal({ userDetails, onClose, onSaved }) {

  const { user } = useContext(AuthContext);

  const userId = user?.userId;
  console.log("Display name is ",user.user);
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
        `/api/users/user-profile/${userDetails.userId}`, // ✅ fixed path
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success("Profile updated");
      onSaved(res.data);
      onClose();
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-start z-50">
      <div className="bg-neutral-900 w-full max-w-xl rounded-xl mt-10 overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-700">
          <FiX onClick={onClose} className="cursor-pointer" />
          <h3 className="font-semibold">Edit profile</h3>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-yellow-500 text-neutral-900 px-4 py-1 rounded-full font-semibold"
          >
            Save
          </button>
        </div>

        {/* Cover */}
        <div className="relative h-40 bg-neutral-800">
          {coverImage && (
            <img
              src={URL.createObjectURL(coverImage)}
              className="w-full h-full object-cover"
              alt="Cover preview"
            />
          )}

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
                    : userDetails?.profileImageUrl
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
            className="w-full bg-neutral-800 p-3 rounded"
          />

          <textarea
            placeholder="Bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="w-full bg-neutral-800 p-3 rounded"
          />

          <input
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full bg-neutral-800 p-3 rounded"
          />
        </div>
      </div>
    </div>
  );
}

export default EditProfileModal;
