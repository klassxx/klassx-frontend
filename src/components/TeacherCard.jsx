// Carte enseignant publique — utilisée sur la page d'accueil (aperçu) et
// sur la page "Nos Enseignants" (liste complète), pour garder un seul
// composant à faire évoluer. Attend un objet au format renvoyé par
// GET /api/public/teachers/ (voir PublicTeacherSerializer côté backend) :
// { id, full_name, photo, subject_name, title_degree, bio_short }.
export default function TeacherCard({ teacher }) {
  return (
    <div className="card" style={{ textAlign: "center" }}>
      <div
        style={{
          width: 84,
          height: 84,
          borderRadius: "50%",
          margin: "0 auto 14px",
          overflow: "hidden",
          background: "var(--surface-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
        }}
      >
        {teacher.photo ? (
          <img src={teacher.photo} alt={teacher.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          "👤"
        )}
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 2px" }}>{teacher.full_name}</p>
      {teacher.subject_name && (
        <p style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, margin: "0 0 6px" }}>{teacher.subject_name}</p>
      )}
      {teacher.title_degree && (
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 10px" }}>{teacher.title_degree}</p>
      )}
      {teacher.bio_short && (
        <p style={{ fontSize: 13, color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.5, margin: 0 }}>
          « {teacher.bio_short} »
        </p>
      )}
    </div>
  );
}
