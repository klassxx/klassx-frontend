import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../api/AuthContext";
import Skeleton from "../components/Skeleton";
import PaymentTrustBadge from "../components/PaymentTrustBadge";
import TunisiaPaymentNote from "../components/TunisiaPaymentNote";
import { useSeoMeta } from "../utils/seo";

export default function Packs() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState(null);
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useSeoMeta({
    title: "Nos Packs",
    description: "Découvrez les forfaits KLASSX pour préparer le Bac français en visio, où que vous soyez dans le monde — cours particuliers et en petits groupes, avec des enseignants qualifiés.",
  });

  useEffect(() => {
    api
      .packs()
      .then((data) => setPacks(data.results || data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleBuy(pack) {
    if (!user) {
      navigate(`/connexion?next=/packs`);
      return;
    }
    setBuyingId(pack.id);
    setMessage("");
    try {
      const data = await api.packCheckout(pack.id);
      if (data.checkout_url) {
        if (typeof window.gtag === "function") {
          window.gtag("event", "begin_checkout", {
            currency: "EUR",
            value: pack.price_cents / 100,
            items: [{ item_id: pack.id, item_name: pack.name }],
          });
        }
        window.location.href = data.checkout_url;
      } else {
        setMessage(data.detail || "Demande enregistrée — contactez-nous pour connaître les modalités de paiement.");
      }
    } catch (err) {
      setMessage(err.message || "La demande a échoué.");
    } finally {
      setBuyingId(null);
    }
  }

  return (
    <div className="container">
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 4px" }}>Nos Packs</h1>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 28px" }}>
        Plusieurs matières, un seul forfait — moins cher que réserver séparément.
      </p>

      {loading && <Skeleton variant="cards" count={3} />}
      {!loading && packs.length === 0 && (
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Aucun pack disponible pour l'instant.</p>
      )}
      {message && <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>{message}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        {packs.map((pack) => (
          <div key={pack.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{pack.name}</h3>
            <p style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600, margin: 0 }}>
              {pack.subject_names.join(" + ")}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              {pack.total_hours} heures incluses — {pack.group_tier_display}
            </p>
            {pack.description && (
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{pack.description}</p>
            )}
            <p style={{ fontSize: 22, fontWeight: 700, margin: "8px 0 0" }}>
              {(pack.price_cents / 100).toFixed(2)}€
            </p>
            <button className="btn-primary" onClick={() => handleBuy(pack)} disabled={buyingId === pack.id}>
              {buyingId === pack.id ? "…" : "Réserver ce pack"}
            </button>
            <PaymentTrustBadge />
            <TunisiaPaymentNote user={user} />
          </div>
        ))}
      </div>
    </div>
  );
}
