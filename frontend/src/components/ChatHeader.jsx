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
            role="button"
            tabIndex={0}
            aria-label={`View ${selectedUser.fullName}'s contact info`}
            className="flex items-center gap-3 cursor-pointer hover:bg-base-200 p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={onProfileClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onProfileClick();
              }
            }}
          >
            <div className="avatar">
              <div className="size-10 rounded-full relative select-none">
                <img
                  src={getProfilePicture(selectedUser.profilePic)}
                  alt={selectedUser.fullName}
                />
              </div>
            </div>

            <div>
              <h3 className="font-medium">{selectedUser.fullName}</h3>
              <p className="text-sm text-base-content/70">
                {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedUser(null)}
            aria-label="Close conversation"
            className="p-2 hover:bg-base-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <X />
          </button>
        </div>
      </div>
    </>
  );
};
export default ChatHeader;
