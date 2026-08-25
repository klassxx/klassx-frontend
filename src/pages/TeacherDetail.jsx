import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";

/**
 * Fiche détaillée d'un enseignant — /nos-enseignants/:id, ouverte depuis
 * une TeacherCard cliquable. Récupère le profil complet (avec la
 * biographie longue, absente de la liste/carte) via
 * GET /api/public/teachers/<id>/ (voir PublicTeacherDetailSerializer
 * côté backend).
 */
export default function TeacherDetail() {
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .publicTeacherDetail(id)
      .then(setTeacher)
      .catch(() => setError("Ce profil enseignant est introuvable ou n'est plus disponible."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 720 }}>
      <Link to="/nos-enseignants" style={{ fontSize: 13, fontWeight: 600 }}>
        ← Retour à l'équipe pédagogique
      </Link>

      {loading && <p style={{ marginTop: 24 }}>Chargement…</p>}
      {error && <p style={{ marginTop: 24, color: "var(--warning)" }}>{error}</p>}

      {!loading && !error && teacher && (
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              margin: "0 auto 20px",
              overflow: "hidden",
              background: "var(--surface-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
            }}
          >
            {teacher.photo ? (
              <img
                src={teacher.photo}
                alt={teacher.full_name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              "👤"
            )}
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 600, margin: "0 0 6px" }}>{teacher.full_name}</h1>

          {teacher.subject_name && (
            <p style={{ fontSize: 14, color: "var(--accent)", fontWeight: 600, margin: "0 0 4px" }}>
              {teacher.subject_name}
            </p>
          )}

          {teacher.title_degree && (
            <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 20px" }}>{teacher.title_degree}</p>
          )}

          {teacher.bio_short && (
            <p
              style={{
                fontSize: 16,
                fontStyle: "italic",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                margin: "0 0 24px",
              }}
            >
              « {teacher.bio_short} »
            </p>
          )}

          {teacher.bio && (
            <div style={{ textAlign: "left" }} className="card">
              <p style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 12px", color: "var(--text-muted)" }}>
                À propos
              </p>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-secondary)", whiteSpace: "pre-line", margin: 0 }}>
                {teacher.bio}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
