// Petit badge coloré affiché à côté du nom d'une matière FLE/FLS, partout
// où un nom de matière est déjà affiché en texte simple (subject_name).
// Détecté par préfixe du nom ("FLE — ...", "FLS — ...") plutôt que par un
// champ dédié — ces noms viennent du seed (voir backend
// seed_subjects.py) et suivent déjà cette convention, donc pas besoin de
// changement backend/serializer pour ça.
export function languageTrack(subjectName) {
  if (!subjectName) return null;
  if (subjectName.startsWith("FLE")) return "FLE";
  if (subjectName.startsWith("FLS")) return "FLS";
  return null;
}

export default function LangBadge({ subjectName, style }) {
  const track = languageTrack(subjectName);
  if (!track) return null;
  const isFle = track === "FLE";
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.4,
        padding: "1px 7px",
        borderRadius: 999,
        marginLeft: 6,
        color: isFle ? "#1d4ed8" : "#7c3aed",
        background: isFle ? "#dbeafe" : "#ede9fe",
        verticalAlign: "middle",
        ...style,
      }}
    >
      {track}
    </span>
  );
}
