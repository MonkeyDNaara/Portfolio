import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth.jsx";
import { useLanguage } from "../i18n/LanguageProvider.jsx";

export default function Login() {
  const { token, login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (token) return <Navigate to="/projects" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(username, password);
      navigate(location.state?.from || "/projects", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card login">
      <span className="tag">// login</span>
      <h1>{t("login.title")}</h1>
      <p className="muted">{t("login.lead")}</p>
      <form className="form" onSubmit={onSubmit}>
        <label>
          {t("login.username")}
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </label>
        <label>
          {t("login.password")}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn primary" disabled={busy}>
          {busy ? t("login.busy") : t("login.submit")}
        </button>
      </form>
    </section>
  );
}
