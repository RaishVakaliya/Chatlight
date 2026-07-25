import { Ban, Pin } from "lucide-react";
import MessageContextMenu from "./MessageContextMenu";
import ReplyMessage from "./ReplyMessage";
import { formatMessageTime } from "../lib/utils";

const MessageItem = ({
  message,
  authUser,
  selectedUser,
  messageEndRef,
  editingMessageId,
  editingText,
  setEditingText,
  handleEditKeyPress,
  handleCancelEdit,
  handleSaveEdit,
  handleEditMessage,
  handleDeleteMessage,
  setSelectedImage,
  scrollToMessage,
  messageInputRef,
  setActiveContextMenu,
}) => {
  const isOwnMessage = message.senderId === authUser._id;

  return (
    <div
      key={message._id}
      data-message-id={message._id}
      className={`chat ${
        isOwnMessage ? "chat-end" : "chat-start"
      } relative z-10 group transition-colors duration-200`}
      ref={messageEndRef}
    >
      <div className="chat-image avatar">
        <div className="size-10 rounded-full border select-none">
          <img
            src={
              isOwnMessage
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
        {message.pinned && (
          <div className="absolute -top-2 -left-2 bg-primary text-primary-content rounded-full p-1">
            <Pin className="w-3 h-3" />
          </div>
        )}

        {!message.deleted && (
          <div className="absolute -top-2 -right-0">
            <MessageContextMenu
              message={message}
              onClose={() => setActiveContextMenu(null)}
              isOwnMessage={isOwnMessage}
              onReply={() => {
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

        {message.replyTo && !message.deleted && (
          <ReplyMessage
            replyTo={message.replyTo}
            onClick={() => scrollToMessage(message.replyTo._id)}
          />
        )}

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
                    !message.isUploading && setSelectedImage(message.image)
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
                      <span className="text-xs text-zinc-500 italic whitespace-nowrap">
                        edited
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {isOwnMessage && (
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
  );
};

export default MessageItem;
