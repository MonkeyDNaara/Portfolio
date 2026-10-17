import { Link } from "react-router-dom";

import { imageUrl } from "../api.js";
import TechBadge from "./TechBadge.jsx";

// Fake but stable short hash, just for the git-log look.
export function shortHash(text) {
  let h = 5381;
  for (const ch of text) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return h.toString(16).padStart(8, "0").slice(0, 7);
}

/**
 * `admin` is optional. When given, the owner controls are shown:
 * { onEdit, onDelete, onMove(-1|1), onToggle(field), canUp, canDown }
 */
export default function ProjectCard({ project, isHead, admin }) {
  const img = imageUrl(project);
  return (
    <article className={`commit${project.is_published ? "" : " is-hidden"}`}>
      <p className="commit-line">
        <span className="hash">* {shortHash(project.title)}</span>{" "}
        {isHead && <span className="head">(HEAD -&gt; main)</span>}
        {project.featured && <span className="tag featured">featured</span>}
        {!project.is_published && <span className="tag hidden">hidden</span>}
      </p>
      <h3>
        <Link to={`/projects/${project.id}`}>{project.title}</Link>
      </h3>
      {img && <img className="thumb" src={img} alt={`Screenshot of ${project.title}`} loading="lazy" />}
      <p>{project.description}</p>
      <div className="badges">
        {project.techs.map((t) => (
          <TechBadge key={t.id} name={t.name} color={t.color} />
        ))}
      </div>
      <p className="links">
        <a href={project.repo_url} target="_blank" rel="noreferrer">
          GitHub repo
        </a>
        {project.live_url && (
          <a href={project.live_url} target="_blank" rel="noreferrer">
            Live demo
          </a>
        )}
      </p>
      {admin && (
        <div className="owner-controls" role="group" aria-label={`Manage ${project.title}`}>
          <button className="btn small" onClick={() => admin.onMove(-1)} disabled={!admin.canUp} aria-label="Move up">
            ↑
          </button>
          <button className="btn small" onClick={() => admin.onMove(1)} disabled={!admin.canDown} aria-label="Move down">
            ↓
          </button>
          <button className="btn small" onClick={admin.onEdit}>
            Edit
          </button>
          <button className="btn small" onClick={() => admin.onToggle("featured")}>
            {project.featured ? "Unfeature" : "Feature"}
          </button>
          <button className="btn small" onClick={() => admin.onToggle("is_published")}>
            {project.is_published ? "Hide" : "Publish"}
          </button>
          <button className="btn small danger" onClick={admin.onDelete}>
            Delete
          </button>
        </div>
      )}
    </article>
  );
}
