import { useEffect } from "react";
import { useSeoMeta } from "../utils/seo";

const PROMOS = [
  {
    badge: "🎁 Offre de rentrée — jusqu'au 30 octobre 2026",
    title: "1 forfait de groupe acheté = 1 mois de Maths offert",
    description:
      "Même formule (taille de groupe et heures/mois) que votre forfait acheté, valable dès que votre groupe est constitué et votre premier mois facturé — contactez-nous à ce moment pour recevoir votre code.",
  },
  {
    badge: "🎁 Offre spéciale — valable jusqu'au 15 octobre 2026",
    title: "-50% sur les cours d'Espagnol, pendant 1 mois",
    description: "Avec le code promo KLASSX, à saisir au moment du paiement.",
  },
  {
    badge: "🎁 Offre de bienvenue — vos premières séances",
    title: "Physique-Chimie, SVT, Histoire-Géographie, NSI : -50% sur vos 2 premières séances",
    subtitle: "Maths, Maths Expertes et Maths Complémentaires : 1ère séance gratuite, puis -70% sur la 2e séance",
  },
];

export default function Promos() {
  useSeoMeta({
    title: "Nos promotions",
    description: "Découvrez toutes les offres en cours chez KLASSX : mois offert, réductions sur les cours de langues et sciences, séances de bienvenue à tarif réduit.",
  });

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 30, fontWeight: 700, margin: "32px 0 8px" }}>Nos promotions</h1>
      <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: "0 0 28px" }}>
        Toutes les offres en cours chez KLASSX, au même endroit.
      </p>

      {PROMOS.map((promo, i) => (
        <div
          key={i}
          className="card"
          style={{
            textAlign: "center", background: "var(--accent-soft, #FFF4E5)",
            border: "1px solid var(--accent, #E8A33D)", padding: "24px 20px",
            marginBottom: 20,
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 8px" }}>
            {promo.badge}
          </p>
          <p style={{ fontSize: 18, fontWeight: 600, margin: promo.subtitle || promo.description ? "0 0 6px" : 0 }}>
            {promo.title}
          </p>
          {promo.subtitle && (
            <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{promo.subtitle}</p>
          )}
          {promo.description && (
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "8px 0 0" }}>{promo.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
