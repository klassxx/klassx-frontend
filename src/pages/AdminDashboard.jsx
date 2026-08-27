import { useEffect, useState } from "react";
import { api } from "../api/client";
import {
  IconGauge, IconUsers, IconCalendar, IconCoin, IconGroup, IconCheckShield, IconGift, IconInbox,
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

const TIER_CAPACITY = {
  GROUP_10: 10,
  GROUP_8: 8,
  GROUP_5: 5,
  GROUP_3: 3,
  INDIVIDUAL: 1,
};

// Mirrors core/pricing.py: WEEKLY_HOURS_LABELS
const WEEKLY_HOURS_LABELS = {
  4: "1h/semaine (4h/mois)",
  6: "1,5h/semaine (6h/mois)",
  8: "2h/semaine (8h/mois)",
  12: "3h/semaine (12h/mois)",
  16: "4h/semaine (16h/mois)",
};

// "2026-08" — mois courant, format attendu par l'API et par <input type="month">.
function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [groupSummary, setGroupSummary] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [assigning, setAssigning] = useState({});
  const [error, setError] = useState("");
  const [hoursMonth, setHoursMonth] = useState(currentMonthValue());
  const [teacherHours, setTeacherHours] = useState(null);
  const [hoursError, setHoursError] = useState("");
  const [referrals, setReferrals] = useState(null);
  const [referralsError, setReferralsError] = useState("");
  const [markingPaidId, setMarkingPaidId] = useState(null);

  function loadAll() {
    api.adminStats().then(setStats).catch(() => {});
    api
      .unassignedSessions()
      .then((data) => setSessions((data.results || data).filter((s) => !s.assigned_teacher)))
      .catch(() => setError("Impossible de charger les sessions."));
    api.allTeachers().then((data) => setTeachers(data.results || data)).catch(() => {});
    api.pendingTeachers().then((data) => setPendingTeachers(data.results || data)).catch(() => {});
    api.pendingGroupSummary().then(setGroupSummary).catch(() => {});
    api.pendingGroupRequests().then((data) => setPendingRequests(data.results || data)).catch(() => {});
    api
      .adminReferrals()
      .then((data) => setReferrals(data.referrers))
      .catch((err) => setReferralsError(err.message || "Impossible de charger le parrainage."));
  }

  useEffect(loadAll, []);

  useEffect(() => {
    setHoursError("");
    api
      .teacherHours(hoursMonth)
      .then(setTeacherHours)
      .catch((err) => setHoursError(err.message || "Impossible de charger les heures des enseignants."));
  }, [hoursMonth]);

  async function handleMarkReferralPaid(referrerId, currency) {
    const key = `${referrerId}:${currency}`;
    setMarkingPaidId(key);
    try {
      await api.markReferralPaid(referrerId, currency);
      const data = await api.adminReferrals();
      setReferrals(data.referrers);
    } catch (err) {
      setReferralsError(err.message || "Impossible de marquer comme payé.");
    } finally {
      setMarkingPaidId(null);
    }
  }

  async function handleAssign(sessionId, teacherId) {
    if (!teacherId) return;
    setAssigning((a) => ({ ...a, [sessionId]: true }));
    try {
      await api.assignTeacher(sessionId, teacherId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      setError(err.message || "L'affectation a échoué.");
    } finally {
      setAssigning((a) => ({ ...a, [sessionId]: false }));
    }
  }

  async function handleApprove(teacherId) {
    await api.approveTeacher(teacherId);
    loadAll();
  }

  async function handleReject(teacherId) {
    await api.rejectTeacher(teacherId);
    loadAll();
  }

  return (
    <div className="container">
      <div className="page-header">
        <div className="page-header__icon">
          <IconGauge />
        </div>
        <div>
          <h1>Tableau de bord admin</h1>
          <p>Vue d'ensemble de la plateforme</p>
        </div>
      </div>

      {error && <p style={{ color: "var(--warning)" }}>{error}</p>}

      <div className="stat-grid">
        <StatCard icon={<IconUsers />} label="Élèves actifs" value={stats?.active_students ?? "…"} />
        <StatCard icon={<IconCalendar />} label="Sessions cette semaine" value={stats?.sessions_this_week ?? "…"} />
        <StatCard
          icon={<IconGroup />}
          label="Groupes à affecter"
          value={groupSummary.length}
          warning={groupSummary.length > 0}
        />
        <StatCard
          icon={<IconCoin />}
          label="Revenu du mois"
          value={
            stats
              ? Object.entries(stats.revenue_this_month).length === 0
                ? "0 €"
                : Object.entries(stats.revenue_this_month)
                    .map(([currency, amount]) => `${amount} ${currency === "TND" ? "DT" : "€"}`)
                    .join(" + ")
              : "…"
          }
        />
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-header__icon">
            <IconGroup />
          </div>
          <div>
            <h2>Groupes en attente d'affectation</h2>
            <p>
              Élèves ayant demandé la même matière, le même niveau, la même formule et le même forfait — regroupez-les
              et confiez le groupe à un enseignant. C'est ensuite à l'enseignant de choisir le jour, l'horaire et le
              lien de visioconférence depuis son tableau de bord.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {groupSummary.length === 0 && (
            <div className="empty-state">
              <IconInbox />
              Aucune demande en attente actuellement.
            </div>
          )}
          {groupSummary.map((group) => (
            <GroupSummaryRow
              key={`${group.subject_id}-${group.level}-${group.group_tier}-${group.weekly_hours}`}
              group={group}
              requests={pendingRequests.filter(
                (r) =>
                  r.subject === group.subject_id &&
                  r.level === group.level &&
                  r.group_tier === group.group_tier &&
                  r.weekly_hours === group.weekly_hours
              )}
              teachers={teachers}
              onScheduled={loadAll}
              onError={setError}
            />
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-header__icon">
            <IconCalendar />
          </div>
          <div>
            <h2>Sessions à affecter à un enseignant</h2>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sessions.length === 0 && (
            <div className="empty-state">
              <IconInbox />
              Aucune session en attente d'affectation.
            </div>
          )}
          {sessions.map((session) => (
            <div key={session.id} className="card card-row">
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>
                  {session.subject_name} · {TIER_LABELS[session.group_tier] || session.group_tier}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
                  {new Date(session.start_time).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                  {" · "}
                  {session.seats_taken} élève{session.seats_taken > 1 ? "s" : ""} inscrit{session.seats_taken > 1 ? "s" : ""}
                </p>
              </div>
              <select
                defaultValue=""
                disabled={assigning[session.id]}
                onChange={(e) => handleAssign(session.id, e.target.value)}
                style={{ width: "auto" }}
              >
                <option value="" disabled>
                  Assigner un enseignant
                </option>
                {teachers
                  .filter((t) => t.is_active && t.subjects.includes(session.subject_name))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-header" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <div className="section-header__icon">
              <IconCoin />
            </div>
            <div>
              <h2>Heures enseignants (rémunération)</h2>
              <p>
                Calculées à partir des sessions passées, affectées à un enseignant et non annulées.
                {teacherHours && <> Semaine en cours : {teacherHours.week_start} au {teacherHours.week_end}.</>}
              </p>
            </div>
          </div>
          <input type="month" value={hoursMonth} onChange={(e) => setHoursMonth(e.target.value)} style={{ width: "auto" }} />
        </div>
        {hoursError && <p style={{ color: "var(--warning)" }}>{hoursError}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {teacherHours && teacherHours.teachers.length === 0 && (
            <div className="empty-state">
              <IconInbox />
              Aucun enseignant actif avec des sessions passées.
            </div>
          )}
          {teacherHours &&
            teacherHours.teachers.map((t) => (
              <div key={t.teacher_id} className="card card-row">
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{t.teacher_name}</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>{t.teacher_email}</p>
                </div>
                <div style={{ display: "flex", gap: 24, textAlign: "right" }}>
                  <div>
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>Cette semaine</p>
                    <p style={{ fontSize: 15, fontWeight: 500, margin: "2px 0 0", fontFamily: "var(--font-mono)" }}>
                      {t.hours_this_week} h
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>
                      Ce mois ({t.sessions_this_month} séance{t.sessions_this_month > 1 ? "s" : ""})
                    </p>
                    <p style={{ fontSize: 15, fontWeight: 600, margin: "2px 0 0", fontFamily: "var(--font-mono)" }}>
                      {t.hours_this_month} h
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-header__icon">
            <IconGift />
          </div>
          <div>
            <h2>Programme de parrainage (10%)</h2>
            <p>
              Un parrain (élève, enseignant, ou affilié) touche 10% de chaque paiement des personnes qu'il a
              parrainées, tant qu'elles restent actives.
            </p>
          </div>
        </div>
        {referralsError && <p style={{ color: "var(--warning)" }}>{referralsError}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {referrals && referrals.length === 0 && (
            <div className="empty-state">
              <IconInbox />
              Aucune commission de parrainage pour l'instant.
            </div>
          )}
          {referrals &&
            referrals.map((r) => (
              <div key={`${r.referrer_id}:${r.currency}`} className="card card-row">
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>
                    {r.referrer_name} <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>({r.referrer_role})</span>
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
                    {r.referrer_email} · code {r.referral_code} · {r.referred_students_count} filleul
                    {r.referred_students_count > 1 ? "s" : ""} · commissions en{" "}
                    <strong>{r.currency === "TND" ? "dinars tunisiens" : "euros"}</strong>
                  </p>
                </div>
                <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>Total gagné</p>
                    <p style={{ fontSize: 15, fontWeight: 500, margin: "2px 0 0", fontFamily: "var(--font-mono)" }}>
                      {r.total_earned} {r.currency === "TND" ? "DT" : "€"}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>Encore dû</p>
                    <p style={{ fontSize: 15, fontWeight: 600, margin: "2px 0 0", fontFamily: "var(--font-mono)" }}>
                      {r.total_unpaid} {r.currency === "TND" ? "DT" : "€"}
                    </p>
                  </div>
                  {Number(r.total_unpaid) > 0 && (
                    <button
                      onClick={() => handleMarkReferralPaid(r.referrer_id, r.currency)}
                      disabled={markingPaidId === `${r.referrer_id}:${r.currency}`}
                    >
                      {markingPaidId === `${r.referrer_id}:${r.currency}` ? "…" : "Marquer payé"}
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="section" style={{ marginBottom: 0 }}>
        <div className="section-header">
          <div className="section-header__icon">
            <IconCheckShield />
          </div>
          <div>
            <h2>Enseignants en attente de validation</h2>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pendingTeachers.length === 0 && (
            <div className="empty-state">
              <IconInbox />
              Aucune candidature en attente.
            </div>
          )}
          {pendingTeachers.map((t) => (
            <div key={t.id} className="card card-row">
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{t.full_name}</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
                  {t.subjects.join(", ") || "Matières non renseignées"}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleReject(t.id)}>Refuser</button>
                <button className="btn-primary" onClick={() => handleApprove(t.id)}>
                  Valider
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GroupSummaryRow({ group, requests, teachers, onScheduled, onError }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [teacherId, setTeacherId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const capacity = TIER_CAPACITY[group.group_tier] || 1;

  function toggleExpand() {
    if (!expanded) setSelectedIds(requests.slice(0, capacity).map((r) => r.id));
    setExpanded((v) => !v);
  }

  function toggleStudent(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < capacity ? [...prev, id] : prev
    );
  }

  async function handleAssign(e) {
    e.preventDefault();
    if (!teacherId || selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      await api.assignGroupToTeacher({ request_ids: selectedIds, teacher_id: teacherId });
      onScheduled();
    } catch (err) {
      onError(err.message || "L'affectation a échoué.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <div className="card-row" style={{ cursor: "pointer" }} onClick={toggleExpand}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, margin: 0, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {group.subject__name} · {group.level === "terminale" ? "Terminale" : "1ère"}
            <span className="badge badge-accent">{TIER_LABELS[group.group_tier]}</span>
            {group.weekly_hours && (
              <span className="badge badge-muted">
                {WEEKLY_HOURS_LABELS[group.weekly_hours] || `${group.weekly_hours}h/mois`}
              </span>
            )}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "6px 0 0" }}>
            {group.count} élève{group.count > 1 ? "s" : ""} en attente (capacité : {capacity})
          </p>
        </div>
        <button>{expanded ? "Fermer" : "Affecter un enseignant"}</button>
      </div>

      {expanded && (
        <form onSubmit={handleAssign} style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px" }}>
            Élèves à inclure ({selectedIds.length}/{capacity}) :
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
            {requests.map((r) => (
              <label key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(r.id)}
                  onChange={() => toggleStudent(r.id)}
                  style={{ width: "auto", height: "auto" }}
                />
                Élève #{r.student}
              </label>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
              Enseignant
            </label>
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required>
              <option value="" disabled>
                Choisir un enseignant
              </option>
              {teachers
                .filter((t) => t.is_active && t.subjects.includes(group.subject__name))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name}
                  </option>
                ))}
            </select>
          </div>

          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 12px" }}>
            L'enseignant choisira lui-même le jour, l'horaire et le lien de visioconférence depuis son tableau de
            bord une fois le groupe confié.
          </p>

          <button type="submit" className="btn-primary" disabled={submitting || selectedIds.length === 0}>
            {submitting ? "Affectation…" : `Confier ce groupe (${selectedIds.length} élève${selectedIds.length > 1 ? "s" : ""})`}
          </button>
        </form>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, warning }) {
  return (
    <div className={`stat-card${warning ? " stat-card--warning" : ""}`}>
      <div className="stat-card__icon">{icon}</div>
      <div>
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
      </div>
    </div>
  );
}
