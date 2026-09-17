import { useState } from "react";
import { api } from "../api/client";

// Séance du mardi 22 septembre 2026, 19h (heure de Paris), durée 1h.
// À mettre à jour manuellement pour chaque nouvelle séance.
const SESSION_LABEL = "Mardi 22 septembre";
const SESSION_TIME = "19h00";
const SESSION_DURATION = "1h";
const SESSION_DATE_ISO = "2026-09-22"; // envoyé au backend, format YYYY-MM-DD

export default function InfoSession() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.signupInfoSession(name, email, SESSION_DATE_ISO);
      setDone(true);
    } catch (err) {
      setError(err.message || "L'inscription a échoué. Réessayez dans un instant.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <p style={{ fontSize: 13, color: "var(--accent-text)", fontWeight: 600, margin: "0 0 8px" }}>
        KLASSX — Séance d'information gratuite
      </p>
      <h1 style={{ fontSize: 30, fontWeight: 700, margin: "0 0 12px" }}>
        Aider votre enfant à réussir l'épreuve de maths du bac
      </h1>
      <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: "0 0 24px" }}>
        Une heure pour comprendre ce qui fait vraiment la différence entre réviser et progresser — et comment KLASSX
        peut aider.
      </p>

      <div className="card-row card" style={{ marginBottom: 28, gap: 24 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Date</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{SESSION_LABEL}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Heure (Paris)</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{SESSION_TIME}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Durée</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{SESSION_DURATION}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 14px" }}>Ce qu'on aborde ensemble</h2>
        <ul style={{ margin: 0, paddingLeft: 20, color: "var(--text-secondary)", lineHeight: 1.8 }}>
          <li>Les erreurs de méthode les plus fréquentes en terminale, bien avant les erreurs de calcul</li>
          <li>Pourquoi s'entraîner seul avec des corrigés types ne suffit pas toujours</li>
          <li>Un extrait d'un cours sur les suites réelles, pour voir la méthode en situation</li>
          <li>Comment fonctionne l'accompagnement KLASSX, et pour qui c'est fait</li>
          <li>Un temps de questions ouvert, sans obligation d'inscription à la suite</li>
        </ul>
      </div>

      <div className="card" style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 6px" }}>Qui anime la séance</h2>
        <p style={{ fontSize: 14, color: "var(--accent-text)", fontWeight: 600, margin: "0 0 8px" }}>
          Melek Ben Ayed · Fondateur de KLASSX · 20 ans d'enseignement
        </p>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
          Professeur de mathématiques depuis vingt ans, spécialisé depuis cinq ans dans la préparation au
          baccalauréat français. Il anime lui-même les cours sur la plateforme.
        </p>
      </div>

      <div className="card">
        {!done ? (
          <form onSubmit={handleSubmit}>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 14px" }}>Réserver sa place</h2>

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Prénom et nom
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", marginBottom: 16 }}
            />

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Adresse email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", marginBottom: 16 }}
            />

            {error && <p style={{ fontSize: 13, color: "#B3261E", margin: "0 0 12px" }}>{error}</p>}

            <button type="submit" className="btn-accent" disabled={submitting} style={{ width: "100%" }}>
              {submitting ? "…" : "Je m'inscris à la séance"}
            </button>
            <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", margin: "10px 0 0" }}>
              Vous recevrez le lien de connexion par email avant la séance. Aucun engagement.
            </p>
          </form>
        ) : (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>C'est noté !</p>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
              Un email de confirmation vient de vous être envoyé, avec le lien pour rejoindre la séance le{" "}
              {SESSION_LABEL.toLowerCase()} à {SESSION_TIME}, pour {SESSION_DURATION}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
