import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { profile } from "../data/profile.js";
import useTilt from "../useTilt.js";

export default function About() {
  const { t } = useLanguage();
  const front = useTilt({ max: 12, base: "rotate(1.5deg)" });

  return (
    <section className="about">
      <div className="photo-stack">
        <div className="back-1" aria-hidden="true" />
        <div className="back-2" aria-hidden="true" />
        <div className="front" ref={front}>
          <img src="/niko.webp" width="300" height="380" alt={t("about.photoAlt")} />
          <p className="caption">
            <b>{profile.name}</b>
            {t("about.location")}
          </p>
        </div>
      </div>

      <div>
        <span className="tag">{t("about.tag")}</span>
        <h1>{t("about.title")}</h1>
        {t("about.text").map((p) => (
          <p className="lead" key={p.slice(0, 24)}>
            {p}
          </p>
        ))}

        <h2 style={{ marginTop: 40 }}>{t("about.pathTitle")}</h2>
        <ol className="timeline">
          {t("about.path").map((step) => (
            <li key={step.year} className={step.now ? "now" : undefined}>
              <span className="year">{step.year}</span>
              <b>{step.what}</b>
              <small>{step.where}</small>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
