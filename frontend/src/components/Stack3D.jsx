import { useLanguage } from "../i18n/LanguageProvider.jsx";

// The three layers of this project: database -> API -> UI. Hover spreads them apart.
const LAYERS = [
  { cls: "ui", label: "UI · React", top: "22%", color: "var(--layer-ui-b)" },
  { cls: "api", label: "API · FastAPI", top: "44%", color: "var(--layer-api-b)" },
  { cls: "db", label: "DB · PostgreSQL", top: "66%", color: "var(--layer-db-b)" },
];

export default function Stack3D() {
  const { t } = useLanguage();
  return (
    <div className="stack3d" role="img" aria-label={t("home.stackLabel")}>
      <div className="scene" aria-hidden="true">
        {[...LAYERS].reverse().map((l) => (
          <div key={l.cls} className={`layer ${l.cls}`} />
        ))}
      </div>
      {LAYERS.map((l) => (
        <span key={l.cls} className="label" style={{ top: l.top }} aria-hidden="true">
          <i style={{ background: l.color }} />
          {l.label}
        </span>
      ))}
    </div>
  );
}
