// Chips cliquables pour choisir des matières/spécialités — utilisé à
// l'inscription (Register.jsx) et dans "Mes matières" du tableau de bord
// élève (Dashboard.jsx), pour garder un seul composant à faire évoluer.
export default function SpecialtyChips({ subjects, selected, onToggle, disabled = false }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
      {subjects.map((s) => {
        const isSelected = selected.includes(s.id);
        return (
          <button
            key={s.id}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(s.id)}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 12,
              border: isSelected ? "1px solid var(--ink)" : "1px solid var(--border)",
              background: isSelected ? "var(--ink)" : "var(--surface-1)",
              color: isSelected ? "white" : "var(--text-primary)",
              opacity: disabled ? 0.6 : 1,
              cursor: disabled ? "default" : "pointer",
            }}
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );
}
