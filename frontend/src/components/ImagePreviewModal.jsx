import { X } from "lucide-react";
import { useEffect } from "react";

const ImagePreviewModal = ({ isOpen, onClose, imageUrl, imageAlt = "Image" }) => {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    } else {
      // Restore body scroll when modal closes
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown, true); // Use capture phase
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Image container - same height as chat container */}
      <div className="relative w-auto h-[calc(100vh-8rem)] flex items-center justify-center">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="max-h-full w-auto object-contain select-none"
          draggable={false}
        />
      </div>
    </div>
  );
};

export default ImagePreviewModal;
