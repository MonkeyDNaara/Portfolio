import { useEffect, useRef, useState } from "react";

import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { READY_MS, SHOW_AFTER_MS, wakeProgress } from "../wakeUp.js";

/**
 * Small pill at the bottom while the free-tier API wakes up. Shows up only when the
 * projects take longer than SHOW_AFTER_MS, then says "Ready" for a moment and goes away.
 * The layers are the 3D stack of the home page: UI, API, DB.
 */
export default function WakeUpNotice({ loading, failed }) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState("hidden"); // hidden | waking | ready
  const [seconds, setSeconds] = useState(0);
  const started = useRef(0);

  useEffect(() => {
    if (!loading) {
      setPhase((p) => (p === "waking" && !failed ? "ready" : "hidden"));
      return;
    }
    started.current = Date.now();
    setSeconds(0);
    const show = setTimeout(() => setPhase("waking"), SHOW_AFTER_MS);
    const tick = setInterval(() => setSeconds(Math.floor((Date.now() - started.current) / 1000)), 1000);
    return () => {
      clearTimeout(show);
      clearInterval(tick);
    };
  }, [loading, failed]);

  useEffect(() => {
    if (phase !== "ready") return;
    const hide = setTimeout(() => setPhase("hidden"), READY_MS);
    return () => clearTimeout(hide);
  }, [phase]);

  if (phase === "hidden") return null;
  const ready = phase === "ready";

  return (
    <div className={`wake${ready ? " ready" : ""}`} role="status">
      <span className="wake-stack" aria-hidden="true">
        <i className="ui" />
        <i className="api" />
        <i className="db" />
      </span>
      <span className="wake-text">
        <strong>{ready ? t("wake.ready") : t("wake.title")}</strong>
        {!ready && (
          <small>
            {t("wake.hint")}
            <span aria-hidden="true" className="wake-time">
              {" "}
              · {seconds} s
            </span>
          </small>
        )}
      </span>
      <span className="wake-bar" aria-hidden="true">
        <span style={{ width: `${ready ? 100 : wakeProgress(seconds)}%` }} />
      </span>
    </div>
  );
}
