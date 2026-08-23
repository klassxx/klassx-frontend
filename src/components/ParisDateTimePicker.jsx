import { useEffect, useMemo, useState } from "react";
import { frenchDateOptions, splitLocalDateTime } from "../utils/parisTime";

/**
 * Remplace <input type="datetime-local"> partout où KLASSX a besoin d'une
 * date+heure précise (réservation individuelle, créneau récurrent
 * enseignant, séance ponctuelle). Toujours affiché en français, toujours
 * sous-entendu "heure de Paris" — voir src/utils/parisTime.js pour le
 * pourquoi. `value`/`onChange` gardent la même convention de chaîne
 * "YYYY-MM-DDTHH:MM" que l'ancien input natif, donc rien d'autre à
 * changer dans le code appelant.
 */
export default function ParisDateTimePicker({ value, onChange, daysAhead = 60, required = false }) {
  const dateOptions = useMemo(() => frenchDateOptions(daysAhead), [daysAhead]);

  // État local pour jour/heure/minute — indépendant de `value`, qui ne
  // devient non-vide qu'une fois les 3 renseignés. Sans ça, chaque select
  // se redessine avec une valeur toujours vide tant que les 2 autres ne
  // sont pas remplis, et la sélection en cours semble disparaître
  // aussitôt choisie (le bug remonté : "je choisis une date, elle ne
  // s'affiche pas").
  const initial = splitLocalDateTime(value);
  const [day, setDay] = useState(initial.day);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);

  // Si `value` change depuis l'extérieur (ex: restauration d'une
  // sélection après inscription/connexion — voir Catalog.jsx), on
  // resynchronise l'état local en conséquence.
  useEffect(() => {
    const split = splitLocalDateTime(value);
    setDay(split.day);
    setHour(split.hour);
    setMinute(split.minute);
  }, [value]);

  function update(next) {
    const d = next.day ?? day;
    const h = next.hour ?? hour;
    const min = next.minute ?? minute;
    setDay(d);
    setHour(h);
    setMinute(min);
    onChange(d && h !== "" && min !== "" ? `${d}T${h}:${min}` : "");
  }

  return (
    <div className="stack-on-mobile" style={{ display: "flex", gap: 8 }}>
      <select value={day} onChange={(e) => update({ day: e.target.value })} style={{ flex: 2 }} required={required}>
        <option value="" disabled>
          Choisir une date
        </option>
        {dateOptions.map((opt) => (
          <option key={opt.iso} value={opt.iso}>
            {opt.label}
          </option>
        ))}
      </select>
      <select value={hour} onChange={(e) => update({ hour: e.target.value })} style={{ flex: 1 }} required={required}>
        <option value="" disabled>
          Heure
        </option>
        {Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0")).map((h) => (
          <option key={h} value={h}>
            {h} h
          </option>
        ))}
      </select>
      <select value={minute} onChange={(e) => update({ minute: e.target.value })} style={{ flex: 1 }} required={required}>
        <option value="" disabled>
          Min
        </option>
        {["00", "15", "30", "45"].map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}
