import { imageUrl } from "../api.js";
import { localized, useLanguage } from "../i18n/LanguageProvider.jsx";
import { ArrowUpRight } from "./Icons.jsx";
import { initials } from "./ProjectCard.jsx";
import { TechList } from "./TechBadge.jsx";

/**
 * Everything about one project: image, title, techs, full description and links.
 * Used by the detail page (`as="h1"`) and the modal (`as="h2"`).
 * `children` go below the links (owner actions). `placeholder` shows the initials when there is no image.
 */
export default function ProjectView({ project, as: Heading = "h1", headingId, className = "", placeholder = false, children }) {
  const { lang, t } = useLanguage();
  const { title, description } = localized(project, lang);
  const img = imageUrl(project);

  return (
    <div className={`project-view${img ? " has-shot" : ""} ${className}`}>
      {img ? (
        <img className="shot" src={img} alt={`${t("projects.screenshotOf")} ${title}`} />
      ) : (
        placeholder && (
          <div className="shot placeholder" aria-hidden="true">
            {initials(title)}
          </div>
        )
      )}
      <div className="pv-body">
        <Heading id={headingId}>{title}</Heading>
        <TechList techs={project.techs} />
        <p className="desc">{description}</p>
        <p className="actions">
          <a className="btn primary" href={project.repo_url} target="_blank" rel="noreferrer">
            {t("projects.viewCode")} <ArrowUpRight />
          </a>
          {project.live_url && (
            <a className="btn" href={project.live_url} target="_blank" rel="noreferrer">
              {t("projects.viewLive")} <ArrowUpRight />
            </a>
          )}
        </p>
        {children}
      </div>
    </div>
  );
}
