import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// 1. Import React Query
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// 2. Initialize the Client with default caching rules
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data is considered "fresh" for 5 minutes
      cacheTime: 1000 * 60 * 30, // Unused data is kept in memory for 30 minutes
      retry: 1, // Only retry failed requests once
      refetchOnWindowFocus: true, // Auto-update data if the user switches browser tabs
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* 3. Wrap the App */}
    <QueryClientProvider client={queryClient}>
      <App />

      {/* 4. Add the Devtools (only visible in development mode) */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
);
