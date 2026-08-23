/**
 * Remplace le texte brut "Chargement…" par des silhouettes animées de la
 * forme du contenu à venir — donne une impression de rapidité/finition
 * même sur un réseau lent. `variant` choisit la forme :
 * - "cards" : une grille de cartes (catalogue, liste d'enseignants...)
 * - "rows" : des lignes empilées (tableau de bord, listes de sessions...)
 * - "text" : quelques lignes de texte (paragraphe, résumé...)
 */
export default function Skeleton({ variant = "rows", count = 3 }) {
  if (variant === "cards") {
    return (
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}
        aria-busy="true"
        aria-label="Chargement en cours"
      >
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="card skeleton-shimmer" style={{ height: 160 }} />
        ))}
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div aria-busy="true" aria-label="Chargement en cours">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer"
            style={{ height: 14, borderRadius: 4, marginBottom: 10, width: i === count - 1 ? "60%" : "100%" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }} aria-busy="true" aria-label="Chargement en cours">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-shimmer" style={{ height: 56, borderRadius: 10 }} />
      ))}
    </div>
  );
}
