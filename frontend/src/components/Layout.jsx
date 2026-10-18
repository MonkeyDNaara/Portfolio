import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../auth.jsx";
import { profile } from "../data/profile.js";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { useTheme } from "../theme/ThemeProvider.jsx";
import { Moon, Sun } from "./Icons.jsx";

const LINKS = [
  { to: "/projects", key: "nav.work" },
  { to: "/about", key: "nav.about" },
  { to: "/skills", key: "nav.skills" },
  { to: "/contact", key: "nav.contact" },
];

/* global __BUILD_COMMIT__ */
const BUILD = typeof __BUILD_COMMIT__ === "string" ? __BUILD_COMMIT__ : "dev";

export default function Layout() {
  const { token, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <a className="skip" href="#content">
        {t("nav.skip")}
      </a>
      <header className="site-header wrap">
        <Link className="logo" to="/">
          <span className="logo-mark" aria-hidden="true">
            {profile.initials}
          </span>
          {profile.name}
        </Link>
        <nav className="nav card" aria-label={t("nav.main")}>
          <ul>
            {LINKS.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to}>{t(l.key)}</NavLink>
              </li>
            ))}
          </ul>
          <span className="nav-sep" aria-hidden="true" />
          <button
            className="icon-btn"
            onClick={() => setLang(lang === "en" ? "de" : "en")}
            aria-label={t("nav.switchLang")}
            lang={lang === "en" ? "de" : "en"}
          >
            {lang === "en" ? "DE" : "EN"}
          </button>
          <button className="icon-btn" onClick={toggle} aria-label={theme === "dark" ? t("nav.toLight") : t("nav.toDark")}>
            {theme === "dark" ? <Sun /> : <Moon />}
          </button>
        </nav>
      </header>

      <main id="content" className="wrap">
        <Outlet />
      </main>

      <footer className="site-footer wrap">
        <span>
          © {new Date().getFullYear()} {profile.name} · {t("footer.builtWith")}
        </span>
        <span className="meta">
          <a className="build" href={`${profile.repo}/commit/${BUILD}`} target="_blank" rel="noreferrer" title={t("footer.build")}>
            v {BUILD}
          </a>
          {token ? (
            <button className="linklike" onClick={logout}>
              {t("footer.logout")}
            </button>
          ) : (
            <Link to="/login">{t("footer.login")}</Link>
          )}
        </span>
      </footer>
    </>
  );
}
