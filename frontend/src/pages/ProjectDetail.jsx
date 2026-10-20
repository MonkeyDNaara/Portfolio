import { Link, useNavigate, useParams } from "react-router-dom";

import OwnerActions from "../components/OwnerActions.jsx";
import ProjectView from "../components/ProjectView.jsx";
import { ErrorMessage, Loading } from "../components/Status.jsx";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { useProject, useProjects } from "../projects.jsx";

/** Full page for /projects/:id when it's opened directly (shared link, reload in a new tab). */
export default function ProjectDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { project, loading, notFound, error, reload } = useProject(id);
  const { isOwner, edit } = useProjects();
  const navigate = useNavigate();

  const back = (
    <Link className="back" to="/projects">
      {t("projects.back")}
    </Link>
  );

  if (loading) return <Loading>{t("projects.loading")}</Loading>;
  if (error || notFound)
    return (
      <section className="page-head">
        {back}
        <ErrorMessage error={error || new Error(t("projects.notFound"))} onRetry={error ? reload : undefined} />
      </section>
    );

  return (
    <article className="page-head">
      {back}
      <ProjectView project={project} className="detail">
        {isOwner && (
          <OwnerActions project={project} onEdit={() => edit(project)} onDeleted={() => navigate("/projects", { replace: true })} />
        )}
      </ProjectView>
    </article>
  );
}
