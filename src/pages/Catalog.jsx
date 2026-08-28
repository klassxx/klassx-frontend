import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../api/AuthContext";
import ParisDateTimePicker from "../components/ParisDateTimePicker";
import Skeleton from "../components/Skeleton";
import { parisWallTimeToUtcIso, splitLocalDateTime } from "../utils/parisTime";

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

// Mirrors core/pricing.py: WEEKLY_HOURS_LABELS — every package shows
// both the weekly commitment and the monthly total, since the field
// itself stores the monthly total (see core/models.py: GroupRequest.WeeklyHours).
const WEEKLY_HOURS_LABELS = {
  4: "1h/semaine (4h/mois)",
  6: "1,5h/semaine (6h/mois)",
  8: "2h/semaine (8h/mois)",
  12: "3h/semaine (12h/mois)",
  16: "4h/semaine (16h/mois)",
};
const WEEKLY_HOURS_OPTIONS = Object.keys(WEEKLY_HOURS_LABELS).map(Number);

const STATUS_LABELS = {
  pending: "En attente de groupe",
  scheduled: "Planifié",
  cancelled: "Annulé",
};

// Conserve la sélection en cours (matière/forfait/etc.) le temps d'un
// aller-retour par /inscription ou /connexion quand l'élève n'a pas
// encore de compte — voir handleSubmitGroup/handleSubmitIndividual et
// l'effet de restauration plus bas. sessionStorage plutôt que
// localStorage : ça n'a de sens que pour la session de navigation en
// cours, pas la peine de la faire survivre indéfiniment sur l'appareil.
const PENDING_BOOKING_KEY = "klassx_pending_booking";

/**
 * Two very different booking paths live on this page:
 * - Group tiers (10/5/3): the student requests a subject + level + weekly-
 *   hour package (6/8/12/16/24h). No date/time is picked — an admin later
 *   assembles matching requests into a real, fixed, recurring group and
 *   sets the schedule (see backend README, "How booking works"). Billed
 *   monthly, auto-renewing, changes take effect the following month.
 * - INDIVIDUAL: bypasses all of that. The student picks their own date and
 *   time directly and pays immediately for that one session — no
 *   commitment, no package, no admin step (spec: "l'individuel est la
 *   seule formule où l'élève peut payer par séance... il n'a aucun
 *   engagement").
 */
export default function Catalog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Présent quand on arrive depuis la fiche d'un enseignant
  // ("Réserver un cours avec X" — voir TeacherDetail.jsx). Purement
  // informatif pour l'instant : envoyé avec la demande de groupe pour
  // qu'un admin voie la préférence dans /admin, mais n'assigne rien
  // automatiquement — l'individuel n'a pas encore ce même mécanisme
  // (pas de champ équivalent côté backend, voir IndividualBookingSerializer).
  const preferredTeacherId = searchParams.get("enseignant") || "";
  const preferredTeacherName = searchParams.get("nom") || "";

  const [subjects, setSubjects] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  // Ne présélectionne automatiquement une matière qu'au tout premier
  // chargement (voir l'effet plus bas) — une fois que l'élève a choisi
  // lui-même, on ne le remplace plus jamais silencieusement par une autre
  // matière si la sélection devient invalide (ex: changement de "Niveau").
  const subjectTouchedRef = useRef(false);
  const [level, setLevel] = useState("terminale");
  // Only used to filter the subject list while browsing without an account
  // yet — once logged in, the student's own profile.bac_type takes over.
  const [browsingBacType, setBrowsingBacType] = useState("general");
  const [groupTier, setGroupTier] = useState("GROUP_10");
  const [weeklyHours, setWeeklyHours] = useState(6);
  const [individualDate, setIndividualDate] = useState("");
  const [individualDuration, setIndividualDuration] = useState(60);
  const [promoCode, setPromoCode] = useState("");
  // idle | checking | valid | invalid
  const [promoStatus, setPromoStatus] = useState("idle");
  const [promoPercentage, setPromoPercentage] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");

  async function handleCheckPromoCode() {
    if (!promoCode.trim()) return;
    setPromoStatus("checking");
    try {
      const data = await api.validatePromoCode(promoCode.trim());
      setPromoStatus("valid");
      setPromoPercentage(data.percentage);
      setPromoMessage(`Code valide — -${data.percentage}% appliqué au paiement.`);
    } catch (err) {
      setPromoStatus("invalid");
      setPromoPercentage(0);
      setPromoMessage(err.message || "Ce code promo n'est pas valide.");
    }
  }
  const { day: individualDatePart, hour: individualHour, minute: individualMinute } = splitLocalDateTime(individualDate);

  const [myRequests, setMyRequests] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [needsPaymentMethod, setNeedsPaymentMethod] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [loading, setLoading] = useState(true);

  const isIndividual = groupTier === "INDIVIDUAL";

  function savePendingBooking() {
    try {
      const pending = isIndividual
        ? { type: "individual", subjectId, level, individualDate, individualDuration }
        : { type: "group", subjectId, level, groupTier, weeklyHours };
      sessionStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(pending));
    } catch {
      // sessionStorage indisponible (navigation privée stricte, etc.) —
      // tant pis, l'élève devra juste re-choisir après son inscription.
    }
  }

  // Au retour d'un aller-retour /inscription ou /connexion (voir
  // savePendingBooking ci-dessus), restaure la sélection dès qu'un
  // compte est disponible, plutôt que de laisser l'élève tout re-choisir.
  useEffect(() => {
    if (!user) return;
    let raw;
    try {
      raw = sessionStorage.getItem(PENDING_BOOKING_KEY);
    } catch {
      return;
    }
    if (!raw) return;
    sessionStorage.removeItem(PENDING_BOOKING_KEY);
    try {
      const pending = JSON.parse(raw);
      if (pending.subjectId) {
        subjectTouchedRef.current = true;
        setSubjectId(pending.subjectId);
      }
      if (pending.level) setLevel(pending.level);
      if (pending.type === "individual") {
        setGroupTier("INDIVIDUAL");
        if (pending.individualDate) setIndividualDate(pending.individualDate);
        if (pending.individualDuration) setIndividualDuration(pending.individualDuration);
      } else {
        if (pending.groupTier) setGroupTier(pending.groupTier);
        if (pending.weeklyHours) setWeeklyHours(pending.weeklyHours);
      }
      setMessage("Votre sélection a été conservée — vérifiez et confirmez ci-dessous.");
    } catch {
      // JSON malformé — on ignore simplement, rien de grave.
    }
  }, [user]);

  useEffect(() => {
    api
      .subjects()
      .then((data) => setSubjects(data.results || data))
      .catch(() => {});
    api
      .publicPricing()
      .then(setPricing)
      .catch(() => {});
  }, []);

  const ratesByTier = Object.fromEntries(pricing.map((p) => [p.group_tier, p.price_per_hour_eur]));
  // Les élèves tunisiens voient les prix en dinars ; le paiement en ligne
  // n'est pas disponible pour ce pays (pas d'intermédiaire de paiement
  // tunisien fiable pour l'instant) — voir IndividualBookingView /
  // EnrollmentViewSet.create_checkout_session / SeriesMembershipViewSet
  // .checkout côté backend, qui renvoient une invitation à nous contacter
  // par e-mail plutôt qu'une URL de paiement pour ces élèves.
  const isTunisia = user?.country === "Tunisie";
  const ratesByTierTnd = Object.fromEntries(pricing.map((p) => [p.group_tier, p.price_per_hour_tnd]));

  const profile = user?.student_profile;
  const chosenSpecialtyIds = (
    level === "1ere" ? profile?.premiere_specialties : profile?.terminale_specialties
  )?.map((s) => s.id) || [];
  const chosenMathOptionId = profile?.terminale_math_option?.id;

  // Mirrors the backend's validate_specialty_access: a subject must match
  // the student's Bac track, and — only for Bac Général — a specialty
  // subject additionally has to be one they actually picked. A
  // math_option subject (Maths Expertes / Maths Complémentaires — not a
  // 3rd specialty, see backend Subject.SubjectType.MATH_OPTION) instead
  // has to match the student's chosen terminale_math_option specifically.
  // Technologique/Professionnel students see every subject of their track
  // with no gate at all (they don't "pick" specialties the same way).
  // Without an account yet, we don't know the student's specialties, so
  // we fall back to the same no-gate behavior as Techno/Pro — just
  // filtered by the bac type they're browsing as (browsingBacType).
  const effectiveBacType = profile?.bac_type || browsingBacType;
  const availableSubjects = subjects.filter((s) => {
    if (s.level !== "both" && s.level !== level) return false;
    if (s.bac_type !== effectiveBacType) return false;
    if (!user || effectiveBacType !== "general") return true;
    if (s.subject_type === "common_core") return true;
    if (s.subject_type === "math_option") return s.id === chosenMathOptionId;
    return chosenSpecialtyIds.includes(s.id);
  });

  useEffect(() => {
    if (availableSubjects.some((s) => s.id === subjectId)) return; // toujours valide, rien à faire
    if (!subjectTouchedRef.current && availableSubjects.length) {
      // Tout premier chargement (l'élève n'a encore rien choisi) —
      // présélectionne la première matière disponible, comme avant.
      setSubjectId(availableSubjects[0].id);
    } else if (subjectId) {
      // L'élève avait choisi une matière, mais elle n'est plus valide pour
      // le niveau/la filière actuels (ex: changement de "Niveau" après
      // coup) — on vide la sélection plutôt que de la remplacer
      // silencieusement par une autre matière au hasard. Le bouton
      // "Demander une place" reste désactivé tant que rien n'est
      // explicitement re-choisi (voir disabled={... || !subjectId}).
      setSubjectId("");
    }
  }, [availableSubjects, subjectId]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    api
      .myGroupRequests()
      .then((data) => setMyRequests(data.results || data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cardParam = params.get("card");
    if (cardParam === "success") {
      setMessage("Votre carte a bien été enregistrée. Vous serez débité(e) dès que votre enseignant programmera votre première séance.");
    } else if (cardParam === "cancelled") {
      setError("L'ajout de la carte a été annulé — vous pouvez réessayer à tout moment depuis votre demande.");
    }
    if (cardParam) {
      params.delete("card");
      const newSearch = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (newSearch ? `?${newSearch}` : ""));
    }
  }, []);

  async function handleSubmitGroup(e) {
    e.preventDefault();
    if (!user) {
      savePendingBooking();
      setNeedsAuth(true);
      return;
    }
    setNeedsAuth(false);
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const created = await api.createGroupRequest({
        subject: subjectId,
        level,
        group_tier: groupTier,
        weekly_hours: weeklyHours,
        ...(preferredTeacherId ? { preferred_teacher: preferredTeacherId } : {}),
      });
      setMyRequests((prev) => [created, ...prev]);
      if (user.student_profile?.has_payment_method) {
        setMessage(
          "Votre demande a été enregistrée ! Dès qu'assez d'élèves demandent la même matière, le même niveau, la même formule et le même forfait, nous formons le groupe et vous recevez l'horaire par email."
        );
      } else {
        setNeedsPaymentMethod(true);
      }
    } catch (err) {
      setError(err.message || "La demande a échoué.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddPaymentMethod() {
    setAddingCard(true);
    setError("");
    try {
      const { checkout_url } = await api.setupPaymentMethod();
      window.location.href = checkout_url;
    } catch (err) {
      setError(err.message || "Impossible d'ouvrir le formulaire de paiement pour le moment.");
      setAddingCard(false);
    }
  }

  async function handleSubmitIndividual(e) {
    e.preventDefault();
    if (!user) {
      savePendingBooking();
      setNeedsAuth(true);
      return;
    }
    setNeedsAuth(false);
    if (!individualDate) {
      setError("Choisissez une date et une heure.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const startIso = parisWallTimeToUtcIso(individualDatePart, individualHour, individualMinute);
      const end = new Date(new Date(startIso).getTime() + individualDuration * 60000);
      const data = await api.createIndividualBooking({
        subject: subjectId,
        level,
        start_time: startIso,
        end_time: end.toISOString(),
        ...(preferredTeacherId ? { preferred_teacher: preferredTeacherId } : {}),
        ...(promoStatus === "valid" ? { promo_code: promoCode.trim() } : {}),
      });
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setMessage(data.detail || "Réservation enregistrée — contactez-nous pour connaître les modalités de paiement.");
        setSubmitting(false);
      }
    } catch (err) {
      setError(err.message || "La réservation a échoué.");
      setSubmitting(false);
    }
  }

  async function handleCancel(id) {
    try {
      const updated = await api.cancelGroupRequest(id);
      setMyRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      setError(err.message || "Impossible d'annuler cette demande.");
    }
  }

  const individualPrice = isIndividual && ratesByTier.INDIVIDUAL != null
    ? ((individualDuration / 60) * ratesByTier.INDIVIDUAL).toFixed(2)
    : null;
  const individualPriceTnd = isIndividual && ratesByTierTnd.INDIVIDUAL != null
    ? ((individualDuration / 60) * ratesByTierTnd.INDIVIDUAL).toFixed(2)
    : null;

  return (
    <div className="container">
      <h1 style={{ fontSize: 26, fontWeight: 600, margin: "0 0 4px" }}>Rejoindre un cours</h1>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px" }}>
        L'individuel se réserve directement, à la date et l'heure de votre choix, sans engagement. Les groupes
        (10/5/3) fonctionnent par forfait mensuel : nous formons le groupe et fixons l'horaire dès que suffisamment
        d'élèves sont réunis, pour garantir un groupe stable avec le même enseignant.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 10,
          marginBottom: 28,
        }}
      >
        {pricing.map((p) => (
          <div
            key={p.group_tier}
            style={{
              border: p.group_tier === groupTier ? "2px solid var(--ink)" : "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "12px 14px",
              textAlign: "center",
              background: "var(--surface-1)",
              cursor: "pointer",
            }}
            onClick={() => setGroupTier(p.group_tier)}
          >
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 4px" }}>{TIER_LABELS[p.group_tier]}</p>
            <p style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
              {isTunisia ? (
                <>
                  {p.price_per_hour_tnd} DT<span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>/h</span>
                </>
              ) : (
                <>
                  {p.price_per_hour_eur}€<span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>/h</span>
                </>
              )}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={isIndividual ? handleSubmitIndividual : handleSubmitGroup} className="card" style={{ marginBottom: 28, maxWidth: 480 }}>
        <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px" }}>
          {isIndividual ? "Réserver une séance individuelle" : "Demander une place en groupe"}
        </p>

        {preferredTeacherId && (
          <p
            style={{
              fontSize: 13,
              color: "var(--accent-text)",
              background: "var(--accent-bg)",
              borderRadius: 8,
              padding: "8px 12px",
              margin: "0 0 16px",
            }}
          >
            ✓ Votre préférence pour <strong>{preferredTeacherName || "cet enseignant"}</strong> sera transmise avec votre {isIndividual ? "réservation" : "demande"}.
          </p>
        )}

        {!user && (
          <>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
              Filière
            </label>
            <select value={browsingBacType} onChange={(e) => setBrowsingBacType(e.target.value)} style={{ marginBottom: 14 }}>
              <option value="general">Bac Général</option>
              <option value="techno">Bac Technologique</option>
              <option value="pro">Bac Professionnel</option>
              <option value="fle">FLE — Français Langue Étrangère</option>
              <option value="fls">FLS — Français Langue Seconde</option>
            </select>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "-8px 0 14px" }}>
              Créez un compte pour affiner selon vos spécialités précises.
            </p>
          </>
        )}

        <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
          Matière
        </label>
        {availableSubjects.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--warning)", margin: "0 0 14px" }}>
            {user && effectiveBacType === "general"
              ? "Aucune matière disponible pour vos spécialités actuelles — renseignez-les depuis votre tableau de bord pour voir vos matières."
              : "Cette combinaison filière/niveau n'est pas encore couverte par nos cours en ligne — écris-nous et on s'organise pour toi."}
          </p>
        ) : (
          <select
            value={subjectId}
            onChange={(e) => {
              subjectTouchedRef.current = true;
              // Number(...) — value sortant du <select> est toujours une
              // chaîne de caractères (HTML), alors que s.id (venant de
              // l'API) est un nombre. Comparer les deux avec === plus bas
              // (l'effet qui valide subjectId) échouerait sinon en
              // permanence et effacerait la sélection à chaque choix.
              setSubjectId(Number(e.target.value));
            }}
            style={{ marginBottom: 14 }}
          >
            <option value="" disabled>
              Choisir une matière
            </option>
            {availableSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        {effectiveBacType !== "fle" && effectiveBacType !== "fls" && (
          <>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
              Niveau
            </label>
            <select value={level} onChange={(e) => setLevel(e.target.value)} style={{ marginBottom: 20 }}>
              <option value="1ere">1ère</option>
              <option value="terminale">Terminale</option>
            </select>
          </>
        )}

        {isIndividual ? (
          <>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
              Date et heure{" "}
              <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(heure de Paris)</span>
            </label>
            <div style={{ marginBottom: 14 }}>
              <ParisDateTimePicker value={individualDate} onChange={setIndividualDate} required />
            </div>

            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
              Durée (minutes)
            </label>
            <input
              type="number"
              min={15}
              step={15}
              value={individualDuration}
              onChange={(e) => setIndividualDuration(Number(e.target.value))}
              style={{ marginBottom: 20 }}
            />

            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
              Code promo (facultatif)
            </label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value);
                  setPromoStatus("idle");
                }}
                placeholder="Ex: RENTREE2026"
                style={{ flexGrow: 1 }}
              />
              <button type="button" onClick={handleCheckPromoCode} disabled={promoStatus === "checking" || !promoCode.trim()}>
                Valider
              </button>
            </div>
            {promoMessage && (
              <p
                style={{
                  fontSize: 12,
                  margin: "0 0 14px",
                  color: promoStatus === "valid" ? "var(--accent-text)" : "var(--warning)",
                }}
              >
                {promoMessage}
              </p>
            )}

            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px" }}>
              Prix de cette séance :{" "}
              <strong>
                {promoStatus === "valid"
                  ? isTunisia
                    ? `${(individualPriceTnd * (1 - promoPercentage / 100)).toFixed(2)} DT`
                    : `${(individualPrice * (1 - promoPercentage / 100)).toFixed(2)} €`
                  : isTunisia
                  ? `${individualPriceTnd} DT`
                  : `${individualPrice} €`}
              </strong>{" "}
              — paiement immédiat, sans engagement.
            </p>
          </>
        ) : (
          <>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
              Forfait hebdomadaire
            </label>
            <select value={weeklyHours} onChange={(e) => setWeeklyHours(Number(e.target.value))} style={{ marginBottom: 12 }}>
              {WEEKLY_HOURS_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {WEEKLY_HOURS_LABELS[h]}
                </option>
              ))}
            </select>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 20px" }}>
              {isTunisia ? (
                <>
                  Formule : <strong>{TIER_LABELS[groupTier]}</strong> ({ratesByTierTnd[groupTier]} DT/h) — soit
                  environ <strong>{(weeklyHours * (ratesByTierTnd[groupTier] || 0)).toFixed(2)} DT/mois</strong>.
                  Paiement mensuel via Konnect — contrairement à la carte bancaire internationale, il n'y a pas de
                  prélèvement automatique : il faudra relancer le paiement chaque mois depuis votre tableau de bord.
                </>
              ) : (
                <>
                  Formule : <strong>{TIER_LABELS[groupTier]}</strong> ({ratesByTier[groupTier]}€/h) — soit environ{" "}
                  <strong>{(weeklyHours * (ratesByTier[groupTier] || 0)).toFixed(2)} €/mois</strong>. Facturation
                  mensuelle, reconduite automatiquement ; un changement ou une annulation prend effet le mois
                  suivant.
                </>
              )}
            </p>
          </>
        )}

        {error && (
          <p style={{ background: "var(--warning-bg)", color: "var(--warning)", padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: 13, marginBottom: 16 }}>
            {error}
          </p>
        )}
        {message && (
          <p style={{ background: "var(--accent-bg)", color: "var(--accent-text)", padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: 13, marginBottom: 16 }}>
            {message}
          </p>
        )}
        {needsPaymentMethod && (
          <div className="card" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>Votre demande a été enregistrée !</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 12px" }}>
              Pour confirmer votre place, ajoutez une carte bancaire dès maintenant.{" "}
              <strong>Vous ne serez débité(e) qu'au moment où votre enseignant programmera votre première séance</strong>{" "}
              — aucun montant n'est prélevé aujourd'hui.
            </p>
            <button type="button" className="btn-primary" onClick={handleAddPaymentMethod} disabled={addingCard}>
              {addingCard ? "Redirection…" : "Ajouter ma carte"}
            </button>
          </div>
        )}

        {needsAuth && (
          <div className="card" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>Créez un compte pour valider votre choix</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 12px" }}>
              Votre matière et votre forfait sont bien sélectionnés — il vous manque juste un compte élève pour
              confirmer {isIndividual ? "votre réservation" : "votre demande"}. Ça prend une minute.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate("/inscription?next=/catalogue")}
              >
                Créer un compte
              </button>
              <button type="button" onClick={() => navigate("/connexion?next=/catalogue")}>
                J'ai déjà un compte
              </button>
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={submitting || !subjectId}>
          {submitting ? "Envoi…" : isIndividual ? "Réserver et payer" : "Demander une place"}
        </button>
      </form>

      {user && !isIndividual && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>Mes demandes</h2>
          {loading && <Skeleton variant="rows" count={3} />}
          {!loading && myRequests.length === 0 && (
            <p style={{ color: "var(--text-muted)" }}>Aucune demande pour le moment.</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {myRequests.map((r) => (
              <div key={r.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>
                    {r.subject_name} · {r.level === "terminale" ? "Terminale" : "1ère"} · {TIER_LABELS[r.group_tier]}
                    {r.weekly_hours_display ? ` · ${r.weekly_hours_display}` : ""}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
                    {STATUS_LABELS[r.status]}
                    {r.status === "scheduled" && " — voir les détails dans votre tableau de bord"}
                  </p>
                </div>
                {r.status === "pending" && (
                  <button onClick={() => handleCancel(r.id)}>Annuler</button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
