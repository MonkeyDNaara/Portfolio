import { useEffect, useRef, useState } from "react";

import { api, imageUrl } from "../api.js";
import { resizeImage } from "../imageResize.js";

const EMPTY = { title: "", description: "", repo_url: "", live_url: "", techs: "", featured: false, is_published: true };

function fromProject(p) {
  return {
    title: p.title,
    description: p.description,
    repo_url: p.repo_url,
    live_url: p.live_url || "",
    techs: p.techs.map((t) => t.name).join(", "),
    featured: p.featured,
    is_published: p.is_published,
  };
}

/** Modal form to add (project = null) or edit a project. */
export default function ProjectForm({ project, token, onSaved, onClose, onUnauthorized }) {
  const dialog = useRef(null);
  const fileInput = useRef(null);
  const [form, setForm] = useState(project ? fromProject(project) : EMPTY);
  const [savedId, setSavedId] = useState(project?.id ?? null);
  const [imageBlob, setImageBlob] = useState(null);
  const [preview, setPreview] = useState(project ? imageUrl({ ...project, is_published: true }) : null);
  const [removeImage, setRemoveImage] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    const d = dialog.current;
    if (!d.open) d.showModal();
  }, []);

  useEffect(() => () => preview?.startsWith("blob:") && URL.revokeObjectURL(preview), [preview]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const check = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.checked }));

  function fail(e) {
    if (e.status === 401) return onUnauthorized();
    setError(e.message);
  }

  async function run(label, fn) {
    setBusy(label);
    setError("");
    setInfo("");
    try {
      await fn();
    } catch (e) {
      fail(e);
    } finally {
      setBusy("");
    }
  }

  const importFromGithub = () =>
    run("import", async () => {
      const data = await api("/github/import", { method: "POST", body: { repo_url: form.repo_url }, token });
      setForm((f) => ({
        ...f,
        title: data.title || f.title,
        description: data.description || f.description,
        repo_url: data.repo_url,
        live_url: data.live_url || f.live_url,
        techs: data.techs.length ? data.techs.join(", ") : f.techs,
      }));
      setInfo("Imported from GitHub. Check the fields and adjust them.");
    });

  const draftDescription = () =>
    run("ai", async () => {
      const data = await api("/ai/generate-description", { method: "POST", body: { repo_url: form.repo_url }, token });
      setForm((f) => ({ ...f, description: data.description }));
      setInfo("Draft added. Read it and edit it before saving.");
    });

  async function pickImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const blob = await resizeImage(file);
      setImageBlob(blob);
      setRemoveImage(false);
      setPreview(URL.createObjectURL(blob));
    } catch (err) {
      setError(err.message || "Could not read this image.");
    }
    e.target.value = "";
  }

  function dropImage() {
    setImageBlob(null);
    setPreview(null);
    setRemoveImage(true);
  }

  function onSubmit(e) {
    e.preventDefault();
    run("save", async () => {
      const body = {
        title: form.title,
        description: form.description,
        repo_url: form.repo_url,
        live_url: form.live_url.trim() || null,
        techs: form.techs.split(",").map((t) => t.trim()).filter(Boolean),
        featured: form.featured,
        is_published: form.is_published,
      };
      const saved = await api(savedId ? `/projects/${savedId}` : "/projects", {
        method: savedId ? "PUT" : "POST",
        body,
        token,
      });
      setSavedId(saved.id); // a retry after an image error must not create a second project
      if (imageBlob) {
        const data = new FormData();
        data.append("file", imageBlob, "preview.jpg");
        await api(`/projects/${saved.id}/image`, { method: "PUT", body: data, token });
      } else if (removeImage && saved.image_version) {
        await api(`/projects/${saved.id}/image`, { method: "DELETE", token });
      }
      onSaved(project ? "Project updated." : "Project added.");
    });
  }

  const hasRepo = form.repo_url.trim().length > 0;

  return (
    <dialog ref={dialog} className="modal" onClose={onClose} aria-labelledby="form-title">
      <form className="form" onSubmit={onSubmit}>
        <h2 id="form-title">{project ? "Edit project" : "Add project"}</h2>

        <label>
          GitHub repo URL
          <input type="url" value={form.repo_url} onChange={set("repo_url")} placeholder="https://github.com/MonkeyDNaara/..." required />
        </label>
        <p className="actions tight">
          <button type="button" className="btn small" onClick={importFromGithub} disabled={!hasRepo || !!busy}>
            {busy === "import" ? "Importing…" : "Import from GitHub"}
          </button>
          <button type="button" className="btn small" onClick={draftDescription} disabled={!hasRepo || !!busy}>
            {busy === "ai" ? "Reading README…" : "Draft description (AI)"}
          </button>
        </p>

        <label>
          Title
          <input value={form.title} onChange={set("title")} maxLength={120} required />
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

        <div className="image-field">
          <span>Preview image (optional)</span>
          {preview && <img className="thumb" src={preview} alt="Preview of the selected project image" />}
          <p className="actions tight">
            <button type="button" className="btn small" onClick={() => fileInput.current.click()}>
              {preview ? "Replace image" : "Choose image"}
            </button>
            {preview && (
              <button type="button" className="btn small danger" onClick={dropImage}>
                Remove image
              </button>
            )}
          </p>
          <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickImage} hidden />
        </div>

        <label className="check">
          <input type="checkbox" checked={form.featured} onChange={check("featured")} />
          Featured on the home page
        </label>
        <label className="check">
          <input type="checkbox" checked={form.is_published} onChange={check("is_published")} />
          Published (uncheck to keep it hidden)
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {info && (
          <p className="form-ok" role="status">
            {info}
          </p>
        )}
        <p className="actions">
          <button className="btn primary" disabled={!!busy}>
            {busy === "save" ? "Saving…" : project || savedId ? "Save changes" : "Add project"}
          </button>
          <button type="button" className="btn" onClick={() => dialog.current.close()}>
            Cancel
          </button>
        </p>
      </form>
    </dialog>
  );
}
