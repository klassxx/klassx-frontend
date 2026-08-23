import { useEffect, useState } from "react";
import { api } from "../api/client";

// Affiché sur les 3 tableaux de bord (élève, enseignant, affilié) — le
// programme de parrainage est ouvert à tout type de compte, pas
// seulement aux enseignants (spec confirmée avec le product owner).
const CURRENCY_SUFFIX = { EUR: "€", TND: "DT" };

function formatCurrency(amount, currency) {
  return `${amount} ${CURRENCY_SUFFIX[currency] || currency}`;
}

export default function ReferralCard({ user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .myReferrals()
      .then(setData)
      .catch(() => setError("Impossible de charger votre parrainage pour le moment."));
  }, []);

  const referralCode = data?.referral_code || user?.referral_code;
  const link = referralCode ? `${window.location.origin}/inscription?ref=${referralCode}` : "";
  const commissionRate = data?.commission_rate ? Number(data.commission_rate).toFixed(0) : "10";
  const totals = data?.totals || {};
  const currencies = Object.keys(totals);
  const referredStudents = data?.referred_students || [];

  function copyLink() {
    if (link) navigator.clipboard?.writeText(link);
  }

  return (
    <section
      className="card"
      style={{ marginBottom: 24, border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Mon parrainage</h2>
        <span
          style={{
            fontSize: 12, fontWeight: 600, color: "var(--ink)", background: "var(--bg-subtle, #f0f0f0)",
            padding: "2px 10px", borderRadius: 999, border: "1px solid var(--border)",
          }}
        >
          {commissionRate}% de commission
        </span>
      </div>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 16px" }}>
        Chaque personne qui s'inscrit avec votre lien vous rapporte {commissionRate}% de ce qu'elle
        paie sur KLASSX, tant qu'elle reste inscrite.
      </p>

      {error && <p style={{ fontSize: 13, color: "var(--danger, #c0392b)", margin: "0 0 12px" }}>{error}</p>}

      {referralCode ? (
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input readOnly value={link} style={{ flex: 1, fontSize: 13 }} onFocus={(e) => e.target.select()} />
          <button onClick={copyLink}>Copier</button>
        </div>
      ) : (
        !error && (
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 20px" }}>
            Votre lien de parrainage est en cours de génération — rechargez la page dans un instant.
          </p>
        )
      )}

      <div
        style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20,
        }}
      >
        <div style={{ padding: 12, borderRadius: 8, background: "var(--bg-subtle, #f7f7f7)" }}>
          <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "0 0 4px" }}>Filleuls</p>
          <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{referredStudents.length}</p>
        </div>
        {currencies.length === 0 ? (
          <div style={{ padding: 12, borderRadius: 8, background: "var(--bg-subtle, #f7f7f7)" }}>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "0 0 4px" }}>Total gagné</p>
            <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>0 €</p>
          </div>
        ) : (
          currencies.map((currency) => (
            <div key={currency} style={{ padding: 12, borderRadius: 8, background: "var(--bg-subtle, #f7f7f7)" }}>
              <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "0 0 4px" }}>
                Gagné ({currency === "TND" ? "Tunisie" : "Europe"})
              </p>
              <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                {formatCurrency(totals[currency].earned, currency)}
              </p>
              {Number(totals[currency].unpaid) > 0 && (
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>
                  dont {formatCurrency(totals[currency].unpaid, currency)} pas encore versé
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {referredStudents.length > 0 && (
        <>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 8px" }}>
            Détail par filleul
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {referredStudents.map((s, i) => (
              <div
                key={i}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13,
                }}
              >
                <span>
                  {s.first_name} {s.last_initial}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                  {Object.entries(s.totals)
                    .map(([currency, amount]) => formatCurrency(amount, currency))
                    .join(" + ")}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
