import { Link, useLocation } from "react-router-dom";

import { imageUrl } from "../api.js";
import { localized, useLanguage } from "../i18n/LanguageProvider.jsx";
import useTilt from "../useTilt.js";
import { ArrowUpRight } from "./Icons.jsx";
import { TechList } from "./TechBadge.jsx";

export function initials(title) {
  return title
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/**
 * `admin` is optional. When given, the owner controls are shown:
 * { onEdit, onDelete, onMove(-1|1), onToggle(field), canUp, canDown }
 * `tilt` turns on the 3D hover effect (off on the owner view, it fights with drag and drop).
 */
export default function ProjectCard({ project, admin, tilt = true }) {
  const { lang, t } = useLanguage();
  const { title, description } = localized(project, lang);
  const ref = useTilt({ enabled: tilt });
  const img = imageUrl(project);
  const location = useLocation();

  return (
    <article ref={ref} className={`card project tilt${project.is_published ? "" : " is-hidden"}`}>
      {img ? (
        <img className="shot" src={img} alt={`${t("projects.screenshotOf")} ${title}`} loading="lazy" />
      ) : (
        <div className="shot placeholder" aria-hidden="true">
          {initials(title)}
        </div>
      )}
      <div className="body">
        {admin && (project.featured || !project.is_published) && (
          <p className="flags">
            {project.featured && <span className="pill accent">{t("projects.featured")}</span>}
            {!project.is_published && <span className="pill">{t("projects.hidden")}</span>}
          </p>
        )}
        <h3>
          {/* stretched link: covers the whole card and opens the project as a modal */}
          <Link to={`/projects/${project.id}`} state={{ background: location }} draggable={admin ? false : undefined}>
            {title}
          </Link>
        </h3>
        <p className="desc">{description}</p>
        <TechList techs={project.techs} />
        <p className="links">
          <a href={project.repo_url} target="_blank" rel="noreferrer">
            {t("projects.code")} <ArrowUpRight />
          </a>
          {project.live_url && (
            <a href={project.live_url} target="_blank" rel="noreferrer">
              {t("projects.live")} <ArrowUpRight />
            </a>
          )}
        </p>
        {admin && (
          <div className="owner-controls" role="group" aria-label={`${t("projects.manage")}: ${title}`}>
            <button className="btn small" onClick={() => admin.onMove(-1)} disabled={!admin.canUp} aria-label={t("projects.moveUp")}>
              ↑
            </button>
            <button className="btn small" onClick={() => admin.onMove(1)} disabled={!admin.canDown} aria-label={t("projects.moveDown")}>
              ↓
            </button>
            <button className="btn small" onClick={admin.onEdit}>
              {t("projects.edit")}
            </button>
            <button className="btn small" onClick={() => admin.onToggle("featured")}>
              {project.featured ? t("projects.unfeature") : t("projects.feature")}
            </button>
            <button className="btn small" onClick={() => admin.onToggle("is_published")}>
              {project.is_published ? t("projects.hide") : t("projects.publish")}
            </button>
            <button className="btn small danger" onClick={admin.onDelete}>
              {t("projects.delete")}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
