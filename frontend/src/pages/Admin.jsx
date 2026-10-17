import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { ErrorMessage, Loading } from "../components/Status.jsx";
import useProjects from "../useProjects.js";

const EMPTY = { title: "", description: "", repo_url: "", live_url: "", techs: "" };

export default function Admin() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const { projects, error: loadError, reload } = useProjects();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function handleError(e) {
    if (e.status === 401) {
      logout();
      navigate("/login", { replace: true });
      return;
    }
    setError(e.message);
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description,
      repo_url: p.repo_url,
      live_url: p.live_url || "",
      techs: p.techs.map((t) => t.name).join(", "),
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function generate() {
    setGenerating(true);
    setError("");
    setMessage("");
    try {
      const data = await api("/ai/generate-description", {
        method: "POST",
        body: { repo_url: form.repo_url },
        token,
      });
      setForm((f) => ({ ...f, description: data.description }));
      setMessage("Draft added. Read it and edit it before saving.");
    } catch (err) {
      handleError(err);
    } finally {
      setGenerating(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const body = {
      title: form.title,
      description: form.description,
      repo_url: form.repo_url,
      live_url: form.live_url.trim() || null,
      techs: form.techs.split(",").map((t) => t.trim()).filter(Boolean),
    };
    try {
      await api(editingId ? `/projects/${editingId}` : "/projects", {
        method: editingId ? "PUT" : "POST",
        body,
        token,
      });
      setMessage(editingId ? "Project updated." : "Project added.");
      reset();
      reload();
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(p) {
    if (!window.confirm(`Delete "${p.title}"? This can't be undone.`)) return;
    setError("");
    setMessage("");
    try {
      await api(`/projects/${p.id}`, { method: "DELETE", token });
      setMessage(`Deleted "${p.title}".`);
      if (editingId === p.id) reset();
      reload();
    } catch (err) {
      handleError(err);
    }
  }

  return (
    <section>
      <h1>Admin</h1>

      <form className="form" onSubmit={onSubmit}>
        <h2>{editingId ? "Edit project" : "Add project"}</h2>
        <label>
          Title
          <input value={form.title} onChange={set("title")} maxLength={120} required />
        </label>
        <label>
          GitHub repo URL
          <input type="url" value={form.repo_url} onChange={set("repo_url")} placeholder="https://github.com/MonkeyDNaara/..." required />
        </label>
        <label>
          Live demo URL (optional)
          <input type="url" value={form.live_url} onChange={set("live_url")} />
        </label>
        <label>
          Technologies (comma separated)
          <input value={form.techs} onChange={set("techs")} placeholder="Python, FastAPI, React" />
        </label>
        <label>
          Description
          <textarea value={form.description} onChange={set("description")} rows={5} maxLength={2000} required />
        </label>
        <p className="actions">
          <button type="button" className="btn small" onClick={generate} disabled={!form.repo_url || generating}>
            {generating ? "Reading README…" : "Draft description from README (AI)"}
          </button>
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="form-ok" role="status">
            {message}
          </p>
        )}
        <p className="actions">
          <button className="btn primary" disabled={busy}>
            {busy ? "Saving…" : editingId ? "Save changes" : "Add project"}
          </button>
          {editingId && (
            <button type="button" className="btn" onClick={reset}>
              Cancel
            </button>
          )}
        </p>
      </form>

      <h2>Existing projects</h2>
      {loadError && <ErrorMessage error={loadError} onRetry={reload} />}
      {!loadError && !projects && <Loading />}
      <ul className="admin-list">
        {projects?.map((p) => (
          <li key={p.id}>
            <span>{p.title}</span>
            <span className="row-actions">
              <button className="btn small" onClick={() => startEdit(p)}>
                Edit
              </button>
              <button className="btn small danger" onClick={() => onDelete(p)}>
                Delete
              </button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
