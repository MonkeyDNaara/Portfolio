import { useEffect } from "react";

/** Sets --mx / --my on the element so CSS can draw a light that follows the mouse. */
export default function useSpotlight(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover)").matches) return undefined;
    function move(e) {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    }
    function leave() {
      el.style.setProperty("--mx", "-500px");
    }
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mouseleave", leave);
    };
  }, [ref]);
}
