import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatMessageTime } from "../lib/utils";

const ReplyMessage = ({ replyTo, onClick }) => {
  const { authUser } = useAuthStore();
  const { selectedUser } = useChatStore();

  if (!replyTo) return null;

  const isOwnReply = replyTo.senderId._id === authUser._id;
  const senderName = isOwnReply ? "You" : (replyTo.senderId.fullName || selectedUser?.fullName || "Unknown");

  return (
    <div 
      className="bg-base-200/50 border-l-4 border-primary rounded-lg p-2 mb-2 cursor-pointer hover:bg-base-200/70 transition-colors touch-manipulation"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full overflow-hidden flex-shrink-0">
          <img
            src={replyTo.senderId.profilePic || "/avatar.png"}
            alt="Reply sender"
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-xs font-medium text-primary truncate">
          {senderName}
        </span>
        <span className="text-xs text-base-content/50 hidden sm:inline">
          {formatMessageTime(replyTo.createdAt)}
        </span>
      </div>
      
      <div className="pl-4 sm:pl-6">
        {replyTo.image && (
          <img
            src={replyTo.image}
            alt="Reply attachment"
            className="max-w-12 max-h-12 sm:max-w-16 sm:max-h-16 rounded object-cover mb-1"
          />
        )}
        {replyTo.text && (
          <p className="text-xs sm:text-sm text-base-content/80 overflow-hidden text-ellipsis" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {replyTo.text}
          </p>
        )}
        {!replyTo.text && !replyTo.image && (
          <p className="text-xs sm:text-sm text-base-content/60 italic">
            Message
          </p>
        )}
      </div>
    </div>
  );
};

export default ReplyMessage;
