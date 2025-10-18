import { ArrowLeft, Phone, Video, MoreVertical } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const UserProfileModal = ({ isOpen, onClose, user }) => {
  const { onlineUsers } = useAuthStore();

  if (!isOpen || !user) return null;

  const isOnline = onlineUsers.includes(user._id);

  return (
    <div className="flex-1 flex flex-col overflow-auto bg-base-100">
      {/* Header */}
      <div className="p-4 border-b border-base-300 bg-base-200">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-base-300 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold">Contact Info</h2>
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Profile Picture and Basic Info */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <img
              src={user.profilePic || "/avatar.png"}
              alt={user.fullName}
              className="w-40 h-40 rounded-full object-cover border-4 border-base-300 select-none"
            />
            {/* Online status indicator */}
            <div
              className={`absolute bottom-4 right-4 w-8 h-8 rounded-full border-4 border-base-100 ${
                isOnline ? "bg-green-500" : "bg-gray-400"
              }`}
            />
          </div>
          
          <div>
            <h3 className="text-2xl font-semibold">{user.fullName}</h3>
          </div>
        </div>

        {/* Description */}
        {user.description && (
          <div className="space-y-3">
            <h4 className="text-base font-medium text-base-content/70">About</h4>
            <p className="text-base bg-base-200 p-4 rounded-lg">
              {user.description}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <button className="w-full flex items-center gap-4 p-4 bg-base-200 hover:bg-base-300 rounded-lg transition-colors">
            <Phone className="w-6 h-6 text-primary" />
            <span className="text-base">Voice Call</span>
          </button>
          
          <button className="w-full flex items-center gap-4 p-4 bg-base-200 hover:bg-base-300 rounded-lg transition-colors">
            <Video className="w-6 h-6 text-primary" />
            <span className="text-base">Video Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
