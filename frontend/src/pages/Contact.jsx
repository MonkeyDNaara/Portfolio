import { FileText, GitHub, LinkedIn, Mail } from "../components/Icons.jsx";
import { profile } from "../data/profile.js";
import { useLanguage } from "../i18n/LanguageProvider.jsx";

export default function Contact() {
  const { t } = useLanguage();
  const rows = [
    { icon: <Mail />, label: t("contact.email"), text: profile.email, href: `mailto:${profile.email}` },
    { icon: <LinkedIn />, label: t("contact.linkedin"), text: profile.linkedin.replace(/^https:\/\/(www\.)?/, ""), href: profile.linkedin },
    { icon: <GitHub />, label: t("contact.github"), text: profile.github.replace("https://", ""), href: profile.github },
    { icon: <FileText />, label: t("contact.resume"), text: "PDF", href: profile.resume },
  ].filter((r) => r.href && r.href !== "mailto:");

  return (
    <section className="page-head">
      <div className="card contact">
        <span className="tag">{t("contact.tag")}</span>
        <h1>{t("contact.title")}</h1>
        <p className="lead">{t("contact.lead")}</p>
        <ul className="contact-list">
          {rows.map((r) => (
            <li key={r.label}>
              <a href={r.href} {...(r.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
                {r.icon}
                <span>
                  <small>{r.label}</small>
                  {r.text}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
