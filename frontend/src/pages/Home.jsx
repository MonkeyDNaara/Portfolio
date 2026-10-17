import { Link } from "react-router-dom";

import { profile } from "../data/profile.js";

export default function Home() {
  return (
    <section>
      <pre className="terminal" aria-label="Introduction">
        <span className="prompt">$</span> whoami{"\n"}
        <span className="out">{profile.name}, {profile.title.toLowerCase()}</span>
        {"\n\n"}
        <span className="prompt">$</span> cat focus.txt{"\n"}
        <span className="out">{profile.tagline}</span>
        {"\n\n"}
        <span className="prompt">$</span> ls -1 stack/{"\n"}
        <span className="out">python  fastapi  postgresql  react  docker  github-actions</span>
      </pre>
      <h1>Hi, I'm {profile.name.split(" ")[0]}.</h1>
      <p className="lead">
        I'm switching from industrial automation to software development. This portfolio is itself a
        full-stack project: a FastAPI + PostgreSQL backend with JWT login, a React frontend and an
        admin page where I add my projects.
      </p>
      <p className="actions">
        <Link className="btn primary" to="/projects">
          See my projects
        </Link>
        <Link className="btn" to="/contact">
          Get in touch
        </Link>
      </p>
    </section>
  );
}
