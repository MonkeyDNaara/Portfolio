import ProjectCard from "../components/ProjectCard.jsx";
import { ErrorMessage, Loading } from "../components/Status.jsx";
import useProjects from "../useProjects.js";

export default function Projects() {
  const { projects, error, reload } = useProjects();

  return (
    <section>
      <h1>Projects</h1>
      <p className="muted">
        <code>git log --oneline --graph</code> of the things I've built, newest first.
      </p>
      {error && <ErrorMessage error={error} onRetry={reload} />}
      {!error && !projects && <Loading>Loading projects… (the free-tier server can take ~30 s to wake up)</Loading>}
      {projects?.length === 0 && <p className="status">No projects yet.</p>}
      {projects?.map((p, i) => (
        <ProjectCard key={p.id} project={p} isHead={i === 0} />
      ))}
    </section>
  );
}
