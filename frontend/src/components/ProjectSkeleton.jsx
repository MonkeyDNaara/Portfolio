import { useLanguage } from "../i18n/LanguageProvider.jsx";

// Grey placeholders in the shape of the real content, shown while the projects load.

function Lines() {
  return (
    <>
      <span className="sk-line title" />
      <span className="sk-line" />
      <span className="sk-line short" />
      <span className="sk-chips">
        <i />
        <i />
        <i />
      </span>
    </>
  );
}

function Hint() {
  const { t } = useLanguage();
  return <span className="visually-hidden">{t("projects.loading")}</span>;
}

/** `count` project cards, as a bento (home) or the normal 3-column grid. */
export function SkeletonGrid({ count, bento = false }) {
  return (
    <div className="skeleton-wrap" role="status">
      <Hint />
      <div className={bento ? "bento" : "project-grid"} aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="card project skeleton">
            <div className="shot" />
            <div className="body">
              <Lines />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** One block for the project detail page and the modal. */
export function ProjectViewSkeleton() {
  return (
    <div className="skeleton view-skeleton" role="status">
      <Hint />
      <div aria-hidden="true">
        <div className="shot" />
        <div className="body">
          <Lines />
        </div>
      </div>
    </div>
  );
}
