import { useEffect, useState } from "react";
import { api } from "../api/client";
import TeacherCard from "../components/TeacherCard";

export default function OurTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .publicTeachers()
      .then((data) => setTeachers(data.results || data))
      .catch(() => setError("Impossible de charger l'équipe pédagogique pour le moment."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 8px" }}>
        L'équipe
      </p>
      <h1 style={{ fontSize: 32, fontWeight: 600, margin: "0 0 12px" }}>Nos Enseignants</h1>
      <p style={{ fontSize: 15, color: "var(--text-secondary)", maxWidth: 640, margin: "0 0 36px" }}>
        Une équipe pédagogique d'enseignants experts du programme officiel, sélectionnés pour
        accompagner les élèves vers la réussite au bac, matière par matière.
      </p>

      {loading && <p>Chargement…</p>}
      {error && <p style={{ color: "var(--warning)" }}>{error}</p>}
      {!loading && !error && teachers.length === 0 && (
        <p style={{ color: "var(--text-muted)" }}>L'équipe pédagogique sera bientôt présentée ici.</p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 20,
        }}
      >
        {teachers.map((t) => (
          <TeacherCard key={t.id} teacher={t} />
        ))}
      </div>
    </div>
  );
}
