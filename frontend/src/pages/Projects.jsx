import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import ProjectCard from "../components/ProjectCard.jsx";
import ProjectForm from "../components/ProjectForm.jsx";
import { ErrorMessage, Loading } from "../components/Status.jsx";
import useProjects from "../useProjects.js";

// Body for PUT /projects/{id} built from a project we already have.
const toBody = (p) => ({
  title: p.title,
  description: p.description,
  repo_url: p.repo_url,
  live_url: p.live_url,
  techs: p.techs.map((t) => t.name),
  featured: p.featured,
  is_published: p.is_published,
});

export default function Projects() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const { projects, setProjects, error, reload } = useProjects(token);
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, object = edit
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const dragFrom = useRef(null);

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
    if (!window.confirm(`Delete "${project.title}"? This can't be undone.`)) return;
    guarded(async () => {
      await api(`/projects/${project.id}`, { method: "DELETE", token });
      setProjects((list) => list.filter((p) => p.id !== project.id));
      setMessage(`Deleted "${project.title}".`);
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
    <section>
      <h1>Projects</h1>
      <p className="muted">
        <code>git log --oneline --graph</code> of the things I've built.
      </p>

      {isOwner && (
        <p className="actions">
          <button className="btn primary" onClick={() => setEditing(null)}>
            + Add project
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

      {error && <ErrorMessage error={error} onRetry={reload} />}
      {!error && !projects && <Loading>Loading projects… (the free-tier server can take ~30 s to wake up)</Loading>}
      {projects?.length === 0 && <p className="status">No projects yet.</p>}

      {projects?.map((p, i) => (
        <div
          key={p.id}
          draggable={isOwner}
          onDragStart={() => (dragFrom.current = i)}
          onDragOver={(e) => isOwner && e.preventDefault()}
          onDrop={() => dragFrom.current !== null && move(dragFrom.current, i)}
          onDragEnd={() => (dragFrom.current = null)}
        >
          <ProjectCard
            project={p}
            isHead={i === 0}
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
    </section>
  );
}
