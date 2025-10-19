import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import useBackgroundStore from "../store/useBackgroundStore";
import { Send, Image, X } from "lucide-react";

// Import background images
import bg1 from "../assets/background/bg1.jpeg";
import bg2 from "../assets/background/bg2.jpeg";
import bg3 from "../assets/background/bg3.jpeg";
import bg4 from "../assets/background/bg4.jpeg";
import bg5 from "../assets/background/bg5.jpeg";
import bg6 from "../assets/background/bg6.jpeg";
import bg7 from "../assets/background/bg7.jpeg";
import bg8 from "../assets/background/bg8.jpeg";
import bg9 from "../assets/background/bg9.jpeg";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  {
    id: 2,
    content: "I'm doing great! Just working on some new features.",
    isSent: true,
  },
];

const BACKGROUND_IMAGES = [
  { id: "bg1", name: "Background 1", src: bg1 },
  { id: "bg2", name: "Background 2", src: bg2 },
  { id: "bg3", name: "Background 3", src: bg3 },
  { id: "bg4", name: "Background 4", src: bg4 },
  { id: "bg5", name: "Background 5", src: bg5 },
  { id: "bg6", name: "Background 6", src: bg6 },
  { id: "bg7", name: "Background 7", src: bg7 },
  { id: "bg8", name: "Background 8", src: bg8 },
  { id: "bg9", name: "Background 9", src: bg9 },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const { selectedBackground, setBackground, clearBackground } =
    useBackgroundStore();

  return (
    <div className="min-h-screen mx-auto px-4 pt-20 max-w-5xl">
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Theme</h2>
          <p className="text-sm text-base-content/70">
            Choose a theme for your chat interface
          </p>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {THEMES.map((t) => (
            <button
              key={t}
              className={`
                group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors
                ${theme === t ? "bg-base-200" : "hover:bg-base-200/50"}
              `}
              onClick={() => setTheme(t)}
            >
              <div
                className="relative h-8 w-full rounded-md overflow-hidden"
                data-theme={t}
              >
                <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                  <div className="rounded bg-primary"></div>
                  <div className="rounded bg-secondary"></div>
                  <div className="rounded bg-accent"></div>
                  <div className="rounded bg-neutral"></div>
                </div>
              </div>
              <span className="text-[11px] font-medium truncate w-full text-center">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </span>
            </button>
          ))}
        </div>

        {/* Background Section */}
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Chat Background</h2>
          <p className="text-sm text-base-content/70">
            Choose a background image for your chat interface
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {/* No Background Option */}
          <button
            className={`
              group flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all
              ${
                selectedBackground === null
                  ? "border-primary bg-primary/10"
                  : "border-base-300 hover:border-base-400"
              }
            `}
            onClick={() => clearBackground()}
          >
            <div className="w-16 h-16 rounded-lg bg-base-200 flex items-center justify-center">
              <X className="w-6 h-6 text-base-content/50" />
            </div>
            <span className="text-xs font-medium text-center">
              No Background
            </span>
          </button>

          {/* Background Images */}
          {BACKGROUND_IMAGES.map((bg) => (
            <button
              key={bg.id}
              className={`
                group flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all
                ${
                  selectedBackground === bg.id
                    ? "border-primary bg-primary/10"
                    : "border-base-300 hover:border-base-400"
                }
              `}
              onClick={() => setBackground(bg.id)}
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden relative">
                <img
                  src={bg.src}
                  alt={bg.name}
                  className="w-full h-full object-cover"
                />
                {selectedBackground === bg.id && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-primary-content rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-center">{bg.name}</span>
            </button>
          ))}
        </div>

        {/* Preview Section */}
        <h3 className="text-lg font-semibold mb-3">Preview</h3>
        <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg">
          <div className="p-4 bg-base-200">
            <div className="max-w-lg mx-auto">
              {/* Mock Chat UI */}
              <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium select-none">
                      J
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">John Doe</h3>
                      <p className="text-xs text-base-content/70">Online</p>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div
                  className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-base-100 relative"
                  style={{
                    backgroundImage: selectedBackground
                      ? `url(${
                          BACKGROUND_IMAGES.find(
                            (bg) => bg.id === selectedBackground
                          )?.src
                        })`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  {/* Background overlay for better text readability */}
                  {selectedBackground && (
                    <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
                  )}
                  {PREVIEW_MESSAGES.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.isSent ? "justify-end" : "justify-start"
                      } relative z-10`}
                    >
                      <div
                        className={`
                          max-w-[80%] rounded-xl p-3 shadow-sm
                          ${
                            message.isSent
                              ? "bg-primary text-primary-content"
                              : "bg-base-200"
                          }
                        `}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`
                            text-[10px] mt-1.5
                            ${
                              message.isSent
                                ? "text-primary-content/70"
                                : "text-base-content/70"
                            }
                          `}
                        >
                          12:00 PM
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-base-300 bg-base-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered flex-1 text-sm h-10"
                      placeholder="Type a message..."
                      value="This is a preview"
                      readOnly
                    />
                    <button className="btn btn-primary h-10 min-h-0">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SettingsPage;
