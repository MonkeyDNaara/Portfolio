import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section>
      <h1>404</h1>
      <p>This file doesn't exist.</p>
      <Link to="/">← back home</Link>
    </section>
  );
}
