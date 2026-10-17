export function Loading({ children = "Loading…" }) {
  return (
    <p className="status" role="status">
      {children}
    </p>
  );
}

export function ErrorMessage({ error, onRetry }) {
  return (
    <div className="status error" role="alert">
      <p>{error.message}</p>
      {onRetry && (
        <button className="btn" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
