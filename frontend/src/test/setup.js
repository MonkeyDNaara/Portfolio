// Browser APIs that jsdom doesn't have (or only partly), so the components can render in tests.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Node 25+ has its own experimental localStorage. Without --localstorage-file it is undefined
// and hides the jsdom one, so the tests get a small in-memory version instead.
if (typeof globalThis.localStorage?.setItem !== "function") {
  const data = new Map();
  const storage = {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear(),
    key: (i) => [...data.keys()][i] ?? null,
    get length() {
      return data.size;
    },
  };
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true, writable: true });
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

window.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
window.scrollTo = () => {};

// <dialog>: showModal() opens it, close() closes it and fires "close" like a browser does.
const dialog = window.HTMLDialogElement.prototype;
dialog.showModal = function showModal() {
  this.setAttribute("open", "");
};
dialog.close = function close() {
  if (!this.hasAttribute("open")) return;
  this.removeAttribute("open");
  this.dispatchEvent(new Event("close"));
};

// popover API (toast)
window.HTMLElement.prototype.showPopover ??= function showPopover() {};
