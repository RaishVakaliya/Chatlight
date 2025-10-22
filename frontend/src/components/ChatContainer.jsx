import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { Pin } from "lucide-react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import UserProfileModal from "./UserProfileModal";
import ImagePreviewModal from "./ImagePreviewModal";
import PinnedMessages from "./PinnedMessages";
import MessageContextMenu from "./MessageContextMenu";
import ReplyPreview from "./ReplyPreview";
import ReplyMessage from "./ReplyMessage";
import { useAuthStore } from "../store/useAuthStore";
import useBackgroundStore from "../store/useBackgroundStore";
import { formatMessageTime } from "../lib/utils";

// Import background images
import bg1 from "../assets/background/bg1.jpeg";
import bg2 from "../assets/background/bg2.jpeg";
import bg3 from "../assets/background/bg3.jpeg";
import bg4 from "../assets/background/bg4.jpeg";
import bg5 from "../assets/background/bg5.jpeg";
import bg6 from "../assets/background/bg6.jpeg";
import bg7 from "../assets/background/bg7.jpeg";
import bg8 from "../assets/background/bg8.jpeg";
import bg9 from "../assets/background/bg9.jpeg";

const BACKGROUND_IMAGES = [
  { id: "bg1", name: "Background 1", src: bg1 },
  { id: "bg2", name: "Background 2", src: bg2 },
  { id: "bg3", name: "Background 3", src: bg3 },
  { id: "bg4", name: "Background 4", src: bg4 },
  { id: "bg5", name: "Background 5", src: bg5 },
  { id: "bg6", name: "Background 6", src: bg6 },
  { id: "bg7", name: "Background 7", src: bg7 },
  { id: "bg8", name: "Background 8", src: bg8 },
  { id: "bg9", name: "Background 9", src: bg9 },
];

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const { selectedBackground } = useBackgroundStore();
  const messageEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeContextMenu, setActiveContextMenu] = useState(null);

  const scrollToMessage = (messageId) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      // Add highlight effect
      messageElement.classList.add("bg-yellow-100", "dark:bg-yellow-900/30");
      setTimeout(() => {
        messageElement.classList.remove("bg-yellow-100", "dark:bg-yellow-900/30");
      }, 2000);
    }
  };

  useEffect(() => {
    getMessages(selectedUser._id);

    subscribeToMessages();

    // Focus the message input when opening a chat with improved timing
    const focusInput = () => {
      if (messageInputRef.current?.focus) {
        messageInputRef.current.focus();
      }
    };

    // Use multiple timeouts to ensure focus works reliably
    const focusTimeout1 = setTimeout(focusInput, 100);
    const focusTimeout2 = setTimeout(focusInput, 300);

    return () => {
      unsubscribeFromMessages();
      clearTimeout(focusTimeout1);
      clearTimeout(focusTimeout2);
    };
  }, [
    selectedUser._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      // Use setTimeout to ensure DOM is updated before scrolling
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages]);

  // Additional scroll effect for new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    }
  }, [messages.length]);

  // Focus input after messages are loaded
  useEffect(() => {
    if (!isMessagesLoading && messages) {
      setTimeout(() => {
        if (messageInputRef.current?.focus) {
          messageInputRef.current.focus();
        }
      }, 150);
    }
  }, [isMessagesLoading, messages]);

  // Show profile modal if open
  if (isProfileModalOpen) {
    return (
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={selectedUser}
      />
    );
  }

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader onProfileClick={() => setIsProfileModalOpen(true)} />
        <MessageSkeleton />
        <MessageInput ref={messageInputRef} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader onProfileClick={() => setIsProfileModalOpen(true)} />

      {/* Pinned Messages Section */}
      <PinnedMessages selectedUser={selectedUser} />

      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 relative"
        style={{
          backgroundImage: selectedBackground
            ? `url(${
                BACKGROUND_IMAGES.find((bg) => bg.id === selectedBackground)
                  ?.src
              })`
            : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Background overlay for better text readability */}
        {selectedBackground && (
          <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
        )}
        {messages.map((message) => (
          <div
            key={message._id}
            data-message-id={message._id}
            className={`chat ${
              message.senderId === authUser._id ? "chat-end" : "chat-start"
            } relative z-10 group transition-colors duration-200`}
            ref={messageEndRef}
          >
            <div className=" chat-image avatar">
              <div className="size-10 rounded-full border select-none">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="relative chat-bubble flex flex-col break-words whitespace-pre-wrap">
              {/* Pin indicator */}
              {message.pinned && (
                <div className="absolute -top-2 -left-2 bg-primary text-primary-content rounded-full p-1">
                  <Pin className="w-3 h-3" />
                </div>
              )}

              {/* Context menu */}
              <div className="absolute -top-2 -right-0">
                <MessageContextMenu
                  message={message}
                  onClose={() => setActiveContextMenu(null)}
                  isOwnMessage={message.senderId === authUser._id}
                  onReply={() => {
                    // Focus input field when reply is clicked
                    setTimeout(() => {
                      if (messageInputRef.current?.focus) {
                        messageInputRef.current.focus();
                      }
                    }, 100);
                  }}
                />
              </div>

              {/* Reply message display */}
              {message.replyTo && (
                <ReplyMessage 
                  replyTo={message.replyTo} 
                  onClick={() => scrollToMessage(message.replyTo._id)}
                />
              )}

              {message.image && (
                <div className="relative">
                  <img
                    src={message.image}
                    alt="Attachment"
                    className={`max-w-full w-auto max-h-80 sm:max-w-md md:max-w-lg rounded-md mb-2 cursor-pointer hover:opacity-90 transition-opacity object-contain ${
                      message.isUploading ? "opacity-60" : ""
                    }`}
                    onClick={() => !message.isUploading && setSelectedImage(message.image)}
                  />
                  {message.isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md">
                      <div className="loading loading-spinner loading-md text-white"></div>
                    </div>
                  )}
                  {message.uploadFailed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-md">
                      <span className="text-red-500 text-sm font-medium">Upload failed</span>
                    </div>
                  )}
                </div>
              )}
              {message.text && <p>{message.text}</p>}

              {/* Read status indicator for sent messages */}
              {message.senderId === authUser._id && (
                <div className="flex justify-end mt-1">
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 right-[+4px] w-2 h-2 rounded-full ${
                      message.read ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Reply Preview */}
      <ReplyPreview />

      <MessageInput ref={messageInputRef} />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage}
        imageAlt="Chat Image"
      />
    </div>
  );
};
export default ChatContainer;
