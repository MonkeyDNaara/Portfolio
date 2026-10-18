import { useLanguage } from "../i18n/LanguageProvider.jsx";

export function Loading({ children }) {
  const { t } = useLanguage();
  return (
    <p className="status" role="status">
      {children ?? t("status.loading")}
    </p>
  );
}

export function ErrorMessage({ error, onRetry }) {
  const { t } = useLanguage();
  return (
    <div className="status error" role="alert">
      <p>{error.message}</p>
      {onRetry && (
        <button className="btn small" onClick={onRetry}>
          {t("status.retry")}
        </button>
      )}
    </div>
  );
}
