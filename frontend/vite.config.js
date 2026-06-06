import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // base: '/static/',
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Optimize the bundle by splitting large libraries
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          query: ["@tanstack/react-query"],
          ui: ["lucide-react", "react-hot-toast", "recharts"],
        },
      },
    },
  },
});
