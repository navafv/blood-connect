// frontend/src/setupTests.js
import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Automatically unmount and cleanup DOM nodes after each test
// to prevent memory leaks and test interference.
afterEach(() => {
  cleanup();
});

// (Optional) Mock window.matchMedia if you ever add components
// that rely on checking dark mode or viewport sizes in JS
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
