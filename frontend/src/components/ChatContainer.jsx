import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { Pin, Ban } from "lucide-react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import UserProfileModal from "./UserProfileModal";
import ImagePreviewModal from "./ImagePreviewModal";
import PinnedMessages from "./PinnedMessages";
import MessageContextMenu from "./MessageContextMenu";
import DeleteMessageModal from "./DeleteMessageModal";
import ReplyPreview from "./ReplyPreview";
import ReplyMessage from "./ReplyMessage";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    editMessage,
    deleteMessage,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeContextMenu, setActiveContextMenu] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Close profile modal when selected user changes
  useEffect(() => {
    setIsProfileModalOpen(false);
  }, [selectedUser._id]);

  // Close delete modal when selected user changes
  useEffect(() => {
    setIsDeleteModalOpen(false);
    setMessageToDelete(null);
    setIsDeleting(false);
  }, [selectedUser._id]);

  const handleEditMessage = (message) => {
    setEditingMessageId(message._id);
    setEditingText(message.text);
  };

  const handleDeleteMessage = (message) => {
    setMessageToDelete(message);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!messageToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteMessage(messageToDelete._id);
      setIsDeleteModalOpen(false);
      setMessageToDelete(null);
    } catch (error) {
      // Error is handled in the store with toast
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setMessageToDelete(null);
    setIsDeleting(false);
  };

  const handleSaveEdit = async () => {
    if (editingText.trim() === "") return;

    await editMessage(editingMessageId, editingText.trim());
    setEditingMessageId(null);
    setEditingText("");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  const handleEditKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

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

      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
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

              {/* Context menu - only show for non-deleted messages */}
              {!message.deleted && (
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
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteMessage}
                  />
                </div>
              )}

              {/* Reply message display */}
              {message.replyTo && !message.deleted && (
                <ReplyMessage
                  replyTo={message.replyTo}
                  onClick={() => scrollToMessage(message.replyTo._id)}
                />
              )}

              {/* Deleted message placeholder */}
              {message.deleted ? (
                <div className="flex gap-2 italic">
                  <span className="text-sm flex items-center">
                    <Ban /> This message was deleted
                  </span>
                </div>
              ) : (
                <>
                  {message.image && (
                    <div className="relative">
                      <img
                        src={message.image}
                        alt="Attachment"
                        className={`max-w-full w-auto max-h-80 sm:max-w-md md:max-w-lg rounded-md mb-2 cursor-pointer hover:opacity-90 transition-opacity object-contain ${
                          message.isUploading ? "opacity-60" : ""
                        }`}
                        onClick={() =>
                          !message.isUploading &&
                          setSelectedImage(message.image)
                        }
                      />
                      {message.isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md">
                          <div className="loading loading-spinner loading-md text-white"></div>
                        </div>
                      )}
                      {message.uploadFailed && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-md">
                          <span className="text-red-500 text-sm font-medium">
                            Upload failed
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {message.text && (
                    <div>
                      {editingMessageId === message._id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={handleEditKeyPress}
                            className="w-full p-2 border border-base-300 rounded-md bg-base-100 text-base-content resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                            rows="2"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 text-xs bg-primary hover:bg-primary/90 text-primary-content rounded-md transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1 text-xs bg-secondary text-primary-content rounded-md transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-end gap-2 whitespace-pre-wrap break-all break-words">
                          <p className="flex-1">{message.text}</p>
                          {message.edited && (
                            <span className="text-xs text-base-content/50 italic whitespace-nowrap">
                              edited
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

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

      {/* Delete Message Modal */}
      <DeleteMessageModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};
export default ChatContainer;
