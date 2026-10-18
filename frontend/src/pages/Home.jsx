import { Link } from "react-router-dom";

import ProjectCard from "../components/ProjectCard.jsx";
import Stack3D from "../components/Stack3D.jsx";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import useProjects from "../useProjects.js";

export default function Home() {
  const { t } = useLanguage();
  const { projects } = useProjects();
  // Featured projects first; if none are featured yet, show the first three.
  const list = projects || [];
  const featured = list.filter((p) => p.featured);
  const shown = (featured.length ? featured : list).slice(0, 3);

  return (
    <>
      <section className="hero">
        <div>
          <span className="tag">{t("home.tag")}</span>
          <h1>
            {t("home.titleStart")} <span>{t("home.titleAccent")}</span>
          </h1>
          {t("home.lead").map((p) => (
            <p className="lead" key={p.slice(0, 24)}>
              {p}
            </p>
          ))}
          <p className="actions">
            <a className="btn primary" href="#work">
              {t("home.ctaWork")}
            </a>
            <Link className="btn" to="/about">
              {t("home.ctaAbout")}
            </Link>
          </p>
        </div>
        <Stack3D />
      </section>

      <ul className="availability">
        {t("home.availability").map((a) => (
          <li className="card" key={a.label}>
            <small>{a.label}</small>
            {a.text}
          </li>
        ))}
      </ul>

      {shown.length > 0 && (
        <section id="work" aria-labelledby="work-title">
          <div className="section-head">
            <h2 id="work-title">{t("home.selected")}</h2>
            <Link to="/projects">{t("home.allProjects")}</Link>
          </div>
          <div className={shown.length === 3 ? "bento" : "project-grid"}>
            {shown.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
