import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router-dom")
            ) {
              return "vendor-react";
            }
            if (id.includes("firebase")) {
              return "vendor-firebase";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            if (id.includes("socket.io-client") || id.includes("axios")) {
              return "vendor-network";
            }
          }
        },
      },
    },
  },
});
