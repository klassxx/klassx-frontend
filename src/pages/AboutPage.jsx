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
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {page.content.split("\n\n").map((paragraph, i) => (
              <p
                key={i}
                style={{
                  fontSize: i === 0 ? 17 : 15,
                  fontWeight: i === 0 ? 500 : 400,
                  lineHeight: 1.8,
                  color: i === 0 ? "var(--text-primary)" : "var(--text-secondary)",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
