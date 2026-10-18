import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import ProjectCard from "../components/ProjectCard.jsx";
import ProjectForm from "../components/ProjectForm.jsx";
import { ErrorMessage, Loading } from "../components/Status.jsx";
import { localized, useLanguage } from "../i18n/LanguageProvider.jsx";
import useProjects from "../useProjects.js";

// Body for PUT /projects/{id} built from a project we already have.
const toBody = (p) => ({
  title: p.title,
  description: p.description,
  title_de: p.title_de,
  description_de: p.description_de,
  repo_url: p.repo_url,
  live_url: p.live_url,
  techs: p.techs.map((t) => t.name),
  featured: p.featured,
  is_published: p.is_published,
});

export default function Projects() {
  const { token, logout } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const { projects, setProjects, error, reload } = useProjects(token);
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, object = edit
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const dragFrom = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  const isOwner = Boolean(token);

  function unauthorized() {
    logout();
    navigate("/login", { replace: true });
  }

  async function guarded(fn) {
    setActionError("");
    setMessage("");
    try {
      await fn();
    } catch (e) {
      if (e.status === 401) return unauthorized();
      setActionError(e.message);
      reload();
    }
  }

  const toggle = (project, field) =>
    guarded(async () => {
      const updated = await api(`/projects/${project.id}`, {
        method: "PUT",
        body: { ...toBody(project), [field]: !project[field] },
        token,
      });
      setProjects((list) => list.map((p) => (p.id === updated.id ? updated : p)));
    });

  const remove = (project) => {
    const { title } = localized(project, lang);
    if (!window.confirm(t("projects.confirmDelete", { title }))) return;
    guarded(async () => {
      await api(`/projects/${project.id}`, { method: "DELETE", token });
      setProjects((list) => list.filter((p) => p.id !== project.id));
      setMessage(t("projects.deleted", { title }));
    });
  };

  function move(from, to) {
    if (to < 0 || to >= projects.length || from === to) return;
    const next = [...projects];
    next.splice(to, 0, next.splice(from, 1)[0]);
    setProjects(next); // optimistic, reload() in guarded() restores the real order on failure
    guarded(() => api("/projects/reorder", { method: "POST", body: { ids: next.map((p) => p.id) }, token }));
  }

  function saved(text) {
    setEditing(undefined);
    setMessage(text);
    reload();
  }

  return (
    <>
      <section className="page-head">
        <span className="tag">// projects</span>
        <h1>{t("projects.title")}</h1>
        <p className="lead">{t("projects.lead")}</p>
        {isOwner && (
          <p className="actions">
            <button className="btn primary" onClick={() => setEditing(null)}>
              {t("projects.add")}
            </button>
          </p>
        )}
        {message && (
          <p className="form-ok" role="status">
            {message}
          </p>
        )}
        {actionError && (
          <p className="form-error" role="alert">
            {actionError}
          </p>
        )}
      </section>

      {error && <ErrorMessage error={error} onRetry={reload} />}
      {!error && !projects && <Loading>{t("projects.loading")}</Loading>}
      {projects?.length === 0 && <p className="status">{t("projects.empty")}</p>}

      <div className="project-grid">
        {projects?.map((p, i) => (
          <div
            key={p.id}
            className={dragOver === i ? "drag-over" : undefined}
            draggable={isOwner}
            onDragStart={() => (dragFrom.current = i)}
            onDragOver={(e) => {
              if (!isOwner) return;
              e.preventDefault();
              setDragOver(i);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => {
              setDragOver(null);
              if (dragFrom.current !== null) move(dragFrom.current, i);
            }}
            onDragEnd={() => {
              dragFrom.current = null;
              setDragOver(null);
            }}
          >
            <ProjectCard
              project={p}
              tilt={!isOwner}
              admin={
                isOwner && {
                  onEdit: () => setEditing(p),
                  onDelete: () => remove(p),
                  onMove: (dir) => move(i, i + dir),
                  onToggle: (field) => toggle(p, field),
                  canUp: i > 0,
                  canDown: i < projects.length - 1,
                }
              }
            />
          </div>
        ))}
      </div>

      {editing !== undefined && (
        <ProjectForm
          key={editing?.id ?? "new"}
          project={editing}
          token={token}
          onSaved={saved}
          onClose={() => setEditing(undefined)}
          onUnauthorized={unauthorized}
        />
      )}
    </>
  );
}
