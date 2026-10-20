// Browser APIs that jsdom doesn't have (or only partly), so the components can render in tests.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

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
