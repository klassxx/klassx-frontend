import { useAuth } from "../api/AuthContext";
import ReferralCard from "../components/ReferralCard";

export default function AffiliateDashboard() {
  const { user } = useAuth();

  if (!user) return <div className="container">Chargement…</div>;

  return (
    <div className="container">
      <h1 style={{ fontSize: 26, fontWeight: 600, margin: "0 0 4px" }}>
        Bonjour {user.first_name || user.username}
      </h1>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px" }}>
        Votre espace affilié KLASSX.
      </p>

      <ReferralCard user={user} />
    </div>
  );
}
