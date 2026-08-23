import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../api/AuthContext";

const MONTH_FORMATTER = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

function formatMonth(dateStr) {
  const label = MONTH_FORMATTER.format(new Date(dateStr));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function VideoCapsules() {
  const { user } = useAuth();
  const isTunisia = user?.country === "Tunisie";
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subscribingPlanId, setSubscribingPlanId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .selfStudyPlans()
      .then((data) => setPlans(data.results || data))
      .catch(() => setError("Impossible de charger les abonnements."))
      .finally(() => setLoadingPlans(false));
  }, []);

  async function handleSubscribe(plan) {
    setSubscribingPlanId(plan.id);
    setError("");
    try {
      const data = await api.subscriptionCheckout(plan.id);
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setError(data.detail || "Contactez-nous pour connaître les modalités de paiement.");
        setSubscribingPlanId(null);
      }
    } catch (err) {
      setError(err.message || "Impossible de démarrer l'abonnement.");
      setSubscribingPlanId(null);
    }
  }

  return (
    <div className="container">
      <h1 style={{ fontSize: 26, fontWeight: 600, margin: "0 0 4px" }}>Mathématiques en libre-service</h1>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px" }}>
        Vidéos et PDF de révision, sans accompagnement par un enseignant. Chaque abonnement est
        indépendant — 4,99€/mois, résiliable à tout moment.
      </p>

      {error && (
        <p className="card" style={{ background: "var(--warning-bg)", color: "var(--warning)", border: "none", marginBottom: 20 }}>
          {error}
        </p>
      )}

      {loadingPlans ? (
        <p>Chargement…</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="card"
              style={{
                display: "flex", flexDirection: "column", gap: 10,
                border: selectedPlan?.id === plan.id ? "2px solid var(--ink)" : "1px solid var(--border)",
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{plan.name}</h3>
              <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                {isTunisia
                  ? `${plan.price_tnd.toFixed(2).replace(".", ",")} DT`
                  : `${plan.price_eur.toFixed(2).replace(".", ",")}€`}
                <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}> /mois</span>
              </p>
              {plan.is_subscribed ? (
                <button onClick={() => setSelectedPlan(plan)}>Voir le contenu</button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => handleSubscribe(plan)}
                  disabled={subscribingPlanId === plan.id}
                >
                  {subscribingPlanId === plan.id ? "…" : "S'abonner"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedPlan && <PlanContent plan={selectedPlan} onClose={() => setSelectedPlan(null)} />}
    </div>
  );
}

function PlanContent({ plan, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [playbackUrl, setPlaybackUrl] = useState(null);
  const [needsSubscription, setNeedsSubscription] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .selfStudyContent(`?plan=${plan.id}`)
      .then((data) => {
        const list = data.results || data;
        setItems(list);
        setSelectedItem((prev) => prev || list[0] || null);
      })
      .catch(() => setError("Impossible de charger le contenu de cet abonnement."))
      .finally(() => setLoading(false));
  }, [plan.id]);

  useEffect(() => {
    if (!selectedItem || selectedItem.content_type !== "video") {
      setPlaybackUrl(null);
      return;
    }
    setPlaybackUrl(null);
    setNeedsSubscription(false);
    api
      .selfStudyPlaybackUrl(selectedItem.id)
      .then((data) => setPlaybackUrl(data.url))
      .catch(() => setNeedsSubscription(true));
  }, [selectedItem]);

  async function handleDownload(item) {
    try {
      const { url } = await api.selfStudyDownloadUrl(item.id);
      window.open(url, "_blank");
    } catch (err) {
      setError(err.message || "Téléchargement impossible — abonnement peut-être expiré.");
    }
  }

  async function handleMarkWatched(item) {
    try {
      await api.markSelfStudyProgress(item.id, 100);
    } catch {
      // silently ignore — non-critical UI feedback
    }
  }

  const byMonth = useMemo(() => {
    const groups = {};
    for (const item of items) {
      if (!groups[item.month]) groups[item.month] = [];
      groups[item.month].push(item);
    }
    return groups;
  }, [items]);

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{plan.name}</h2>
        <button onClick={onClose}>Fermer</button>
      </div>

      {error && <p style={{ color: "var(--warning)", fontSize: 13 }}>{error}</p>}
      {loading && <p>Chargement…</p>}
      {!loading && items.length === 0 && !error && (
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          Aucun contenu débloqué pour le moment — revenez bientôt.
        </p>
      )}

      {selectedItem && selectedItem.content_type === "video" && (
        <div style={{ marginBottom: 20 }}>
          {needsSubscription ? (
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Votre abonnement à ce plan n'est plus actif.
            </p>
          ) : playbackUrl ? (
            <video
              key={selectedItem.id}
              src={playbackUrl}
              controls
              style={{ width: "100%", borderRadius: "var(--radius)", marginBottom: 8 }}
              onEnded={() => handleMarkWatched(selectedItem)}
            />
          ) : (
            <p>Chargement de la vidéo…</p>
          )}
        </div>
      )}

      {Object.keys(byMonth)
        .sort()
        .reverse()
        .map((month) => (
          <div key={month} style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 8px" }}>
              {formatMonth(month)}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {byMonth[month].map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 12px", borderRadius: 8,
                    border: selectedItem?.id === item.id ? "1px solid var(--ink)" : "1px solid var(--border)",
                    fontSize: 13, cursor: "pointer",
                  }}
                  onClick={() => (item.content_type === "video" ? setSelectedItem(item) : handleDownload(item))}
                >
                  <span>
                    {item.content_type === "video" ? "▶ " : "📄 "}
                    {item.chapter_name ? `${item.chapter_name} — ` : ""}
                    {item.title}
                  </span>
                  {item.content_type === "pdf" && (
                    <button onClick={(e) => { e.stopPropagation(); handleDownload(item); }}>
                      Télécharger
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
