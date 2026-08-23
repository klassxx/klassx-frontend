import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../api/AuthContext";
import { api } from "../api/client";
import AuthLayout from "../components/AuthLayout";
import SpecialtyChips from "../components/SpecialtyChips";
import { COUNTRIES } from "../data/countries";

const MAX_PREMIERE = 3;
const MAX_TERMINALE = 2;

const BAC_TYPES = [
  { value: "general", label: "Général" },
  { value: "techno", label: "Technologique" },
  { value: "pro", label: "Professionnel" },
  { value: "fle", label: "FLE — Français Langue Étrangère" },
  { value: "fls", label: "FLS — Français Langue Seconde" },
];
const CECRL_LEVELS = [
  { value: "A1", label: "A1 — Découverte" },
  { value: "A2", label: "A2 — Survie" },
  { value: "B1", label: "B1 — Seuil" },
  { value: "B2", label: "B2 — Avancé" },
  { value: "C1", label: "C1 — Autonome" },
  { value: "C2", label: "C2 — Maîtrise" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Programme de parrainage : ?ref=CODE dans le lien partagé par un
  // parrain (élève, enseignant, ou affilié). Un code absent/invalide
  // n'empêche jamais l'inscription — le backend l'ignore silencieusement.
  const referralCode = searchParams.get("ref") || "";
  const [accountType, setAccountType] = useState("student"); // "student" | "teacher" | "affiliate"
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    bac_type: "general",
    grade_level: "1ere",
    cecrl_level: "",
    bio: "",
    date_of_birth: "",
    parent_full_name: "",
  });
  const [allSubjects, setAllSubjects] = useState([]);
  const [premiereSpecialties, setPremiereSpecialties] = useState([]);
  const [terminaleSpecialties, setTerminaleSpecialties] = useState([]);
  const [terminaleMathOption, setTerminaleMathOption] = useState(null);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .subjects()
      .then((data) => setAllSubjects(data.results || data))
      .catch(() => {});
  }, []);

  // Specialty picking only applies to Bac Général — Technologique/
  // Professionnel students follow a fixed curriculum for their série/
  // filière instead (see backend core/models.py: StudentProfile.bac_type).
  const specialtySubjects = allSubjects.filter(
    (s) => s.subject_type === "specialty" && s.bac_type === form.bac_type
  );
  // FLE/FLS : ni Première/Terminale ni spécialités, un niveau CECRL à la
  // place (voir backend BacType.FLE/FLS et StudentProfile.cecrl_level).
  const isFleFls = form.bac_type === "fle" || form.bac_type === "fls";
  // Maths Expertes / Maths Complémentaires — Terminale uniquement, pas une
  // 3e spécialité (voir backend Subject.SubjectType.MATH_OPTION). Expertes
  // n'a de sens que si Mathématiques fait partie des spécialités gardées
  // en Terminale ; Complémentaires, l'inverse.
  const mathOptionSubjects = allSubjects.filter(
    (s) => s.subject_type === "math_option" && s.bac_type === form.bac_type
  );
  const mathsSpecialtyId = specialtySubjects.find((s) => s.code === "gen-maths")?.id;
  const keepsMathsSpecialty = terminaleSpecialties.includes(mathsSpecialtyId);

  // Efface automatiquement le choix d'option maths s'il devient
  // incohérent (ex: l'élève retire Mathématiques de ses spécialités
  // Terminale alors que "Expertes" était sélectionné) — miroir de la
  // règle backend (_validate_math_option_consistency).
  useEffect(() => {
    if (!terminaleMathOption) return;
    const chosen = mathOptionSubjects.find((s) => s.id === terminaleMathOption);
    if (!chosen) return;
    const stillValid =
      chosen.code === "gen-maths-expertes" ? keepsMathsSpecialty : !keepsMathsSpecialty;
    if (!stillValid) setTerminaleMathOption(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keepsMathsSpecialty]);

  // Miroir du calcul backend (StudentRegistrationSerializer.validate) —
  // affiche les champs parent dès que la date de naissance indique un
  // mineur, sans attendre l'aller-retour serveur.
  const isMinor = (() => {
    if (!form.date_of_birth) return false;
    const dob = new Date(form.date_of_birth);
    if (Number.isNaN(dob.getTime())) return false;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const hadBirthdayThisYear =
      today.getMonth() > dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
    if (!hadBirthdayThisYear) age -= 1;
    return age < 18;
  })();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleSpecialty(list, setList, max, subjectId) {
    setList((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : prev.length < max
        ? [...prev, subjectId]
        : prev
    );
  }

  function toggleTeacherSubject(subjectId) {
    setTeacherSubjects((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setSubmitting(true);
    try {
      // The backend's USERNAME_FIELD is `username`; we reuse the email as
      // the username to keep the form simple.
      const basePayload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        country: form.country,
        username: form.email,
        referral_code: referralCode,
      };
      const payload =
        accountType === "teacher"
          ? { ...basePayload, bio: form.bio, subjects: teacherSubjects }
          : accountType === "affiliate"
          ? basePayload
          : {
              ...basePayload,
              bac_type: form.bac_type,
              grade_level: isFleFls ? undefined : form.grade_level,
              cecrl_level: isFleFls ? form.cecrl_level : "",
              premiere_specialties: form.bac_type === "general" ? premiereSpecialties : [],
              terminale_specialties: form.bac_type === "general" ? terminaleSpecialties : [],
              terminale_math_option: form.bac_type === "general" ? terminaleMathOption : null,
              date_of_birth: form.date_of_birth,
              ...(isMinor ? { parent_full_name: form.parent_full_name } : {}),
            };
      await register(payload, accountType);
      navigate(
        accountType === "teacher" ? "/enseignant" : accountType === "affiliate" ? "/parrainage" : "/tableau-de-bord"
      );
    } catch (err) {
      setError(err.message || "Impossible de créer le compte.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Créer un compte" subtitle="Rejoignez KLASSX pour préparer votre bac.">
      <form onSubmit={handleSubmit}>
        {error && (
          <p
            style={{
              background: "var(--warning-bg)",
              color: "var(--warning)",
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              fontSize: 13,
              marginBottom: 18,
            }}
          >
            {error}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => setAccountType("student")}
            className={accountType === "student" ? "btn-primary" : ""}
            style={{ flex: 1 }}
          >
            Élève
          </button>
          <button
            type="button"
            onClick={() => setAccountType("teacher")}
            className={accountType === "teacher" ? "btn-primary" : ""}
            style={{ flex: 1 }}
          >
            Enseignant
          </button>
          <button
            type="button"
            onClick={() => setAccountType("affiliate")}
            className={accountType === "affiliate" ? "btn-primary" : ""}
            style={{ flex: 1 }}
          >
            Affilié
          </button>
        </div>

        {referralCode && (
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 14px" }}>
            Vous vous inscrivez avec un lien de parrainage ({referralCode}).
          </p>
        )}

        <div className="stack-on-mobile" style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <input placeholder="Prénom (élève)" required value={form.first_name} onChange={(e) => update("first_name", e.target.value)} />
          <input placeholder="Nom (élève)" required value={form.last_name} onChange={(e) => update("last_name", e.target.value)} />
        </div>

        {accountType === "student" && (
          <input
            type="date"
            required
            aria-label="Date de naissance de l'élève"
            style={{ marginBottom: 14 }}
            value={form.date_of_birth}
            onChange={(e) => update("date_of_birth", e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
          />
        )}

        {accountType === "student" && isMinor && (
          <input
            placeholder="Nom du parent ou tuteur légal"
            required
            style={{ marginBottom: 14 }}
            value={form.parent_full_name}
            onChange={(e) => update("parent_full_name", e.target.value)}
          />
        )}

        <input
          type="email"
          placeholder={accountType === "student" && isMinor ? "Email du parent ou tuteur légal" : "nom@exemple.com"}
          required
          style={{ marginBottom: 4 }}
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 10px" }}>
          {accountType === "student" && isMinor
            ? "Élève mineur(e) : cet email et le mot de passe ci-dessous seront les identifiants de connexion du compte, à choisir ensemble avec votre enfant — l'inscription conjointe vaut autorisation parentale."
            : "\u00A0"}
        </p>

        <input
          type="password"
          placeholder="Mot de passe"
          required
          minLength={8}
          style={{ marginBottom: 14 }}
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          required
          minLength={8}
          style={{ marginBottom: 14 }}
          value={form.confirmPassword}
          onChange={(e) => update("confirmPassword", e.target.value)}
        />

        <CountryInput
          value={form.country}
          onChange={(v) => update("country", v)}
          style={{ marginBottom: accountType === "student" ? 14 : 14 }}
        />

        {form.country === "Tunisie" && (
          <p
            className="card"
            style={{
              background: "var(--warning-bg)", color: "var(--warning)", border: "none",
              fontSize: 13, marginBottom: 14,
            }}
          >
            Le paiement en ligne n'est pas disponible en Tunisie pour le moment : après votre inscription,
            contactez-nous à succes@reussir-mon-bac.com pour connaître les modalités de paiement par virement bancaire.
          </p>
        )}

        {accountType === "student" && (
          <div className="stack-on-mobile" style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
            <select style={{ flex: 1 }} value={form.bac_type} onChange={(e) => update("bac_type", e.target.value)}>
              {BAC_TYPES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.value === "fle" || b.value === "fls" ? b.label : `Bac ${b.label}`}
                </option>
              ))}
            </select>
            {isFleFls ? (
              <select
                style={{ flex: 1 }}
                value={form.cecrl_level}
                onChange={(e) => update("cecrl_level", e.target.value)}
                required
              >
                <option value="" disabled>
                  Niveau CECRL
                </option>
                {CECRL_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            ) : (
              <select style={{ flex: 1 }} value={form.grade_level} onChange={(e) => update("grade_level", e.target.value)}>
                <option value="1ere">1ère</option>
                <option value="terminale">Terminale</option>
              </select>
            )}
          </div>
        )}

        {accountType === "student" && form.bac_type === "general" && specialtySubjects.length > 0 && (
          <>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>
              Spécialités 1ère <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(max {MAX_PREMIERE})</span>
            </p>
            <SpecialtyChips
              subjects={specialtySubjects}
              selected={premiereSpecialties}
              onToggle={(id) => toggleSpecialty(premiereSpecialties, setPremiereSpecialties, MAX_PREMIERE, id)}
            />

            <p style={{ fontSize: 13, fontWeight: 600, margin: "16px 0 4px" }}>
              Spécialités conservées en Terminale{" "}
              <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(max {MAX_TERMINALE})</span>
            </p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 8px" }}>
              Laissez vide si vous êtes en 1ère et ne savez pas encore — vous pourrez les renseigner plus tard.
            </p>
            <SpecialtyChips
              subjects={specialtySubjects}
              selected={terminaleSpecialties}
              onToggle={(id) => toggleSpecialty(terminaleSpecialties, setTerminaleSpecialties, MAX_TERMINALE, id)}
            />

            {mathOptionSubjects.length > 0 && (
              <>
                <p style={{ fontSize: 13, fontWeight: 600, margin: "16px 0 4px" }}>
                  Option mathématiques en Terminale{" "}
                  <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(facultatif)</span>
                </p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 8px" }}>
                  Maths Expertes si vous gardez Mathématiques en spécialité, Maths Complémentaires si
                  vous l'abandonnez.
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {mathOptionSubjects.map((s) => {
                    const eligible =
                      s.code === "gen-maths-expertes" ? keepsMathsSpecialty : !keepsMathsSpecialty;
                    const selected = terminaleMathOption === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        disabled={!eligible}
                        onClick={() => setTerminaleMathOption(selected ? null : s.id)}
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
          </>
        )}

        {accountType === "teacher" && (
          <>
            <textarea
              placeholder="Quelques mots sur vous, votre expérience d'enseignement..."
              rows={3}
              style={{ width: "100%", marginBottom: 14, resize: "vertical" }}
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
            />

            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>Matières enseignées</p>
            <SpecialtyChips subjects={allSubjects} selected={teacherSubjects} onToggle={toggleTeacherSubject} />

            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "12px 0 22px" }}>
              Votre candidature sera examinée par notre équipe avant de pouvoir vous voir confier des groupes —
              vous pourrez vous connecter dès maintenant pour compléter votre profil.
            </p>
          </>
        )}

        {accountType === "affiliate" && (
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 22px" }}>
            Un compte affilié pur, sans lien avec l'enseignement — vous recevrez votre propre lien de
            parrainage juste après l'inscription.
          </p>
        )}

        <button
          type="submit"
          className="btn-primary"
          style={{ width: "100%", margin: "0 0 16px" }}
          disabled={submitting}
        >
          {submitting ? "Création…" : "Créer mon compte"}
        </button>

        <p style={{ fontSize: 13, color: "var(--text-secondary)", textAlign: "center", margin: 0 }}>
          Déjà inscrit ? <Link to="/connexion">Se connecter</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

// Native HTML type-ahead: typing filters the <datalist> options live, and
// picking one (or typing an exact match) sets the value — zero extra
// dependency needed for "tapez les premières lettres pour trouver le pays".
function CountryInput({ value, onChange, style }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      <input
        list="countries-datalist"
        placeholder="Pays (tapez pour rechercher)"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
      <datalist id="countries-datalist">
        {COUNTRIES.filter((c) => !c.startsWith("---")).map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </div>
  );
}


