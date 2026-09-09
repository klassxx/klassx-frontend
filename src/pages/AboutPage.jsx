import { useEffect, useState } from "react";
import { api } from "../api/client";

/**
 * /a-propos — réutilise le même contenu admin-géré que les pages
 * légales (StaticPage, slug="a-propos", voir Django admin → Static
 * pages → Ajouter), mais avec un traitement visuel plus soigné qu'une
 * simple page légale : gros titre centré, intro mise en valeur.
 */
export default function AboutPage() {
  const [page, setPage] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "À propos — KLASSX";
    api
      .staticPage("a-propos")
      .then(setPage)
      .catch(() => setError("Cette page n'est pas encore disponible."));
  }, []);

  return (
    <div className="container" style={{ maxWidth: 760, padding: "3rem 1.5rem" }}>
      {error && <p style={{ color: "var(--text-secondary)", textAlign: "center" }}>{error}</p>}
      {page && (
        <>
          <h1
            style={{
              fontFamily: "var(--font-heading, inherit)",
              fontSize: 36,
              fontWeight: 700,
              textAlign: "center",
              margin: "0 0 40px",
            }}
          >
            {page.title}
          </h1>
          <div
            style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 20 }}
            // Contenu HTML complet, comme pour le blog — sûr uniquement
            // parce que ce champ n'est modifiable que depuis l'admin
            // (jamais par un élève ou un enseignant). Voir BlogPostPage.jsx
            // pour la même logique appliquée aux articles.
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </>
      )}
    </div>
  );
}
