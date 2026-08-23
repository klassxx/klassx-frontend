import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import AuthLayout from "../components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Mot de passe oublié" subtitle="Recevez un lien pour en choisir un nouveau.">
      {sent ? (
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Si un compte existe avec l'adresse <strong>{email}</strong>, un email vient de lui être envoyé avec un lien
          de réinitialisation.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <p
              style={{
                background: "var(--warning-bg)",
                color: "var(--warning)",
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                fontSize: 13,
                marginBottom: 18,
              }}
            >
              {error}
            </p>
          )}

          <input
            type="email"
            placeholder="nom@exemple.com"
            required
            style={{ marginBottom: 22 }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button type="submit" className="btn-primary" style={{ width: "100%", marginBottom: 16 }} disabled={submitting}>
            {submitting ? "Envoi…" : "Envoyer le lien de réinitialisation"}
          </button>
        </form>
      )}

      <p style={{ fontSize: 13, color: "var(--text-secondary)", textAlign: "center", margin: 0 }}>
        <Link to="/connexion">Retour à la connexion</Link>
      </p>
    </AuthLayout>
  );
}
