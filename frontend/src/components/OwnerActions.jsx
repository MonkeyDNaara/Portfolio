import { useState } from "react";

import { localized, useLanguage } from "../i18n/LanguageProvider.jsx";
import { useProjects } from "../projects.jsx";

/**
 * Edit, feature, hide and delete for one project (only rendered for the owner).
 * Delete asks inline first instead of a browser confirm().
 */
export default function OwnerActions({ project, onEdit, onDeleted }) {
  const { lang, t } = useLanguage();
  const { toggle, remove } = useProjects();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const { title } = localized(project, lang);

  async function run(fn) {
    setBusy(true);
    const ok = await fn();
    setBusy(false);
    return ok;
  }

  async function confirmDelete() {
    if (await run(() => remove(project))) onDeleted();
  }

  return (
    <section className="owner-actions" aria-label={`${t("projects.manage")}: ${title}`}>
      <p className="owner-head">
        <span>{t("projects.manage")}</span>
        {project.featured && <span className="pill accent">{t("projects.featured")}</span>}
        {!project.is_published && <span className="pill">{t("projects.hidden")}</span>}
      </p>
      {confirming ? (
        <div className="confirm" role="alertdialog" aria-label={t("projects.delete")}>
          <p>{t("projects.confirmDelete", { title })}</p>
          <p className="actions tight">
            <button className="btn small danger" onClick={confirmDelete} disabled={busy}>
              {t("projects.delete")}
            </button>
            <button className="btn small" onClick={() => setConfirming(false)} disabled={busy} autoFocus>
              {t("projects.cancel")}
            </button>
          </p>
        </div>
      ) : (
        <p className="actions tight">
          <button className="btn small" onClick={onEdit} disabled={busy}>
            {t("projects.edit")}
          </button>
          <button className="btn small" onClick={() => run(() => toggle(project, "featured"))} disabled={busy}>
            {project.featured ? t("projects.unfeature") : t("projects.feature")}
          </button>
          <button className="btn small" onClick={() => run(() => toggle(project, "is_published"))} disabled={busy}>
            {project.is_published ? t("projects.hide") : t("projects.publish")}
          </button>
          <button className="btn small danger" onClick={() => setConfirming(true)} disabled={busy}>
            {t("projects.delete")}
          </button>
        </p>
      )}
    </section>
  );
}
