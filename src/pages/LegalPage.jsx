import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function LegalPage({ slug }) {
  const [page, setPage] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setPage(null);
    setError("");
    api
      .staticPage(slug)
      .then(setPage)
      .catch(() => setError("Cette page n'est pas encore disponible."));
  }, [slug]);

  return (
    <div className="container" style={{ maxWidth: 760, padding: "3rem 1.5rem" }}>
      {error && <p style={{ color: "var(--text-secondary)" }}>{error}</p>}
      {page && (
        <>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 8px" }}>{page.title}</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 32px" }}>
            Dernière mise à jour le {new Date(page.updated_at).toLocaleDateString("fr-FR")}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {page.content.split("\n\n").map((paragraph, i) => (
              <p key={i} style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-primary)", margin: 0, whiteSpace: "pre-wrap" }}>
                {paragraph}
              </p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
