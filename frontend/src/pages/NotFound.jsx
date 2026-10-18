import { Link } from "react-router-dom";

import { useLanguage } from "../i18n/LanguageProvider.jsx";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <section className="not-found">
      <p className="code" aria-hidden="true">
        404
      </p>
      <h1>{t("notFound.text")}</h1>
      <Link to="/">{t("notFound.back")}</Link>
    </section>
  );
}
