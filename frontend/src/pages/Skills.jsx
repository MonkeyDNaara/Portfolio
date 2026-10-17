import { skillGroups } from "../data/profile.js";

export default function Skills() {
  return (
    <section>
      <h1>Skills</h1>
      <pre className="terminal json" aria-label="Skills as JSON">
        {"{\n"}
        {skillGroups.map((g, i) => (
          <span key={g.name}>
            {"  "}
            <span className="key">"{g.name}"</span>: [
            {g.items.map((item, j) => (
              <span key={item}>
                <span className="str">"{item}"</span>
                {j < g.items.length - 1 ? ", " : ""}
              </span>
            ))}
            ]{i < skillGroups.length - 1 ? "," : ""}
            {"\n"}
          </span>
        ))}
        {"}"}
      </pre>
    </section>
  );
}
