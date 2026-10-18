import { skillGroups } from "../data/profile.js";
import { useLanguage } from "../i18n/LanguageProvider.jsx";

export default function Skills() {
  const { t } = useLanguage();
  return (
    <>
      <section className="page-head">
        <span className="tag">{t("skills.tag")}</span>
        <h1>{t("skills.title")}</h1>
        <p className="lead">{t("skills.lead")}</p>
        <p className="legend">
          <span>
            <i className="dot used" /> {t("skills.used")}
          </span>
          <span>
            <i className="dot" /> {t("skills.learning")}
          </span>
        </p>
      </section>
      <div className="skill-grid">
        {skillGroups.map((g) => (
          <section className="card skill-group" key={g.key} aria-labelledby={`skills-${g.key}`}>
            <h2 id={`skills-${g.key}`}>{t(`skills.groups.${g.key}`)}</h2>
            <ul>
              {g.items.map(([name, level]) => (
                <li key={name} className={level}>
                  <i className={`dot ${level}`} aria-hidden="true" />
                  {name}
                  <span className="visually-hidden">({t(`skills.${level}`)})</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
