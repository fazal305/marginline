import "./PageEmptyState.css";

export default function PageEmptyState({ title, description, note }) {
  return (
    <div className="ml-empty-state">
      <h1>{title}</h1>
      <p>{description}</p>
      {note ? <p className="ml-empty-note">{note}</p> : null}
    </div>
  );
}
