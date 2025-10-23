import { useState, useEffect, useRef } from "react";
import { Pin, X, ChevronDown, ChevronUp } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const PinnedMessages = ({ selectedUser }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const pinnedMessagesRef = useRef(null);
  const {
    pinnedMessages,
    getPinnedMessages,
    isPinnedMessagesLoading,
    unpinMessage,
  } = useChatStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    if (selectedUser?._id) {
      getPinnedMessages(selectedUser._id);
    }
  }, [selectedUser?._id, getPinnedMessages]);

  // Handle outside click to close expanded pinned messages
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pinnedMessagesRef.current && !pinnedMessagesRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {``
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  if (!pinnedMessages.length && !isPinnedMessagesLoading) {
    return null;
  }

  const handleUnpin = (messageId, e) => {
    e.stopPropagation();
    unpinMessage(messageId);
  };

  const scrollToMessage = (messageId) => {
    const messageElement = document.querySelector(
      `[data-message-id="${messageId}"]`
    );
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      // Add highlight effect
      messageElement.classList.add("bg-yellow-100", "dark:bg-yellow-900/30");
      setTimeout(() => {
        messageElement.classList.remove(
          "bg-yellow-100",
          "dark:bg-yellow-900/30"
        );
      }, 2000);
    }
  };

  return (
    <div ref={pinnedMessagesRef} className="bg-base-200 border-b border-base-300">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-base-300 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Pin className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            {pinnedMessages.length} Pinned Message
            {pinnedMessages.length !== 1 ? "s" : ""}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-base-content/60" />
        ) : (
          <ChevronDown className="w-4 h-4 text-base-content/60" />
        )}
      </div>

      {/* Pinned Messages List */}
      {isExpanded && (
        <div className="max-h-60 overflow-y-auto">
          {isPinnedMessagesLoading ? (
            <div className="p-4 text-center text-sm text-base-content/60">
              Loading pinned messages...
            </div>
          ) : (
            <div className="space-y-2 p-3 pt-0">
              {pinnedMessages.map((message) => (
                <div
                  key={message._id}
                  className="bg-base-100 rounded-lg p-3 border border-base-300 hover:bg-base-200 transition-colors cursor-pointer group"
                  onClick={() => scrollToMessage(message._id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Sender info */}
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full border overflow-hidden flex-shrink-0">
                          <img
                            src={
                              message.senderId === authUser._id
                                ? authUser.profilePic || "/avatar.png"
                                : selectedUser.profilePic || "/avatar.png"
                            }
                            alt="profile"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs font-medium text-base-content/80">
                          {message.senderId === authUser._id
                            ? "You"
                            : selectedUser.fullName}
                        </span>
                        <span className="text-xs text-base-content/50">
                          {formatMessageTime(message.createdAt)}
                        </span>
                      </div>

                      {/* Message content */}
                      <div className="space-y-1">
                        {message.image && (
                          <img
                            src={message.image}
                            alt="Attachment"
                            className="max-w-20 max-h-20 rounded object-cover"
                          />
                        )}
                        {message.text && (
                          <p
                            className="text-sm text-base-content overflow-hidden text-ellipsis"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {message.text}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Unpin button */}
                    <button
                      onClick={(e) => handleUnpin(message._id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-base-300 rounded transition-all"
                      title="Unpin message"
                    >
                      <X className="w-3 h-3 text-base-content/60" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PinnedMessages;
