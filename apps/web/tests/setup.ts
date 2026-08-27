import "@testing-library/jest-dom";
import "fake-indexeddb/auto";
import { vi } from "vitest";

// Polyfill window.scrollTo in jsdom
if (typeof window !== "undefined") {
  window.scrollTo = vi.fn();
}
