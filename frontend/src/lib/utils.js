import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const getImageUrl = (path) => {
  if (!path) return "";

  // If the path is already a full URL or a local blob (from file upload preview), return it as is.
  if (path.startsWith("http") || path.startsWith("blob:")) return path;

  // Determine the base backend URL securely
  const apiBase = import.meta.env.PROD
    ? import.meta.env.VITE_API_BASE_URL || "https://api.bloodonate.org/api"
    : "http://localhost:8000/api";

  // Strip '/api' or '/api/' from the end to get the pure backend root (for /media/)
  const baseURL = apiBase.replace(/\/api\/?$/, "");

  // Remove leading slash from path if present to avoid double slashes (e.g. baseURL//media/...)
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  return `${baseURL}/${cleanPath}`;
};
