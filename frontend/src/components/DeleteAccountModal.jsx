import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";

const DeleteAccountModal = ({ isOpen, onClose }) => {
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { authUser, deleteAccount } = useAuthStore();
  const navigate = useNavigate();

  if (!isOpen || !authUser) return null;

  const expectedText = `${authUser.fullName} Delete`;

  const handleDeleteAccount = async () => {
    if (confirmationText !== expectedText) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteAccount(confirmationText);
    
    if (result.success) {
      onClose();
      navigate("/login");
    }
    setIsDeleting(false);
  };

  const isConfirmationValid = confirmationText === expectedText;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg max-w-md w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-red-600">Delete Account</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-base-200 rounded-full transition-colors"
            disabled={isDeleting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="space-y-2">
            <h3 className="font-medium text-red-800 dark:text-red-200">
              This action cannot be undone
            </h3>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              <li>• Your account will be permanently deleted</li>
              <li>• Your profile information will be removed</li>
              <li>• Your chat messages will remain visible to other users</li>
              <li>• You will be logged out immediately</li>
            </ul>
          </div>
        </div>

        {/* Confirmation Input */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">
              To confirm deletion, type: <span className="font-mono bg-base-200 px-2 py-1 rounded text-red-600">{expectedText}</span>
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={expectedText}
              className="w-full px-3 py-2 border border-base-300 rounded-lg bg-base-100 text-base-content focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              disabled={isDeleting}
            />
          </div>
          
          {confirmationText && !isConfirmationValid && (
            <p className="text-sm text-red-500">
              Please type exactly: "{expectedText}"
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-base-200 hover:bg-base-300 rounded-lg transition-colors"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={!isConfirmationValid || isDeleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting && <div className="loading loading-spinner loading-sm"></div>}
            {isDeleting ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
