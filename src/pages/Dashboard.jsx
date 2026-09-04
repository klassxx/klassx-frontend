import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../api/AuthContext";
import SpecialtyChips from "../components/SpecialtyChips";
import Skeleton from "../components/Skeleton";
import ReferralCard from "../components/ReferralCard";

const MAX_PREMIERE = 3;
const MAX_TERMINALE = 2;

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

const WEEKDAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [processingMembershipId, setProcessingMembershipId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.myEnrollments(), api.myGroupRequests(), api.mySeriesMemberships()])
      .then(([enrollmentData, requestData, membershipData]) => {
        setEnrollments(enrollmentData.results || enrollmentData);
        const requests = requestData.results || requestData;
        setPendingRequests(requests.filter((r) => r.status === "pending"));
        // Groups formed for this student (teacher assigned or already
        // scheduled) — deduplicated, used to show each group's shared
        // content/announcements below.
        const seen = new Set();
        setMyGroups(
          requests
            .filter((r) => r.group_assignment && !seen.has(r.group_assignment) && seen.add(r.group_assignment))
            .map((r) => ({ id: r.group_assignment, subject_name: r.subject_name, group_tier: r.group_tier }))
        );
        setMemberships(membershipData.results || membershipData);
      })
      .catch(() => setError("Impossible de charger votre tableau de bord."))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = enrollments
    .filter((e) => !e.cancelled_at && new Date(e.class_session_detail?.start_time) > new Date())
    .sort((a, b) => new Date(a.class_session_detail.start_time) - new Date(b.class_session_detail.start_time));

  async function handlePay(enrollment) {
    setPayingId(enrollment.id);
    setError("");
    try {
      const data = await api.enrollmentCheckout(enrollment.id);
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setError(data.detail || "Contactez-nous pour connaître les modalités de paiement.");
        setPayingId(null);
      }
    } catch (err) {
      setError(err.message || "Impossible de démarrer le paiement.");
      setPayingId(null);
    }
  }

  async function handleMembershipCheckout(membership) {
    setProcessingMembershipId(membership.id);
    setError("");
    try {
      const data = await api.seriesMembershipCheckout(membership.id);
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setError(data.detail || "Contactez-nous pour connaître les modalités de paiement.");
        setProcessingMembershipId(null);
      }
    } catch (err) {
      setError(err.message || "Impossible de démarrer l'abonnement.");
      setProcessingMembershipId(null);
    }
  }

  async function handleLeave(membership) {
    const confirmed = window.confirm(
      "Le mois en cours de ce groupe se termine sans changement. Quitter prend effet le 1er du mois prochain : vous restez inscrit(e) et facturé(e) jusque-là, puis votre place est libérée. Confirmer ?"
    );
    if (!confirmed) return;
    setProcessingMembershipId(membership.id);
    try {
      const updated = await api.leaveSeriesMembership(membership.id);
      setMemberships((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (err) {
      setError(err.message || "Impossible de traiter cette demande.");
    } finally {
      setProcessingMembershipId(null);
    }
  }

  return (
    <div className="container">
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 2px" }}>Bonjour</p>
        <h1 style={{ fontSize: 26, fontWeight: 600, margin: 0 }}>
          {user ? `${user.first_name} ${user.last_name}` : "…"}
        </h1>
        {user?.student_profile && (
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
            {user.student_profile.grade_level === "terminale" ? "Terminale" : "1ère"}
          </p>
        )}
        <Link to="/tableau-demo">
          <button style={{ marginTop: 10 }}>🖊️ Essayer le tableau interactif</button>
        </Link>
      </div>

      {error && <p style={{ color: "var(--warning)" }}>{error}</p>}
      {loading && <Skeleton variant="rows" count={3} />}

      {!loading && user?.student_profile && <MySpecialtiesSection user={user} onUpdated={setUser} />}
      {!loading && user && <ReferralCard user={user} />}

      {!loading && memberships.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>Mes groupes récurrents</h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 12px" }}>
            Facturation mensuelle, reconduite automatiquement. Un changement ou une annulation prend effet le mois suivant.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {memberships.map((m) => (
              <div key={m.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
                    {m.subject_name} · {TIER_LABELS[m.group_tier] || m.group_tier}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 0" }}>
                    {m.weekly_hours_display ? `${m.weekly_hours_display} · ` : ""}
                    {WEEKDAYS[m.weekday]} {m.start_time?.slice(0, 5)} · {m.monthly_price_eur.toFixed(2).replace(".", ",")} €/mois
                  </p>
                  {m.status === "leaving" && (
                    <p style={{ fontSize: 12, color: "var(--warning)", margin: "4px 0 0" }}>
                      Départ prévu le {new Date(m.leaves_on).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                  {m.status === "left" && (
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0" }}>Groupe quitté</p>
                  )}
                </div>
                {m.status === "active" && !m.stripe_subscription_id && (
                  <button className="btn-primary" onClick={() => handleMembershipCheckout(m)} disabled={processingMembershipId === m.id}>
                    {processingMembershipId === m.id ? "…" : "S'abonner"}
                  </button>
                )}
                {m.status === "active" && m.stripe_subscription_id && (
                  <button onClick={() => handleLeave(m)} disabled={processingMembershipId === m.id}>
                    {processingMembershipId === m.id ? "…" : "Quitter ce groupe"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && pendingRequests.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>En attente de groupe</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {pendingRequests.map((r) => (
              <div key={r.id} className="card" style={{ color: "var(--text-secondary)" }}>
                <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: "var(--text-primary)" }}>
                  {r.subject_name} · {r.level === "terminale" ? "Terminale" : "1ère"} · {TIER_LABELS[r.group_tier]}
                </p>
                <p style={{ fontSize: 12, margin: "4px 0 0" }}>
                  Nous vous contactons dès qu'un groupe est formé pour cette combinaison.
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && myGroups.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>Contenu & annonces de mes groupes</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {myGroups.map((g) => (
              <StudentGroupContent key={g.id} group={g} />
            ))}
          </div>
        </>
      )}

      <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>Mes prochaines sessions</h2>

      {!loading && upcoming.length === 0 && (
        <div className="card" style={{ color: "var(--text-muted)" }}>
          Aucune session à venir. <a href="/catalogue">Demandez une place</a> pour commencer.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {upcoming.map((enrollment) => {
          const session = enrollment.class_session_detail;
          return (
            <div key={enrollment.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
                  {session?.subject_name} · {TIER_LABELS[session?.group_tier] || session?.group_tier}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 0" }}>
                  {session?.start_time &&
                    new Date(session.start_time).toLocaleString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  {enrollment.payment_status !== "paid" &&
                    session?.price_eur != null &&
                    ` · ${session.price_eur.toFixed(2).replace(".", ",")} €`}
                </p>
                {enrollment.waitlisted && (
                  <span style={{ fontSize: 11, color: "var(--warning)", fontWeight: 500 }}>Liste d'attente</span>
                )}
              </div>
              {!enrollment.waitlisted && enrollment.payment_status !== "paid" && (
                <button className="btn-primary" onClick={() => handlePay(enrollment)} disabled={payingId === enrollment.id}>
                  {payingId === enrollment.id ? "…" : "Payer"}
                </button>
              )}
              {!enrollment.waitlisted && enrollment.payment_status === "paid" && session?.meeting_url && (
                <a href={session.meeting_url} target="_blank" rel="noreferrer">
                  <button className="btn-primary">Rejoindre</button>
                </a>
              )}
              {!enrollment.waitlisted && enrollment.payment_status === "paid" && session?.id && (
                <Link to={`/tableau/${session.id}`}>
                  <button>Tableau</button>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Permet à l'élève de voir et modifier ses spécialités après l'inscription
// (auparavant uniquement possible à la création du compte — voir Register.jsx).
// Seul le Bac Général implique un choix de spécialités (Techno/Pro suivent un
// programme fixe par série/filière — cf. core/models.py côté backend).
function MySpecialtiesSection({ user, onUpdated }) {
  const profile = user.student_profile;
  const [allSubjects, setAllSubjects] = useState([]);
  const [editing, setEditing] = useState(false);
  const [premiere, setPremiere] = useState((profile.premiere_specialties || []).map((s) => s.id));
  const [terminale, setTerminale] = useState((profile.terminale_specialties || []).map((s) => s.id));
  const [mathOption, setMathOption] = useState(profile.terminale_math_option?.id || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editing || allSubjects.length > 0) return;
    api
      .subjects()
      .then((data) => setAllSubjects(data.results || data))
      .catch(() => setError("Impossible de charger la liste des matières."));
  }, [editing, allSubjects.length]);

  if (profile.bac_type !== "general") return null;

  const specialtySubjects = allSubjects.filter(
    (s) => s.subject_type === "specialty" && s.bac_type === "general"
  );
  const mathOptionSubjects = allSubjects.filter(
    (s) => s.subject_type === "math_option" && s.bac_type === "general"
  );
  const mathsSpecialtyId = specialtySubjects.find((s) => s.code === "gen-maths")?.id;
  const keepsMathsSpecialty = terminale.includes(mathsSpecialtyId);

  // Même règle de cohérence que côté backend : Maths Expertes suppose de
  // garder Mathématiques en spécialité, Maths Complémentaires l'inverse —
  // efface le choix s'il devient incohérent après un changement de spécialité.
  useEffect(() => {
    if (!mathOption) return;
    const chosen = mathOptionSubjects.find((s) => s.id === mathOption);
    if (!chosen) return;
    const stillValid = chosen.code === "gen-maths-expertes" ? keepsMathsSpecialty : !keepsMathsSpecialty;
    if (!stillValid) setMathOption(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keepsMathsSpecialty]);

  function toggle(list, setList, max, subjectId) {
    setList((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : prev.length < max
        ? [...prev, subjectId]
        : prev
    );
  }

  function cancelEdit() {
    setPremiere((profile.premiere_specialties || []).map((s) => s.id));
    setTerminale((profile.terminale_specialties || []).map((s) => s.id));
    setMathOption(profile.terminale_math_option?.id || null);
    setError("");
    setEditing(false);
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const updatedUser = await api.updateSpecialties({
        premiere_specialties: premiere,
        terminale_specialties: terminale,
        terminale_math_option: mathOption,
      });
      onUpdated(updatedUser);
      setEditing(false);
    } catch (err) {
      setError(err.message || "Impossible d'enregistrer vos matières.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Mes matières</h2>
        {!editing && (
          <button onClick={() => setEditing(true)}>Modifier</button>
        )}
      </div>

      {error && <p style={{ color: "var(--warning)", fontSize: 13 }}>{error}</p>}

      {!editing ? (
        <>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: "12px 0 4px" }}>
            Spécialités 1ère
          </p>
          {(profile.premiere_specialties || []).length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Aucune renseignée.</p>
          ) : (
            <p style={{ fontSize: 13, margin: 0 }}>
              {profile.premiere_specialties.map((s) => s.name).join(", ")}
            </p>
          )}
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: "12px 0 4px" }}>
            Spécialités conservées en Terminale
          </p>
          {(profile.terminale_specialties || []).length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Aucune renseignée.</p>
          ) : (
            <p style={{ fontSize: 13, margin: 0 }}>
              {profile.terminale_specialties.map((s) => s.name).join(", ")}
            </p>
          )}
          {profile.terminale_math_option && (
            <>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: "12px 0 4px" }}>
                Option mathématiques
              </p>
              <p style={{ fontSize: 13, margin: 0 }}>{profile.terminale_math_option.name}</p>
            </>
          )}
        </>
      ) : (
        <>
          <p style={{ fontSize: 13, fontWeight: 600, margin: "16px 0 4px" }}>
            Spécialités 1ère <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(max {MAX_PREMIERE})</span>
          </p>
          <SpecialtyChips
            subjects={specialtySubjects}
            selected={premiere}
            onToggle={(id) => toggle(premiere, setPremiere, MAX_PREMIERE, id)}
          />

          <p style={{ fontSize: 13, fontWeight: 600, margin: "16px 0 4px" }}>
            Spécialités conservées en Terminale{" "}
            <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(max {MAX_TERMINALE})</span>
          </p>
          <SpecialtyChips
            subjects={specialtySubjects}
            selected={terminale}
            onToggle={(id) => toggle(terminale, setTerminale, MAX_TERMINALE, id)}
          />

          {mathOptionSubjects.length > 0 && (
            <>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "16px 0 4px" }}>
                Option mathématiques en Terminale{" "}
                <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(facultatif)</span>
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {mathOptionSubjects.map((s) => {
                  const eligible = s.code === "gen-maths-expertes" ? keepsMathsSpecialty : !keepsMathsSpecialty;
                  const selected = mathOption === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={!eligible}
                      onClick={() => setMathOption(selected ? null : s.id)}
                      title={
                        !eligible
                          ? s.code === "gen-maths-expertes"
                            ? "Suppose de garder Mathématiques en spécialité de Terminale."
                            : "Réservée aux élèves ayant abandonné Mathématiques en spécialité de Terminale."
                          : undefined
                      }
                      style={{
                        padding: "6px 12px", borderRadius: 999, fontSize: 12,
                        border: selected ? "1px solid var(--ink)" : "1px solid var(--border)",
                        background: selected ? "var(--ink)" : "transparent",
                        color: selected ? "#fff" : eligible ? "var(--ink)" : "var(--text-muted)",
                        cursor: eligible ? "pointer" : "not-allowed",
                        opacity: eligible ? 1 : 0.5,
                      }}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button onClick={cancelEdit} disabled={saving}>
              Annuler
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function StudentGroupContent({ group }) {
  const [expanded, setExpanded] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loaded, setLoaded] = useState(false);

  function toggle() {
    if (!expanded && !loaded) {
      Promise.all([api.groupMaterials(group.id), api.groupAnnouncements(group.id)])
        .then(([materialData, announcementData]) => {
          setMaterials(materialData.results || materialData);
          setAnnouncements(announcementData.results || announcementData);
          setLoaded(true);
        })
        .catch(() => {});
    }
    setExpanded((v) => !v);
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={toggle}>
        <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>
          {group.subject_name} · {TIER_LABELS[group.group_tier] || group.group_tier}
        </p>
        <button>{expanded ? "Fermer" : "Voir"}</button>
      </div>

      {expanded && (
        <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 6px" }}>
            Documents & vidéos
          </p>
          {materials.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 14px" }}>Rien pour l'instant.</p>
          ) : (
            <ul style={{ margin: "0 0 14px", paddingLeft: 18, fontSize: 13 }}>
              {materials.map((m) => (
                <li key={m.id}>
                  <a href={m.content_type === "video_link" ? m.url : m.file} target="_blank" rel="noreferrer">
                    {m.title}
                  </a>
                </li>
              ))}
            </ul>
          )}

          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 6px" }}>
            Messages de l'enseignant
          </p>
          {announcements.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Aucun message pour l'instant.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {announcements.map((a) => (
                <div key={a.id} style={{ background: "var(--surface-1)", borderRadius: "var(--radius-sm)", padding: "8px 10px" }}>
                  <p style={{ fontSize: 13, margin: 0, whiteSpace: "pre-wrap" }}>{a.message}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>
                    {a.author_name} —{" "}
                    {new Date(a.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
