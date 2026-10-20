import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { useProject } from "../projects.jsx";
import { Close } from "./Icons.jsx";
import ProjectView from "./ProjectView.jsx";
import { ErrorMessage, Loading } from "./Status.jsx";

/**
 * /projects/:id opened from a card: the page you came from stays rendered underneath
 * (see `background` in App.jsx). Closing goes one step back in the history,
 * so the browser back button closes the modal too.
 */
export default function ProjectModal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { project, loading, notFound, error, reload } = useProject(id);
  const dialog = useRef(null);
  const [opener] = useState(() => document.activeElement); // gets the focus back on close

  useEffect(() => {
    const d = dialog.current;
    if (!d.open) d.showModal();
  }, []);

  // Esc, the close button and a click on the backdrop all end up here.
  function onClose() {
    navigate(-1);
    if (opener?.isConnected) opener.focus();
  }

  const close = () => dialog.current.close();

  return (
    <dialog
      ref={dialog}
      className="modal project-modal"
      aria-labelledby="project-modal-title"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="modal-inner">
        <button className="icon-btn modal-close" onClick={close} aria-label={t("projects.close")}>
          <Close />
        </button>
        {loading && <Loading>{t("projects.loading")}</Loading>}
        {(error || notFound) && (
          <ErrorMessage error={error || new Error(t("projects.notFound"))} onRetry={error ? reload : undefined} />
        )}
        {project && <ProjectView project={project} as="h2" headingId="project-modal-title" placeholder />}
      </div>
    </dialog>
  );
}
