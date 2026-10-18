import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api, imageUrl } from "../api.js";
import { ArrowUpRight } from "../components/Icons.jsx";
import { ErrorMessage, Loading } from "../components/Status.jsx";
import { TechList } from "../components/TechBadge.jsx";
import { localized, useLanguage } from "../i18n/LanguageProvider.jsx";

export default function ProjectDetail() {
  const { id } = useParams();
  const { lang, t } = useLanguage();
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setProject(await api(`/projects/${id}`));
    } catch (e) {
      setError(e);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const back = (
    <Link className="back" to="/projects">
      {t("projects.back")}
    </Link>
  );

  if (error)
    return (
      <section className="page-head">
        {back}
        <ErrorMessage
          error={error.status === 404 ? new Error(t("projects.notFound")) : error}
          onRetry={error.status === 404 ? undefined : load}
        />
      </section>
    );
  if (!project) return <Loading />;

  const { title, description } = localized(project, lang);
  const img = imageUrl(project);

  return (
    <article className="page-head">
      {back}
      <div className={img ? "detail" : ""}>
        <div>
          <h1>{title}</h1>
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
        </div>
        {img && <img className="shot" src={img} alt={`${t("projects.screenshotOf")} ${title}`} />}
      </div>
    </article>
  );
}
