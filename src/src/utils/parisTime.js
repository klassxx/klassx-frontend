// Toutes les heures affichées/saisies sur KLASSX sont l'heure de Paris —
// jamais celle du pays de la personne, jamais celle de son appareil. Deux
// personnes sur deux machines mal réglées (fréquent sur du matériel
// partagé) doivent quand même se donner rendez-vous au même instant.
//
// `new Date("YYYY-MM-DDTHH:MM")` (sans suffixe de fuseau) est interprété
// par le navigateur selon le fuseau de L'ORDINATEUR qui l'exécute — pas
// selon Paris. C'est ce qui causait le bug : un élève tunisien et un
// enseignant français pouvaient se retrouver décalés d'une heure sans
// que rien ne le signale. Cette fonction calcule le vrai décalage
// Paris/UTC pour la date donnée (gère l'heure d'été/hiver automatiquement)
// via l'API Intl du navigateur — aucune dépendance à installer.
export function parisWallTimeToUtcIso(dateStr, hour, minute) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const naiveUtc = new Date(Date.UTC(y, m - 1, Number(d), Number(hour), Number(minute)));
  const asParis = new Date(naiveUtc.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const asUtc = new Date(naiveUtc.toLocaleString("en-US", { timeZone: "UTC" }));
  const offsetMs = asParis.getTime() - asUtc.getTime();
  return new Date(naiveUtc.getTime() - offsetMs).toISOString();
}

// Liste de dates à venir (aujourd'hui + `daysAhead` jours), en français,
// pour remplacer le calendrier natif du navigateur — celui-ci suit la
// langue d'affichage du navigateur (pas celle du site), donc un élève ou
// enseignant avec Chrome en anglais verrait "Su Mo Tu..." malgré
// <html lang="fr">.
export function frenchDateOptions(daysAhead = 60) {
  const options = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    options.push({ iso, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
}

// Découpe une valeur "YYYY-MM-DDTHH:MM" (même convention que l'ancien
// <input type="datetime-local">) en ses 3 parties pour peupler les selects.
export function splitLocalDateTime(value) {
  const [day, time] = (value || "").split("T");
  return { day: day || "", hour: time ? time.slice(0, 2) : "", minute: time ? time.slice(3, 5) : "" };
}
