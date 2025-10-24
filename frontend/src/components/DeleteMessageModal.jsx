import { X, Trash2, AlertTriangle } from "lucide-react";

const DeleteMessageModal = ({ isOpen, onClose, onConfirm, isDeleting = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg max-w-md w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-red-600">Delete Message</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-base-200 rounded-full transition-colors"
            disabled={isDeleting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="text-center">
          <p className="text-base-content/80">
            Are you sure you want to delete this message?
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-base-200 hover:bg-base-300 text-base-content rounded-lg transition-colors"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting && <div className="loading loading-spinner loading-sm"></div>}
            <Trash2 className="w-4 h-4" />
            {isDeleting ? "Deleting..." : "Delete Message"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMessageModal;
