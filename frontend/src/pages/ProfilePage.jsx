import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, FileText, Save, Trash2 } from "lucide-react";
import DeleteAccountModal from "../components/DeleteAccountModal";
import toast from "react-hot-toast";
import { getProfilePicture } from "../lib/utils";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [description, setDescription] = useState(authUser?.description || "");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (10MB limit to match backend)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast.error(
        "File size too large. Please select an image smaller than 10MB."
      );
      // Reset the file input
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);

      try {
        await updateProfile({ profilePic: base64Image });
      } catch (error) {
        // Reset selectedImg if upload fails
        setSelectedImg(null);
        // Reset the file input
        e.target.value = "";
      }
    };
  };

  const handleDescriptionSave = async () => {
    await updateProfile({ description });
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setDescription(authUser?.description || "");
    setIsEditingDescription(false);
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold ">Profile</h1>
            <p className="mt-2">Your profile information</p>
          </div>

          {/* avatar upload section */}

          <div className="flex flex-col items-center gap-4">
            <div className="relative select-none">
              <img
                src={selectedImg || getProfilePicture(authUser.profilePic)}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 "
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${
                    isUpdatingProfile ? "animate-pulse pointer-events-none" : ""
                  }
                `}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile
                ? "Uploading..."
                : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {authUser?.fullName}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {authUser?.email}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Description
              </div>
              {isEditingDescription ? (
                <div className="space-y-2">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-2.5 bg-base-200 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                    disabled={isUpdatingProfile}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleDescriptionSave}
                      disabled={isUpdatingProfile}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-content rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {isUpdatingProfile ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={handleDescriptionCancel}
                      disabled={isUpdatingProfile}
                      className="px-4 py-2 bg-base-200 text-base-content rounded-lg hover:bg-base-300 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="px-4 py-2.5 bg-base-200 rounded-lg border flex-1 min-h-[3rem] flex items-center">
                    {authUser?.description || "No description added yet"}
                  </p>
                  <button
                    onClick={() => setIsEditingDescription(true)}
                    className="ml-2 px-3 py-2 bg-primary text-primary-content rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span
                  className={`${
                    authUser.deleted ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {authUser.deleted ? "Deleted" : "Active"}
                </span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">Danger Zone</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-red-200 dark:border-red-800">
                <div>
                  <h3 className="font-medium text-warning">Delete Account</h3>
                  <p className="text-sm mt-1">
                    Permanently delete your account and remove your profile
                    data. Your messages will remain visible to other users.
                  </p>
                </div>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Account Modal */}
        <DeleteAccountModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      </div>
    </div>
  );
};
export default ProfilePage;
