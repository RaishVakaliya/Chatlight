import { X } from "lucide-react";
import { getProfilePicture } from "../lib/utils";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = ({ onProfileClick }) => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  return (
    <>
      <div className="p-1 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-base-200 p-2 rounded-lg transition-colors"
            onClick={onProfileClick}
          >
            {/* Avatar */}
            <div className="avatar">
              <div className="size-10 rounded-full relative select-none">
                <img
                  src={getProfilePicture(selectedUser.profilePic)}
                  alt={selectedUser.fullName}
                />
              </div>
            </div>

            {/* User info */}
            <div> 
              <h3 className="font-medium">{selectedUser.fullName}</h3>
              <p className="text-sm text-base-content/70">
                {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => setSelectedUser(null)}
            className="p-2 hover:bg-base-200 rounded-lg transition-colors"
          >
            <X />
          </button>
        </div>
      </div>
    </>
  );
};
export default ChatHeader;
