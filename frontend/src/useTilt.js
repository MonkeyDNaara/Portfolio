import { useEffect, useRef } from "react";

/**
 * Small 3D tilt that follows the mouse. Returns a ref for the element.
 * Off for touch screens and for people who prefer reduced motion.
 * `base` is kept in front of the tilt (e.g. "rotate(1.5deg)").
 */
export default function useTilt({ max = 6, base = "", enabled = true } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return undefined;
    const allowed =
      window.matchMedia("(hover: hover)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!allowed) return undefined;

    function move(e) {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `${base} perspective(900px) rotateY(${x * max}deg) rotateX(${-y * max}deg) translateY(-3px)`;
    }
    function reset() {
      el.style.transform = base;
    }
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", reset);
    return () => {
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mouseleave", reset);
    };
  }, [max, base, enabled]);

  return ref;
}
