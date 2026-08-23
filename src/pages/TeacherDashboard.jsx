import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../api/AuthContext";
import ReferralCard from "../components/ReferralCard";
import ParisDateTimePicker from "../components/ParisDateTimePicker";
import { parisWallTimeToUtcIso, splitLocalDateTime } from "../utils/parisTime";
import {
  IconCalendar, IconGroup, IconVideo, IconInbox, IconClock, IconCheckShield,
} from "../components/Icons";

const TIER_LABELS = {
  GROUP_10: "Groupe de 10",
  GROUP_8: "Groupe de 8",
  GROUP_6: "Groupe de 6",
  GROUP_5: "Groupe de 5",
  GROUP_4: "Groupe de 4",
  GROUP_3: "Groupe de 3",
  GROUP_2: "Groupe de 2",
  INDIVIDUAL: "Individuel",
};

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [googleNotice, setGoogleNotice] = useState("");
  const [myHours, setMyHours] = useState(null);

  function loadAll() {
    api
      .mySessions()
      .then((data) => setSessions((data.results || data).sort((a, b) => new Date(a.start_time) - new Date(b.start_time))))
      .catch(() => {});
    api
      .myGroupAssignments()
      .then((data) => setAllGroups(data.results || data))
      .catch(() => {});
    api
      .myTeacherSettings()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false));
    api.myTeacherHours().then(setMyHours).catch(() => {});
  }

  useEffect(() => {
    loadAll();

    // The Google connect flow redirects the browser back here with
    // ?google=connected or ?google=error once the OAuth round-trip is done.
    const params = new URLSearchParams(window.location.search);
    const googleParam = params.get("google");
    if (googleParam === "connected") {
      setGoogleNotice("Votre compte Google est connecté. Vos prochaines séances utiliseront un lien Meet généré automatiquement.");
    } else if (googleParam === "error") {
      setGoogleNotice("La connexion à Google a échoué. Vous pouvez réessayer, ou utiliser un lien personnel à la place.");
    }
    if (googleParam) {
      params.delete("google");
      const newSearch = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (newSearch ? `?${newSearch}` : ""));
    }
  }, []);

  const now = new Date();
  const todaySession = sessions.find((s) => new Date(s.start_time).toDateString() === now.toDateString());
  const upcoming = sessions.filter((s) => s !== todaySession && new Date(s.start_time) > now);
  const assignments = allGroups.filter((a) => !a.fully_scheduled);

  // Recurring groups (sessions sharing a series id), so we can offer
  // "Ajouter une séance" once per group rather than per occurrence.
  const seriesGroups = Object.values(
    upcoming.reduce((acc, s) => {
      if (!s.series) return acc;
      if (!acc[s.series]) acc[s.series] = { series: s.series, subject_name: s.subject_name, group_tier: s.group_tier, sessions: [] };
      acc[s.series].sessions.push(s);
      return acc;
    }, {})
  );

  async function handleUpload(e) {
    e.preventDefault();
    if (!uploadTarget || !uploadFile) return;
    setUploading(true);
    setMessage("");
    try {
      await api.uploadMaterial({ class_session: uploadTarget }, uploadTitle || uploadFile.name, uploadFile);
      setMessage("Support déposé avec succès.");
      setUploadTitle("");
      setUploadFile(null);
      setUploadTarget(null);
    } catch (err) {
      setMessage(err.message || "Le dépôt a échoué.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <div className="container">Chargement…</div>;

  return (
    <div className="container">
      <div className="page-header">
        <div className="page-header__icon">
          <IconCalendar />
        </div>
        <div>
          <h1>Mes cours</h1>
          <p>{sessions.length} cours à venir</p>
        </div>
      </div>

      {myHours && (
        <section
          className="card"
          style={{
            marginBottom: 24, display: "flex", gap: 24, flexWrap: "wrap",
            border: "1px solid var(--border)", borderRadius: 12, padding: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 8 }}>
            <IconClock />
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Mes heures</h2>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "0 0 2px" }}>Cette semaine</p>
            <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
              {myHours.hours_this_week} h{" "}
              <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>
                ({myHours.sessions_this_week} séance{myHours.sessions_this_week > 1 ? "s" : ""})
              </span>
            </p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "0 0 2px" }}>
              Ce mois-ci ({myHours.month})
            </p>
            <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
              {myHours.hours_this_month} h{" "}
              <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>
                ({myHours.sessions_this_month} séance{myHours.sessions_this_month > 1 ? "s" : ""})
              </span>
            </p>
          </div>
        </section>
      )}

      {user && <ReferralCard user={user} />}

      {user?.teacher_profile && !user.teacher_profile.is_active && (
        <div className="empty-state" style={{ borderStyle: "solid", borderColor: "transparent", background: "var(--warning-bg)", color: "var(--warning)", marginBottom: 20 }}>
          <IconCheckShield />
          Votre candidature est en cours d'examen par notre équipe — vous pourrez recevoir des groupes une fois
          votre compte validé. Vous pouvez déjà compléter votre profil ci-dessous.
        </div>
      )}

      {googleNotice && (
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>{googleNotice}</p>
      )}

      {todaySession && (
        <div className="card card-row today-card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div className="section-header__icon" style={{ marginTop: 2 }}>
              <IconVideo />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 500, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                {todaySession.subject_name} · {TIER_LABELS[todaySession.group_tier] || todaySession.group_tier}
                <span className="badge badge-accent">Aujourd'hui</span>
              </p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "2px 0 0" }}>
                À{" "}
                {new Date(todaySession.start_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                {" · "}
                {todaySession.seats_taken} élève{todaySession.seats_taken > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {todaySession.meeting_url ? (
            <a href={todaySession.meeting_url} target="_blank" rel="noreferrer">
              <button className="btn-primary">Démarrer</button>
            </a>
          ) : (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Lien pas encore disponible</span>
          )}
        </div>
      )}

      {assignments.length > 0 && (
        <div className="section">
          <div className="section-header">
            <div className="section-header__icon">
              <IconGroup />
            </div>
            <div>
              <h2>Groupes à planifier</h2>
              <p>Ces groupes vous ont été confiés — choisissez le jour, l'horaire et le lien de visioconférence.</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {assignments.map((a) => (
              <GroupAssignmentRow key={a.id} assignment={a} settings={settings} onScheduled={loadAll} onError={setMessage} />
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <div className="section-header">
          <div className="section-header__icon">
            <IconClock />
          </div>
          <div>
            <h2>Prochains cours</h2>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {upcoming.length === 0 && (
            <div className="empty-state">
              <IconInbox />
              Aucun autre cours à venir.
            </div>
          )}
          {upcoming.map((s) => (
            <div key={s.id} className="card card-row">
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>
                  {s.subject_name} · {TIER_LABELS[s.group_tier] || s.group_tier}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
                  {new Date(s.start_time).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                  {" · "}
                  {s.seats_taken} élève{s.seats_taken > 1 ? "s" : ""}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {s.meeting_url && (
                  <a href={s.meeting_url} target="_blank" rel="noreferrer">
                    <button className="btn-primary">Rejoindre</button>
                  </a>
                )}
                <button onClick={() => setUploadTarget(s.id)}>Déposer un support</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {allGroups.length > 0 && (
        <div className="section">
          <div className="section-header">
            <div className="section-header__icon">
              <IconGroup />
            </div>
            <div>
              <h2>Mes groupes</h2>
              <p>
                Déposez des documents ou des liens vidéo, et écrivez des messages pour les élèves de chaque groupe —
                tout est visible sur leur tableau de bord.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {allGroups.map((g) => (
              <GroupContentRow key={g.id} group={g} />
            ))}
          </div>
        </div>
      )}

      {seriesGroups.length > 0 && (
        <div className="section">
          <div className="section-header">
            <div className="section-header__icon">
              <IconCalendar />
            </div>
            <div>
              <h2>Mes groupes récurrents</h2>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {seriesGroups.map((g) => (
              <AddExtraSessionRow key={g.series} group={g} onAdded={loadAll} onError={setMessage} />
            ))}
          </div>
        </div>
      )}

      {uploadTarget && (
        <form onSubmit={handleUpload} className="card" style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 12px" }}>Déposer un support de cours</p>
          <input
            placeholder="Titre du document"
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <input type="file" onChange={(e) => setUploadFile(e.target.files[0])} style={{ marginBottom: 12, height: "auto" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setUploadTarget(null)}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={uploading || !uploadFile}>
              {uploading ? "Envoi…" : "Déposer"}
            </button>
          </div>
        </form>
      )}

      {message && <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{message}</p>}

      <div className="section" style={{ marginBottom: 0 }}>
        <div className="section-header">
          <div className="section-header__icon">
            <IconVideo />
          </div>
          <div>
            <h2>Réglages de visioconférence</h2>
          </div>
        </div>
        {settings && <TeacherVideoSettings settings={settings} onChange={setSettings} />}
      </div>
    </div>
  );
}

function GroupAssignmentRow({ assignment, settings, onScheduled, onError }) {
  const [expanded, setExpanded] = useState(assignment.status === "awaiting_schedule");
  const [slots, setSlots] = useState([{ startTime: "", durationMinutes: 120, endsOn: "" }]);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const targetHours = assignment.target_weekly_minutes ? assignment.target_weekly_minutes / 60 : null;
  const scheduledHours = (assignment.scheduled_weekly_minutes || 0) / 60;
  const newSlotsMinutes = slots.reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);
  const projectedHours = scheduledHours + newSlotsMinutes / 60;

  const linkPlaceholder = settings?.google_connected
    ? "Laissez vide pour générer un lien Google Meet automatiquement"
    : settings?.default_meeting_url
      ? `Laissez vide pour utiliser votre lien par défaut (${settings.default_meeting_url})`
      : "Collez votre lien de visioconférence (Meet, Zoom, Teams...)";

  function updateSlot(index, field, value) {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function addSlotRow() {
    setSlots((prev) => [...prev, { startTime: "", durationMinutes: 120, endsOn: prev[0]?.endsOn || "" }]);
  }

  function removeSlotRow(index) {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSchedule(e) {
    e.preventDefault();
    const isFirstSchedule = assignment.scheduled_slots.length === 0;
    for (const s of slots) {
      if (!s.startTime) return;
      if (isFirstSchedule && !s.endsOn) {
        onError("Indiquez une date de fin pour au moins le premier créneau.");
        return;
      }
    }
    setSubmitting(true);
    try {
      const payloadSlots = slots.map((s) => {
        const { day, hour, minute } = splitLocalDateTime(s.startTime);
        const startIso = parisWallTimeToUtcIso(day, hour, minute);
        const end = new Date(new Date(startIso).getTime() + Number(s.durationMinutes) * 60000);
        return { start_time: startIso, end_time: end.toISOString(), ends_on: s.endsOn || undefined };
      });
      await api.scheduleGroupAssignment(assignment.id, { slots: payloadSlots, meeting_url: meetingUrl || undefined });
      onScheduled();
    } catch (err) {
      onError(err.message || "La planification a échoué.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <div className="card-row" style={{ cursor: "pointer" }} onClick={() => setExpanded((v) => !v)}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>
            {assignment.subject_name} · {assignment.level === "terminale" ? "Terminale" : "1ère"} · {TIER_LABELS[assignment.group_tier]}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
            {assignment.student_count} élève{assignment.student_count > 1 ? "s" : ""}
            {targetHours ? ` · ${scheduledHours}h programmées sur ${targetHours}h/semaine` : ""}
          </p>
        </div>
        <button>{expanded ? "Fermer" : assignment.scheduled_slots.length ? "Ajouter un créneau" : "Planifier"}</button>
      </div>

      {assignment.scheduled_slots.length > 0 && (
        <ul style={{ margin: "12px 0 0", paddingLeft: 18, fontSize: 12, color: "var(--text-secondary)" }}>
          {assignment.scheduled_slots.map((s) => (
            <li key={s.id}>
              {s.weekday_display} {s.start_time.slice(0, 5)} · {Math.round((s.duration_minutes / 60) * 10) / 10}h
              {" "}(jusqu'au {new Date(s.ends_on).toLocaleDateString("fr-FR")})
            </li>
          ))}
        </ul>
      )}

      {expanded && (
        <form onSubmit={handleSchedule} style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          {targetHours && (
            <p style={{ fontSize: 12, margin: "0 0 12px", color: projectedHours >= targetHours ? "var(--accent)" : "var(--text-muted)" }}>
              Objectif : {targetHours}h/semaine — avec ces créneaux : {Math.round(projectedHours * 10) / 10}h
              {projectedHours < targetHours ? " (ajoutez un créneau pour compléter le forfait)" : " ✓ forfait complet"}
            </p>
          )}

          {slots.map((slot, index) => (
            <div key={index} style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                  Jour et heure <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(heure de Paris)</span>
                </label>
                <ParisDateTimePicker
                  value={slot.startTime}
                  onChange={(v) => updateSlot(index, "startTime", v)}
                  required
                />
              </div>
              <div style={{ width: 110 }}>
                <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                  Durée (min)
                </label>
                <input
                  type="number"
                  min={15}
                  step={15}
                  value={slot.durationMinutes}
                  onChange={(e) => updateSlot(index, "durationMinutes", e.target.value)}
                />
              </div>
              <div style={{ width: 150 }}>
                <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                  Se termine le
                </label>
                <input
                  type="date"
                  value={slot.endsOn}
                  onChange={(e) => updateSlot(index, "endsOn", e.target.value)}
                  placeholder={assignment.scheduled_slots[0]?.ends_on || ""}
                />
              </div>
              {slots.length > 1 && (
                <button type="button" onClick={() => removeSlotRow(index)}>
                  Retirer
                </button>
              )}
            </div>
          ))}

          <button type="button" onClick={addSlotRow} style={{ marginBottom: 16 }}>
            + Ajouter un autre créneau dans la semaine
          </button>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
              Lien de visioconférence (optionnel, appliqué à tous les créneaux ci-dessus)
            </label>
            <input
              type="url"
              placeholder={linkPlaceholder}
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Planification…" : "Valider ce(s) créneau(x)"}
          </button>
        </form>
      )}
    </div>
  );
}

function AddExtraSessionRow({ group, onAdded, onError }) {
  const [expanded, setExpanded] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    if (!startTime) return;
    setSubmitting(true);
    try {
      const { day, hour, minute } = splitLocalDateTime(startTime);
      const startIso = parisWallTimeToUtcIso(day, hour, minute);
      const end = new Date(new Date(startIso).getTime() + durationMinutes * 60000);
      await api.addExtraSession({
        series: group.series,
        start_time: startIso,
        end_time: end.toISOString(),
        meeting_url: meetingUrl || undefined,
      });
      setExpanded(false);
      setStartTime("");
      setMeetingUrl("");
      onAdded();
    } catch (err) {
      onError(err.message || "L'ajout de la séance a échoué.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <div className="card-row" style={{ cursor: "pointer" }} onClick={() => setExpanded((v) => !v)}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>
            {group.subject_name} · {TIER_LABELS[group.group_tier] || group.group_tier}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
            {group.sessions.length} prochaine{group.sessions.length > 1 ? "s" : ""} séance{group.sessions.length > 1 ? "s" : ""} planifiée{group.sessions.length > 1 ? "s" : ""}
          </p>
        </div>
        <button>{expanded ? "Fermer" : "Ajouter une séance"}</button>
      </div>

      {expanded && (
        <form onSubmit={handleAdd} style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 12px" }}>
            Pour un rattrapage ou une séance ponctuelle en plus du créneau habituel — tous les élèves actifs de ce
            groupe seront automatiquement inscrits.
          </p>
          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                Date et heure <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(heure de Paris)</span>
              </label>
              <ParisDateTimePicker value={startTime} onChange={setStartTime} required />
            </div>
            <div style={{ width: 120 }}>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                Durée (min)
              </label>
              <input
                type="number"
                min={15}
                step={15}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
              Lien de visioconférence (optionnel)
            </label>
            <input type="url" placeholder="Laissez vide pour utiliser votre lien habituel" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Ajout…" : "Ajouter cette séance"}
          </button>
        </form>
      )}
    </div>
  );
}

function GroupContentRow({ group }) {
  const [expanded, setExpanded] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [contentType, setContentType] = useState("document");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function load() {
    api.groupMaterials(group.id).then((data) => setMaterials(data.results || data)).catch(() => {});
    api.groupAnnouncements(group.id).then((data) => setAnnouncements(data.results || data)).catch(() => {});
  }

  function toggle() {
    if (!expanded) load();
    setExpanded((v) => !v);
  }

  async function handleAddContent(e) {
    e.preventDefault();
    if (!title || (contentType === "document" && !file) || (contentType === "video_link" && !videoUrl)) return;
    setSubmitting(true);
    setError("");
    try {
      if (contentType === "document") {
        await api.uploadMaterial({ group_assignment: group.id }, title, file);
      } else {
        await api.addVideoLink({ group_assignment: group.id }, title, videoUrl);
      }
      setTitle("");
      setFile(null);
      setVideoUrl("");
      load();
    } catch (err) {
      setError(err.message || "L'ajout a échoué.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteMaterial(id) {
    try {
      await api.deleteMaterial(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err.message || "La suppression a échoué.");
    }
  }

  async function handlePostAnnouncement(e) {
    e.preventDefault();
    if (!announcementMessage.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await api.postGroupAnnouncement(group.id, announcementMessage);
      setAnnouncementMessage("");
      load();
    } catch (err) {
      setError(err.message || "L'envoi a échoué.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAnnouncement(id) {
    try {
      await api.deleteGroupAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err.message || "La suppression a échoué.");
    }
  }

  return (
    <div className="card">
      <div className="card-row" style={{ cursor: "pointer" }} onClick={toggle}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>
            {group.subject_name} · {TIER_LABELS[group.group_tier] || group.group_tier}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
            {group.student_count} élève{group.student_count > 1 ? "s" : ""}
          </p>
        </div>
        <button>{expanded ? "Fermer" : "Contenu & annonces"}</button>
      </div>

      {expanded && (
        <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          {error && <p style={{ fontSize: 12, color: "var(--warning)", margin: "0 0 12px" }}>{error}</p>}

          <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>Documents & vidéos</p>
          {materials.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 8px" }}>Rien déposé pour l'instant.</p>
          )}
          <ul style={{ margin: "0 0 12px", paddingLeft: 18, fontSize: 13 }}>
            {materials.map((m) => (
              <li key={m.id} style={{ marginBottom: 4 }}>
                {m.content_type === "video_link" ? (
                  <a href={m.url} target="_blank" rel="noreferrer">
                    {m.title}
                  </a>
                ) : (
                  <a href={m.file} target="_blank" rel="noreferrer">
                    {m.title}
                  </a>
                )}
                {" — "}
                <button onClick={() => handleDeleteMaterial(m.id)} style={{ fontSize: 11, padding: "2px 8px" }}>
                  Supprimer
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={handleAddContent} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button
                type="button"
                onClick={() => setContentType("document")}
                className={contentType === "document" ? "btn-primary" : ""}
              >
                Document (PDF...)
              </button>
              <button
                type="button"
                onClick={() => setContentType("video_link")}
                className={contentType === "video_link" ? "btn-primary" : ""}
              >
                Lien vidéo
              </button>
            </div>
            <input
              placeholder="Titre"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            {contentType === "document" ? (
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                style={{ marginBottom: 8, height: "auto" }}
              />
            ) : (
              <input
                type="url"
                placeholder="https://..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                style={{ marginBottom: 8 }}
              />
            )}
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Ajout…" : "Ajouter"}
            </button>
          </form>

          <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>Messages au groupe</p>
          {announcements.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 8px" }}>Aucun message envoyé.</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {announcements.map((a) => (
              <div key={a.id} style={{ background: "var(--surface-1)", borderRadius: "var(--radius-sm)", padding: "8px 10px" }}>
                <p style={{ fontSize: 13, margin: 0, whiteSpace: "pre-wrap" }}>{a.message}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>
                  {new Date(a.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                  {" — "}
                  <button onClick={() => handleDeleteAnnouncement(a.id)} style={{ fontSize: 11, padding: "1px 6px" }}>
                    Supprimer
                  </button>
                </p>
              </div>
            ))}
          </div>

          <form onSubmit={handlePostAnnouncement}>
            <textarea
              placeholder="Écrire un message pour tous les élèves de ce groupe..."
              rows={3}
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
              style={{ width: "100%", marginBottom: 8, resize: "vertical" }}
            />
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Envoi…" : "Envoyer"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function TeacherVideoSettings({ settings, onChange }) {
  const [defaultMeetingUrl, setDefaultMeetingUrl] = useState(settings.default_meeting_url || "");
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [notice, setNotice] = useState("");

  async function handleSaveLink(e) {
    e.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      const updated = await api.updateTeacherSettings({ default_meeting_url: defaultMeetingUrl });
      onChange(updated);
      setNotice("Lien enregistré.");
    } catch (err) {
      setNotice(err.message || "L'enregistrement a échoué.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConnectGoogle() {
    setConnecting(true);
    setNotice("");
    try {
      const { authorization_url } = await api.connectGoogle();
      window.location.href = authorization_url;
    } catch (err) {
      setNotice(err.message || "La connexion à Google n'est pas disponible pour le moment.");
      setConnecting(false);
    }
  }

  async function handleDisconnectGoogle() {
    setConnecting(true);
    try {
      const updated = await api.disconnectGoogle();
      onChange(updated);
    } catch (err) {
      setNotice(err.message || "La déconnexion a échoué.");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 4px" }}>Compte Google</p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 8px" }}>
          Connectez votre compte Google pour qu'un lien Google Meet soit généré automatiquement, sur votre propre
          calendrier, pour chaque séance que vous planifiez.
        </p>
        {settings.google_connected ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13 }}>Connecté : {settings.google_account_email}</span>
            <button onClick={handleDisconnectGoogle} disabled={connecting}>
              {connecting ? "…" : "Déconnecter"}
            </button>
          </div>
        ) : (
          <button className="btn-primary" onClick={handleConnectGoogle} disabled={connecting}>
            {connecting ? "…" : "Connecter mon compte Google"}
          </button>
        )}
      </div>

      <form onSubmit={handleSaveLink}>
        <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 4px" }}>Lien personnel (Zoom, Teams, ou Meet)</p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 8px" }}>
          Utilisé par défaut si vous n'avez pas connecté de compte Google, ou pour tout autre outil de visioconférence.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="url"
            placeholder="https://..."
            value={defaultMeetingUrl}
            onChange={(e) => setDefaultMeetingUrl(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "…" : "Enregistrer"}
          </button>
        </div>
      </form>

      {notice && <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>{notice}</p>}
    </div>
  );
}
