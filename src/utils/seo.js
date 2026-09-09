import { useEffect } from "react";

/**
 * Pose dynamiquement le titre de la page, les balises meta description/
 * og:*, et un bloc de données structurées JSON-LD (Schema.org) — sans
 * librairie externe (react-helmet non ajouté, pour rester cohérent avec
 * le reste du projet qui évite les nouvelles dépendances non testées).
 * Nettoie tout ce qu'il a posé en quittant la page, pour ne pas
 * polluer une autre page visitée ensuite dans la même session.
 *
 * `jsonLd` est un objet Schema.org classique (ex: { "@type": "Article",
 * ... }) — le "@context": "https://schema.org" est ajouté
 * automatiquement, pas besoin de le répéter à chaque appel.
 */
export function useSeoMeta({ title, description, image, jsonLd }) {
  useEffect(() => {
    if (!title) return;
    const previousTitle = document.title;
    document.title = `${title} — KLASSX`;

    const createdElements = [];
    function setMeta(attr, key, content) {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      const created = !el;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
      if (created) createdElements.push(el);
    }
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    if (image) setMeta("property", "og:image", image);

    let scriptEl = null;
    if (jsonLd) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.text = JSON.stringify({ "@context": "https://schema.org", ...jsonLd });
      document.head.appendChild(scriptEl);
    }

    return () => {
      document.title = previousTitle;
      createdElements.forEach((el) => el.remove());
      if (scriptEl) scriptEl.remove();
    };
  }, [title, description, image, jsonLd]);
}
