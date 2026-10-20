import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "./api.js";
import { useAuth } from "./auth.jsx";
import ProjectForm from "./components/ProjectForm.jsx";
import { localized, useLanguage } from "./i18n/LanguageProvider.jsx";

const ProjectsContext = createContext(null);

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

/**
 * One list of projects for the whole app (home, projects, skills, detail, modal),
 * plus the owner actions. With a token the API also returns hidden projects.
 */
export function ProjectsProvider({ children }) {
  const { token, logout } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, object = edit
  const [notice, setNotice] = useState(null); // { text, error? }
  const noticeTimer = useRef(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      setProjects(await api("/projects", { token }));
    } catch (e) {
      setError(e);
    }
  }, [token]);

  useEffect(() => {
    reload();
  }, [reload]);

  const notify = useCallback((text, isError = false) => {
    clearTimeout(noticeTimer.current);
    setNotice({ text, error: isError });
    noticeTimer.current = setTimeout(() => setNotice(null), isError ? 8000 : 4000);
  }, []);
  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const unauthorized = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  // Runs an owner action. Returns true when it worked.
  const guarded = useCallback(
    async (fn) => {
      try {
        await fn();
        return true;
      } catch (e) {
        if (e.status === 401) unauthorized();
        else {
          notify(e.message, true);
          reload();
        }
        return false;
      }
    },
    [unauthorized, notify, reload],
  );

  const actions = useMemo(
    () => ({
      edit: (project) => setEditing(project),
      add: () => setEditing(null),
      toggle: (project, field) =>
        guarded(async () => {
          const updated = await api(`/projects/${project.id}`, {
            method: "PUT",
            body: { ...toBody(project), [field]: !project[field] },
            token,
          });
          setProjects((list) => list.map((p) => (p.id === updated.id ? updated : p)));
        }),
      remove: (project) =>
        guarded(async () => {
          await api(`/projects/${project.id}`, { method: "DELETE", token });
          setProjects((list) => list.filter((p) => p.id !== project.id));
          notify(t("projects.deleted", { title: localized(project, lang).title }));
        }),
      // `next` is the whole list in its new order
      reorder: (next) => {
        setProjects(next); // optimistic, reload() in guarded() restores the real order on failure
        return guarded(() => api("/projects/reorder", { method: "POST", body: { ids: next.map((p) => p.id) }, token }));
      },
    }),
    [guarded, notify, token, t, lang],
  );

  function saved(text) {
    setEditing(undefined);
    notify(text);
    reload();
  }

  const value = useMemo(
    () => ({ projects, error, reload, isOwner: Boolean(token), ...actions }),
    [projects, error, reload, token, actions],
  );

  return (
    <ProjectsContext.Provider value={value}>
      {children}
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
      {notice && <Toast notice={notice} />}
    </ProjectsContext.Provider>
  );
}

// A manual popover sits in the top layer, so the toast also shows above an open <dialog>.
function Toast({ notice }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.showPopover?.();
  }, [notice]);
  return (
    <p ref={ref} popover="manual" className={`toast${notice.error ? " error" : ""}`} role={notice.error ? "alert" : "status"}>
      {notice.text}
    </p>
  );
}

export function useProjects() {
  return useContext(ProjectsContext);
}

/** Published projects only, for the public parts of the site (the owner also gets hidden ones). */
export function usePublishedProjects() {
  const { projects, ...rest } = useProjects();
  const published = useMemo(() => projects?.filter((p) => p.is_published) ?? null, [projects]);
  return { projects: published, ...rest };
}
