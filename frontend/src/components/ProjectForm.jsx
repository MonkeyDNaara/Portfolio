import { useEffect, useRef, useState } from "react";

import { api, imageUrl } from "../api.js";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { resizeImage } from "../imageResize.js";

const EMPTY = { title: "", description: "", title_de: "", description_de: "", repo_url: "", live_url: "", techs: "", featured: false, is_published: true };

function fromProject(p) {
  return {
    title: p.title,
    description: p.description,
    title_de: p.title_de || "",
    description_de: p.description_de || "",
    repo_url: p.repo_url,
    live_url: p.live_url || "",
    techs: p.techs.map((t) => t.name).join(", "),
    featured: p.featured,
    is_published: p.is_published,
  };
}

/** Modal form to add (project = null) or edit a project. */
export default function ProjectForm({ project, token, onSaved, onClose, onUnauthorized }) {
  const { t } = useLanguage();
  const dialog = useRef(null);
  const [textLang, setTextLang] = useState("en"); // which language tab of title/description is open
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
      setInfo(t("form.imported"));
    });

  const draftDescription = () =>
    run("ai", async () => {
      const data = await api("/ai/generate-description", { method: "POST", body: { repo_url: form.repo_url }, token });
      setForm((f) => ({ ...f, description: data.description }));
      setInfo(t("form.drafted"));
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
        title_de: form.title_de.trim() || null,
        description_de: form.description_de.trim() || null,
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
      onSaved(project ? t("projects.updated") : t("projects.added"));
    });
  }

  const hasRepo = form.repo_url.trim().length > 0;

  const de = textLang === "de";

  return (
    <dialog ref={dialog} className="modal" onClose={onClose} aria-labelledby="form-title">
      <form className="form" onSubmit={onSubmit}>
        <h2 id="form-title">{project ? t("form.editTitle") : t("form.addTitle")}</h2>

        <label>
          {t("form.repo")}
          <input type="url" value={form.repo_url} onChange={set("repo_url")} placeholder="https://github.com/MonkeyDNaara/..." required />
        </label>
        <p className="actions tight">
          <button type="button" className="btn small" onClick={importFromGithub} disabled={!hasRepo || !!busy}>
            {busy === "import" ? t("form.importing") : t("form.import")}
          </button>
          <button type="button" className="btn small" onClick={draftDescription} disabled={!hasRepo || !!busy}>
            {busy === "ai" ? t("form.drafting") : t("form.draft")}
          </button>
        </p>

        <div className="lang-tabs" role="tablist" aria-label={t("form.language")}>
          {["en", "de"].map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              id={`tab-${l}`}
              aria-selected={textLang === l}
              aria-controls="text-fields"
              onClick={() => setTextLang(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        {/* Both languages stay in the DOM, so the browser still checks the required English fields. */}
        <div id="text-fields" role="tabpanel" aria-labelledby={`tab-${textLang}`} className="form">
          <div className="form" hidden={de}>
            <label>
              {t("form.title")} (EN)
              <input value={form.title} onChange={set("title")} onInvalid={() => setTextLang("en")} maxLength={120} required />
            </label>
            <label>
              {t("form.description")} (EN)
              <textarea value={form.description} onChange={set("description")} onInvalid={() => setTextLang("en")} rows={5} maxLength={2000} required />
            </label>
          </div>
          <div className="form" hidden={!de}>
            <p className="hint">{t("form.germanHint")}</p>
            <label>
              {t("form.title")} (DE)
              <input value={form.title_de} onChange={set("title_de")} maxLength={120} lang="de" />
            </label>
            <label>
              {t("form.description")} (DE)
              <textarea value={form.description_de} onChange={set("description_de")} rows={5} maxLength={2000} lang="de" />
            </label>
          </div>
        </div>

        <label>
          {t("form.live")}
          <input type="url" value={form.live_url} onChange={set("live_url")} />
        </label>
        <label>
          {t("form.techs")}
          <input value={form.techs} onChange={set("techs")} placeholder="Python, FastAPI, React" />
        </label>

        <div className="image-field">
          <span className="field-label">{t("form.image")}</span>
          {preview && <img className="shot" src={preview} alt={t("form.imageAlt")} />}
          <p className="actions tight">
            <button type="button" className="btn small" onClick={() => fileInput.current.click()}>
              {preview ? t("form.replaceImage") : t("form.chooseImage")}
            </button>
            {preview && (
              <button type="button" className="btn small danger" onClick={dropImage}>
                {t("form.removeImage")}
              </button>
            )}
          </p>
          <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickImage} hidden />
        </div>

        <label className="check">
          <input type="checkbox" checked={form.featured} onChange={check("featured")} />
          {t("form.featured")}
        </label>
        <label className="check">
          <input type="checkbox" checked={form.is_published} onChange={check("is_published")} />
          {t("form.published")}
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
        <p className="actions tight">
          <button className="btn primary" disabled={!!busy}>
            {busy === "save" ? t("form.saving") : project || savedId ? t("form.save") : t("form.create")}
          </button>
          <button type="button" className="btn" onClick={() => dialog.current.close()}>
            {t("form.cancel")}
          </button>
        </p>
      </form>
    </dialog>
  );
}
