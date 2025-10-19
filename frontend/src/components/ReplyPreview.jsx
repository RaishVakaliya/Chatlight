import { X, Reply } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const ReplyPreview = () => {
  const { replyingTo, clearReplyingTo, selectedUser } = useChatStore();
  const { authUser } = useAuthStore();

  if (!replyingTo) return null;

  const isOwnMessage = replyingTo.senderId === authUser._id;
  const senderName = isOwnMessage ? "You" : selectedUser?.fullName || "Unknown";

  return (
    <div className="bg-base-200 border-t border-base-300 p-2 sm:p-3">
      <div className="flex items-start gap-2 sm:gap-3">
        <Reply className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs sm:text-sm font-medium text-primary truncate">
              Replying to {senderName}
            </span>
          </div>
          
          <div className="bg-base-100 rounded-lg p-2 border-l-4 border-primary">
            {replyingTo.image && (
              <img
                src={replyingTo.image}
                alt="Reply preview"
                className="max-w-12 max-h-12 sm:max-w-16 sm:max-h-16 rounded object-cover mb-1"
              />
            )}
            {replyingTo.text && (
              <p className="text-xs sm:text-sm text-base-content/80 overflow-hidden text-ellipsis" style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {replyingTo.text}
              </p>
            )}
            {!replyingTo.text && !replyingTo.image && (
              <p className="text-xs sm:text-sm text-base-content/60 italic">
                Message
              </p>
            )}
          </div>
        </div>

        <button
          onClick={clearReplyingTo}
          className="p-1 hover:bg-base-300 rounded-full transition-colors flex-shrink-0 touch-manipulation"
          title="Cancel reply"
        >
          <X className="w-4 h-4 text-base-content/60" />
        </button>
      </div>
    </div>
  );
};

export default ReplyPreview;
