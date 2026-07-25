import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { isMobileDevice } from "../lib/utils";

import ChatHeader from "./ChatHeader";
import DeleteMessageModal from "./DeleteMessageModal";
import ImagePreviewModal from "./ImagePreviewModal";
import MessageInput from "./MessageInput";
import MessageItem from "./MessageItem";
import PinnedMessages from "./PinnedMessages";
import ReplyPreview from "./ReplyPreview";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import UserProfileModal from "./UserProfileModal";

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
  const [, setActiveContextMenu] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const scrollToMessage = (messageId) => {
    const messageElement = document.querySelector(
      `[data-message-id="${messageId}"]`,
    );
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      messageElement.classList.add("bg-yellow-100", "dark:bg-yellow-900/30");
      setTimeout(() => {
        messageElement.classList.remove(
          "bg-yellow-100",
          "dark:bg-yellow-900/30",
        );
      }, 2000);
    }
  };

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();

    let focusTimeout1, focusTimeout2;
    if (!isMobileDevice()) {
      const focusInput = () => {
        if (messageInputRef.current?.focus) {
          messageInputRef.current.focus();
        }
      };
      focusTimeout1 = setTimeout(focusInput, 100);
      focusTimeout2 = setTimeout(focusInput, 300);
    }

    return () => {
      unsubscribeFromMessages();
      if (focusTimeout1) clearTimeout(focusTimeout1);
      if (focusTimeout2) clearTimeout(focusTimeout2);
    };
  }, [
    selectedUser._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  useEffect(() => {
    setIsProfileModalOpen(false);
  }, [selectedUser._id]);

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
    } catch {
      // Handled in store
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
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    }
  }, [messages.length]);

  useEffect(() => {
    if (!isMobileDevice() && !isMessagesLoading && messages) {
      setTimeout(() => {
        if (messageInputRef.current?.focus) {
          messageInputRef.current.focus();
        }
      }, 150);
    }
  }, [isMessagesLoading, messages]);

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

      <PinnedMessages selectedUser={selectedUser} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {messages.map((message) => (
          <MessageItem
            key={message._id}
            message={message}
            authUser={authUser}
            selectedUser={selectedUser}
            messageEndRef={messageEndRef}
            editingMessageId={editingMessageId}
            editingText={editingText}
            setEditingText={setEditingText}
            handleEditKeyPress={handleEditKeyPress}
            handleCancelEdit={handleCancelEdit}
            handleSaveEdit={handleSaveEdit}
            handleEditMessage={handleEditMessage}
            handleDeleteMessage={handleDeleteMessage}
            setSelectedImage={setSelectedImage}
            scrollToMessage={scrollToMessage}
            messageInputRef={messageInputRef}
            setActiveContextMenu={setActiveContextMenu}
          />
        ))}
      </div>

      <ReplyPreview />

      <MessageInput ref={messageInputRef} />

      <ImagePreviewModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage}
        imageAlt="Chat Image"
      />

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
