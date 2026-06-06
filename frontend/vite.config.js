import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // base: '/static/',
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.js",
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router-dom")
            ) {
              return "vendor"; // Groups core React libs
            }
            if (id.includes("@tanstack/react-query")) {
              return "query"; // Groups React Query
            }
            if (id.includes("lucide-react") || id.includes("recharts")) {
              return "ui-lib"; // Groups UI utilities
            }
            return "vendor-other"; // Catch-all for other node_modules
          }
        },
      },
    },
  },
});
