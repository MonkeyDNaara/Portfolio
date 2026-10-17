import { NavLink, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../auth.jsx";
import { profile } from "../data/profile.js";

const FILES = [
  { to: "/", label: "home.md", end: true },
  { to: "/about", label: "about.md" },
  { to: "/skills", label: "skills.json" },
  { to: "/projects", label: "projects/" },
  { to: "/contact", label: "contact.sh" },
];

function tabName(pathname) {
  if (pathname.startsWith("/projects/")) return "project.md";
  const hit = FILES.find((f) => (f.end ? pathname === f.to : pathname.startsWith(f.to)));
  if (hit) return hit.label;
  if (pathname.startsWith("/login")) return "login.sh";
  return "404.txt";
}

export default function Layout() {
  const { token, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <div className="app">
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="titlebar">
        <span className="dots" aria-hidden="true">
          <i style={{ background: "#e07a7a" }} />
          <i style={{ background: "#e9c46a" }} />
          <i style={{ background: "#7bc47f" }} />
        </span>
        <span>{profile.name.toLowerCase().replace(" ", "-")} — portfolio</span>
      </header>
      <div className="workspace">
        <nav className="sidebar" aria-label="Main">
          <p className="sidebar-title">EXPLORER</p>
          <ul>
            {FILES.map((f) => (
              <li key={f.to}>
                <NavLink to={f.to} end={f.end}>
                  {f.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <ul className="sidebar-bottom">
            {token ? (
              <li>
                <button className="linklike" onClick={logout}>
                  logout
                </button>
              </li>
            ) : (
              <li>
                <NavLink to="/login">login.sh</NavLink>
              </li>
            )}
          </ul>
        </nav>
        <div className="editor">
          <div className="tabs">
            <span className="tab">{tabName(pathname)}</span>
          </div>
          <main id="content" className="content">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
