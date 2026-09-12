import { useEffect, useState } from "react";
import "./LoadingState.css";

const SLOW_THRESHOLD_MS = 5500;

export default function LoadingState({ label = "Loading…" }) {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    setIsSlow(false);
    const timer = setTimeout(() => setIsSlow(true), SLOW_THRESHOLD_MS);
    return () => clearTimeout(timer);
  }, [label]);

  return (
    <div className="ml-loading-state" role="status" aria-live="polite">
      <span className="ml-loading-spinner" aria-hidden="true" />
      <span>{label}</span>
      {isSlow ? <span className="ml-loading-slow">Still working…</span> : null}
    </div>
  );
}
