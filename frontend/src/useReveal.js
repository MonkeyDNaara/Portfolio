import { useEffect, useRef } from "react";

/**
 * Adds the class "in" to every `.reveal` child once it scrolls into view.
 * The CSS does the animation (and skips it for reduced motion).
 */
export default function useReveal(deps = []) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const items = root.querySelectorAll(".reveal:not(.in)");
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("in"));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12 },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
