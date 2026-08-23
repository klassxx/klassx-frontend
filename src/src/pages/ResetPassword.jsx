import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "../api/client";
import AuthLayout from "../components/AuthLayout";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const uid = searchParams.get("uid") || "";
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setSubmitting(true);
    try {
      await api.confirmPasswordReset({ uid, token, password });
      setDone(true);
      setTimeout(() => navigate("/connexion"), 2500);
    } catch (err) {
      setError(err.message || "Ce lien n'est plus valide — faites une nouvelle demande.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!uid || !token) {
    return (
      <AuthLayout title="Lien invalide" subtitle="">
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>
          Ce lien de réinitialisation est incomplet ou invalide.
        </p>
        <Link to="/mot-de-passe-oublie">Faire une nouvelle demande</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Nouveau mot de passe" subtitle="Choisissez un nouveau mot de passe pour votre compte.">
      {done ? (
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Votre mot de passe a été mis à jour. Redirection vers la connexion…
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
            type="password"
            placeholder="Nouveau mot de passe"
            required
            minLength={8}
            style={{ marginBottom: 14 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            required
            minLength={8}
            style={{ marginBottom: 22 }}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button type="submit" className="btn-primary" style={{ width: "100%", marginBottom: 16 }} disabled={submitting}>
            {submitting ? "Mise à jour…" : "Réinitialiser le mot de passe"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
