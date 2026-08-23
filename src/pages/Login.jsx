import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../api/AuthContext";
import AuthLayout from "../components/AuthLayout";

const REDIRECT_BY_ROLE = {
  student: "/tableau-de-bord",
  teacher: "/enseignant",
  admin: "/admin",
  affiliate: "/parrainage",
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      // login() renvoie le user (via api.me()) — on redirige selon son
      // rôle réel plutôt que toujours vers le tableau de bord élève,
      // pour que admin/enseignant/affilié atterrissent au bon endroit.
      const me = await login(email, password);
      navigate(REDIRECT_BY_ROLE[me.role] || "/tableau-de-bord");
    } catch (err) {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Se connecter" subtitle="Retrouvez vos cours et vos matières.">
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
          style={{ marginBottom: 14 }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          required
          style={{ marginBottom: 10 }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <p style={{ fontSize: 12, textAlign: "right", margin: "0 0 22px" }}>
          <Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
        </p>

        <button type="submit" className="btn-primary" style={{ width: "100%", marginBottom: 16 }} disabled={submitting}>
          {submitting ? "Connexion…" : "Se connecter"}
        </button>

        <p style={{ fontSize: 13, color: "var(--text-secondary)", textAlign: "center", margin: 0 }}>
          Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
