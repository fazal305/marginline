import { useOnlineStatus } from "../hooks/useOnlineStatus.js";
import "./OfflineBanner.css";

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="ml-offline-banner" role="status">
      You're offline — changes won't save until you reconnect.
    </div>
  );
}
