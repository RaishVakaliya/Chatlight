import { useRef, useState, forwardRef, useImperativeHandle } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import { isMobileDevice } from "../lib/utils";

const MessageInput = forwardRef((props, ref) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);
  const { sendMessage, replyingTo, clearReplyingTo } = useChatStore();

  useImperativeHandle(ref, () => ({
    focus: () => {
      // Skip auto-focus on mobile devices
      if (isMobileDevice()) return;

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
          // Also set cursor to end of text if there's any
          textInputRef.current.setSelectionRange(
            textInputRef.current.value.length,
            textInputRef.current.value.length,
          );
        }
      });
    },
  }));

  const compressImage = (file, maxWidth = 1024, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new window.Image(); // Use window.Image to avoid conflict with lucide-react Image

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        // Fallback: return original file as base64 if compression fails
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Show loading state
    toast.loading("Processing image...", { id: "image-processing" });

    try {
      // Compress image before setting preview
      const compressedImage = await compressImage(file);
      setImagePreview(compressedImage);
      toast.dismiss("image-processing");
    } catch (error) {
      console.error("Error compressing image:", error);
      toast.error("Failed to process image");
      toast.dismiss("image-processing");
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isSending) return; // Prevent double sending

    setIsSending(true);

    // Store current values before clearing
    const messageData = {
      text: text.trim(),
      image: imagePreview,
      replyTo: replyingTo?._id,
    };

    // Clear form immediately for better UX
    setText("");
    setImagePreview(null);
    clearReplyingTo();
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      await sendMessage(messageData);

      // Keep focus on input after sending message
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 50);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Restore form data on error
      setText(messageData.text);
      setImagePreview(messageData.image);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
          <input
            ref={textInputRef}
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={(!text.trim() && !imagePreview) || isSending}
        >
          {isSending ? (
            <div className="loading loading-spinner loading-xs"></div>
          ) : (
            <Send size={22} />
          )}
        </button>
      </form>
    </div>
  );
});

MessageInput.displayName = "MessageInput";

export default MessageInput;
