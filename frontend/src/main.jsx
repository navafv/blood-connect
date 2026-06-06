import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";

import App from "./App.jsx";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {/*
        Global Notification Boundary
        Statically styled to inherit the application's dark mode design system.
      */}
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "bg-slate-800 text-slate-100 border border-slate-700 shadow-2xl",
          style: {
            background: "#1e293b",
            color: "#f1f5f9",
            border: "1px solid #334155",
            borderRadius: "12px",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#1e293b",
            },
          },
          error: {
            iconTheme: {
              primary: "#e11d48",
              secondary: "#1e293b",
            },
          },
        }}
      />

      <App />

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
);
