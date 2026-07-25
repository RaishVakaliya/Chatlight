import { memo } from "react";
import { Heart, MessageSquare, Shield } from "lucide-react";
import logo from "../assets/app_logo.png";

const Footer = memo(() => {
  const getDayName = () => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[new Date().getDay()];
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-base-300 bg-base-100 h-[20px] sm:h-[22px] flex items-center fixed bottom-0 left-0 right-0 z-30">
      <div className="w-full flex flex-row items-center justify-between gap-1 sm:gap-3 px-3 sm:px-6 text-[9px] sm:text-[10px] text-base-content/60 leading-none">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary flex-shrink-0" />
          <span className="whitespace-nowrap hidden sm:inline">
            Contact admin for any help or inquiry
          </span>
          <span className="whitespace-nowrap sm:hidden">Contact admin</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          <MessageSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary flex-shrink-0" />
          <span className="whitespace-nowrap">Happy chatting</span>
          <span className="hidden sm:inline text-base-content/40">•</span>
          <span className="whitespace-nowrap hidden sm:inline">
            Happy {getDayName()}
          </span>
          <img
            src={logo}
            alt="Chatlight"
            className="h-2.5 w-2.5 sm:h-3 sm:w-3 object-contain flex-shrink-0 select-none"
          />
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          <span className="whitespace-nowrap">© {currentYear}</span>
          <span className="whitespace-nowrap hidden sm:inline">
            <span className="text-[#6366F1]">Chat</span>
            <span className="text-[#EC4899]">light</span>
          </span>
          <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-500 fill-red-500 flex-shrink-0" />
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
