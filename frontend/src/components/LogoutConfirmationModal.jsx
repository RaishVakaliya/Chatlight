import { X, LogOut } from "lucide-react";

const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="p-6 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <LogOut className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold">Confirm Logout</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-base-content/80 mb-6">
            Are you sure you want to logout? You'll need to sign in again to access your messages and continue chatting.
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-base-200 hover:bg-base-300 text-base-content rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmationModal;
