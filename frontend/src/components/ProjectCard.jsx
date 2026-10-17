import { Link } from "react-router-dom";

import TechBadge from "./TechBadge.jsx";

// Fake but stable short hash, just for the git-log look.
export function shortHash(text) {
  let h = 5381;
  for (const ch of text) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return h.toString(16).padStart(8, "0").slice(0, 7);
}

export default function ProjectCard({ project, isHead }) {
  return (
    <article className="commit">
      <p className="commit-line">
        <span className="hash">* {shortHash(project.title)}</span>{" "}
        {isHead && <span className="head">(HEAD -&gt; main)</span>}
      </p>
      <h3>
        <Link to={`/projects/${project.id}`}>{project.title}</Link>
      </h3>
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
    </article>
  );
}
