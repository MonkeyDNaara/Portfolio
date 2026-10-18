import { profile } from "../data/profile.js";

export default function Contact() {
  return (
    <section>
      <h1>Contact</h1>
      <p>I'm looking for a junior back-end or full-stack position, ideally remote. Write me, I'm happy to talk.</p>
      <ul className="contact-list">
        <li>
          <span className="muted">email</span> <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </li>
        <li>
          <span className="muted">github</span>{" "}
          <a href={profile.github} target="_blank" rel="noreferrer">
            {profile.github.replace("https://", "")}
          </a>
        </li>
        {profile.linkedin && (
          <li>
            <span className="muted">linkedin</span>{" "}
            <a href={profile.linkedin} target="_blank" rel="noreferrer">
              {profile.linkedin.replace("https://", "")}
            </a>
          </li>
        )}
        {profile.resume && (
          <li>
            <span className="muted">resume</span>{" "}
            <a href={profile.resume} target="_blank" rel="noreferrer">
              download PDF
            </a>
          </li>
        )}
      </ul>
    </section>
  );
}
