import { profile } from "../data/profile.js";

export default function About() {
  return (
    <section>
      <h1>About me</h1>
      {profile.about.map((p) => (
        <p key={p.slice(0, 20)}>{p}</p>
      ))}
    </section>
  );
}
