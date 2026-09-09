import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

/**
 * /enseignant/parametres — séparé de TeacherDashboard.jsx (page "Mes
 * cours") pour ne pas surcharger cette dernière — spec : "ça devient
 * beaucoup de choses dans une même page". Regroupe ce qui concerne le
 * PROFIL de l'enseignant lui-même (visioconférence + profil public),
 * distinct de la gestion de ses cours/groupes qui reste sur le tableau
 * de bord principal.
 */
export default function TeacherSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [allSubjects, setAllSubjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.myTeacherSettings().then(setSettings).catch(() => {});
    api
      .subjects()
      .then((data) => setAllSubjects(data.results || data))
      .catch(() => {});
  }, []);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Mon profil</h1>
          <p>Réglages de visioconférence et profil public visible des élèves.</p>
        </div>
      </div>

      <button onClick={() => navigate("/enseignant")} style={{ marginBottom: 24 }}>
        ← Retour à Mes cours
      </button>

      {settings && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <TeacherVideoSettings settings={settings} onChange={setSettings} />
          <TeacherProfileSettings settings={settings} onChange={setSettings} allSubjects={allSubjects} />
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

function TeacherProfileSettings({ settings, onChange, allSubjects }) {
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(settings.photo || null);
  const [bio, setBio] = useState(settings.bio || "");
  const [bioShort, setBioShort] = useState(settings.bio_short || "");
  const [titleDegree, setTitleDegree] = useState(settings.title_degree || "");
  const [yearsOfExperience, setYearsOfExperience] = useState(settings.years_of_experience ?? "");
  const [subjectId, setSubjectId] = useState(settings.subject || "");
  const [introVideoUrl, setIntroVideoUrl] = useState(settings.intro_video_url || "");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      // FormData obligatoire dès qu'un fichier (photo) accompagne les
      // autres champs — apiFetch détecte FormData automatiquement et
      // n'essaie pas de le sérialiser en JSON (voir api/client.js).
      const formData = new FormData();
      if (photoFile) formData.append("photo", photoFile);
      formData.append("bio", bio);
      formData.append("bio_short", bioShort);
      formData.append("title_degree", titleDegree);
      if (yearsOfExperience !== "") formData.append("years_of_experience", yearsOfExperience);
      if (subjectId) formData.append("subject", subjectId);
      formData.append("intro_video_url", introVideoUrl);
      const updated = await api.updateTeacherSettings(formData);
      onChange(updated);
      setNotice("Profil mis à jour.");
    } catch (err) {
      setNotice(err.message || "L'enregistrement a échoué.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 4px" }}>Mon profil public</p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 8px" }}>
          Visible sur la page "Nos Enseignants" si votre profil y est mis en avant par l'équipe KLASSX.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Aperçu"
              style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 72, height: 72, borderRadius: "50%", background: "var(--surface-2)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              Photo
            </div>
          )}
          <input type="file" accept="image/*" onChange={handlePhotoChange} />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
            Accroche (courte phrase affichée sous votre nom)
          </label>
          <input
            type="text"
            placeholder='Ex : "Doctorante en Physique"'
            value={bioShort}
            onChange={(e) => setBioShort(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
            Diplôme / titre
          </label>
          <input
            type="text"
            placeholder={'Ex : "Maîtrise de Lettres modernes"'}
            value={titleDegree}
            onChange={(e) => setTitleDegree(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
            Années d'expérience
          </label>
          <input
            type="number"
            min="0"
            max="60"
            placeholder="Ex : 23"
            value={yearsOfExperience}
            onChange={(e) => setYearsOfExperience(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
            Matière principale mise en avant
          </label>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={{ width: "100%" }}>
            <option value="">— Aucune —</option>
            {allSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
            Vidéo de présentation (optionnel)
          </label>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 6px" }}>
            Collez simplement un lien YouTube normal — la conversion technique se fait automatiquement.
          </p>
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={introVideoUrl}
            onChange={(e) => setIntroVideoUrl(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
            Description
          </label>
          <textarea
            placeholder="Présentez-vous en quelques phrases..."
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            style={{ width: "100%", resize: "vertical" }}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={saving} style={{ alignSelf: "flex-start" }}>
          {saving ? "…" : "Enregistrer mon profil"}
        </button>
        {notice && <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>{notice}</p>}
      </form>
    </div>
  );
}

