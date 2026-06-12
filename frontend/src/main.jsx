import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";

import App from "./App.jsx";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Toaster
          position="top-right"
          toastOptions={{
            className:
              "!bg-white !text-slate-900 !border !border-slate-200 shadow-xl dark:!bg-slate-800 dark:!text-slate-100 dark:!border-slate-700 !rounded-xl transition-colors duration-300",
            success: {
              iconTheme: {
                primary: "#10b981", // Emerald 500
                secondary: "transparent",
              },
            },
            error: {
              iconTheme: {
                primary: "#e11d48", // Rose 600
                secondary: "transparent",
              },
            },
          }}
        />
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
);
