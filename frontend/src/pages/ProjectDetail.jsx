import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "../api.js";
import { ErrorMessage, Loading } from "../components/Status.jsx";
import TechBadge from "../components/TechBadge.jsx";

export default function ProjectDetail() {
  const { id } = useParams();
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

  if (error)
    return (
      <>
        <ErrorMessage error={error.status === 404 ? new Error("Project not found.") : error} onRetry={error.status === 404 ? undefined : load} />
        <Link to="/projects">← back to projects</Link>
      </>
    );
  if (!project) return <Loading />;

  return (
    <article>
      <p>
        <Link to="/projects">← back to projects</Link>
      </p>
      <h1>{project.title}</h1>
      <div className="badges">
        {project.techs.map((t) => (
          <TechBadge key={t.id} name={t.name} color={t.color} />
        ))}
      </div>
      <p className="lead">{project.description}</p>
      <p className="actions">
        <a className="btn primary" href={project.repo_url} target="_blank" rel="noreferrer">
          View on GitHub
        </a>
        {project.live_url && (
          <a className="btn" href={project.live_url} target="_blank" rel="noreferrer">
            Live demo
          </a>
        )}
      </p>
    </article>
  );
}
