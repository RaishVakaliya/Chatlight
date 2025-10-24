import { useState, useRef, useEffect } from "react";
import { Pin, PinOff, Copy, Reply, ChevronDown, Trash2, Pencil } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";

const MessageContextMenu = ({ message, onClose, isOwnMessage, onReply, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { pinMessage, unpinMessage, setReplyingTo, deleteMessage } = useChatStore();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handlePin = () => {
    if (message.pinned) {
      unpinMessage(message._id);
    } else {
      pinMessage(message._id);
    }
    setIsOpen(false);
    onClose();
  };

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      toast.success("Message copied to clipboard");
    }
    setIsOpen(false);
    onClose();
  };

  const handleReply = () => {
    setReplyingTo(message);
    setIsOpen(false);
    onClose();
    // Focus the input field after setting reply
    if (onReply) {
      onReply();
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(message);
    }
    setIsOpen(false);
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(message);
    }
    setIsOpen(false);
    onClose();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="opacity-0 group-hover:opacity-100 hover:bg-base-300 rounded-full transition-all p-1 touch-manipulation"
        title="Message options"
      >
        <ChevronDown className="w-4 h-4 text-base-content/60 bg-primary/50 rounded-full" />
      </button>

      {isOpen && (
        <div className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'} top-8 bg-base-100 border border-base-300 rounded-full shadow-lg p-1 flex items-center gap-1 z-50 min-w-max`}>
          <button
            onClick={handlePin}
            className="px-2 py-2 sm:px-3 text-sm hover:bg-base-200 hover:rounded-full items-center gap-2 text-base-content touch-manipulation"
          >
            {message.pinned ? (
              <>
                <PinOff className="w-4 h-4" />
              </>
            ) : (
              <>
                <Pin className="w-4 h-4" />
              </>
            )}
          </button>

          {message.text && (
            <button
              onClick={handleCopy}
              className="px-2 py-2 sm:px-3 text-sm hover:bg-base-200 hover:rounded-full items-center gap-2 text-base-content touch-manipulation"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleReply}
            className="px-2 py-2 sm:px-3 text-sm hover:bg-base-200 hover:rounded-full items-center gap-2 text-base-content touch-manipulation"
          >
            <Reply className="w-4 h-4" />
          </button>

          {isOwnMessage && message.text && !message.deleted && (
            <button
              onClick={handleEdit}
              className="px-2 py-2 sm:px-3 text-sm hover:bg-base-200 hover:rounded-full items-center gap-2 text-base-content touch-manipulation"
              title="Edit message"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}

          {isOwnMessage && (
            <button
              onClick={handleDelete}
              className="px-2 py-2 sm:px-3 text-sm hover:bg-red-200 hover:rounded-full items-center gap-2 text-red-600 touch-manipulation"
              title="Delete message"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageContextMenu;
