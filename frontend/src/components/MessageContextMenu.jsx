import { useState, useRef, useEffect } from "react";
import { Pin, PinOff, Copy, Reply, ChevronDown } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";

const MessageContextMenu = ({ message, onClose, isOwnMessage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { pinMessage, unpinMessage } = useChatStore();

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
    // TODO: Implement reply functionality
    toast.info("Reply functionality coming soon!");
    setIsOpen(false);
    onClose();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="opacity-0 group-hover:opacity-100 hover:bg-base-300 rounded-full transition-all"
        title="Message options"
      >
        <ChevronDown className="w-4 h-4 text-base-content/60 bg-primary/50 rounded-full" />
      </button>

      {isOpen && (
        <div className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'}  top-8 bg-base-100 border border-base-300 rounded-full shadow-lg p-1 flex items-center gap-1 z-50`}>
          <button
            onClick={handlePin}
            className="px-3 py-2 text-sm hover:bg-base-200 hover:rounded-full items-center gap-2 text-base-content"
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
              className="w-full px-3 py-2 text-sm hover:bg-base-200 hover:rounded-full items-center gap-2 text-base-content"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleReply}
            className="w-full px-3 py-2 text-sm hover:bg-base-200 hover:rounded-full items-center gap-2 text-base-content"
          >
            <Reply className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageContextMenu;
