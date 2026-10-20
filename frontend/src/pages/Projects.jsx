import { useRef, useState } from "react";

import ProjectCard from "../components/ProjectCard.jsx";
import { ErrorMessage, Loading } from "../components/Status.jsx";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { useProjects } from "../projects.jsx";

export default function Projects() {
  const { t } = useLanguage();
  const { projects, error, reload, isOwner, add, reorder } = useProjects();
  const dragFrom = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  function move(from, to) {
    if (to < 0 || to >= projects.length || from === to) return;
    const next = [...projects];
    next.splice(to, 0, next.splice(from, 1)[0]);
    reorder(next);
  }

  return (
    <>
      <section className="page-head">
        <span className="tag">// projects</span>
        <h1>{t("projects.title")}</h1>
        <p className="lead">{t("projects.lead")}</p>
        {isOwner && (
          <p className="actions">
            <button className="btn primary" onClick={add}>
              {t("projects.add")}
            </button>
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
                  onMove: (dir) => move(i, i + dir),
                  canUp: i > 0,
                  canDown: i < projects.length - 1,
                }
              }
            />
          </div>
        ))}
      </div>
    </>
  );
}
