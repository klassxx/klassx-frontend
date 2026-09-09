/**
 * Convertit un lien YouTube "normal" (celui qu'on copie depuis la barre
 * d'adresse ou le bouton Partager) vers le format "embed" nécessaire
 * pour l'intégrer dans une <iframe> — pour que l'admin/l'enseignant
 * n'ait jamais besoin de connaître ce détail technique, juste coller le
 * lien tel quel. Gère les deux formats les plus courants :
 * - https://www.youtube.com/watch?v=XXXXXXXXXXX
 * - https://youtu.be/XXXXXXXXXXX
 * Retourne null si le lien ne ressemble à aucun des deux formats
 * connus — dans ce cas, l'appelant doit éviter d'afficher une iframe
 * cassée.
 */
export function toYoutubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}
