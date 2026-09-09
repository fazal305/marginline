import "./LoadingState.css";

export default function LoadingState({ label = "Loading…" }) {
  return (
    <div className="ml-loading-state" role="status" aria-live="polite">
      <span className="ml-loading-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
