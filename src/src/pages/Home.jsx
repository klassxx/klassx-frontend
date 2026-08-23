import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HERO_IMAGE_URL } from "../config/media";
import { api } from "../api/client";
import TeacherCard from "../components/TeacherCard";

/**
 * Hero background photo is set in src/config/media.js (HERO_IMAGE_URL) so
 * it's shared with the login/register side panel — edit it in one place.
 */

export default function Home() {
  const [teachers, setTeachers] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    api.publicTeachers().then((data) => setTeachers(data.results || data)).catch(() => {});
    api.publicPricing().then(setPricing).catch(() => {});
    api.publicFAQ().then((data) => setFaqs(data.results || data)).catch(() => {});
  }, []);

  return (
    <div>
      {/* --- Hero --- */}
      <section
        style={{
          position: "relative",
          minHeight: "560px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "2rem 1.5rem",
          backgroundImage: HERO_IMAGE_URL
            ? `linear-gradient(180deg, rgba(20,30,54,0.72), rgba(20,30,54,0.86)), url(${HERO_IMAGE_URL})`
            : "linear-gradient(135deg, #1B2A4A 0%, #26375E 55%, #3A4E7A 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "white",
        }}
      >
        <div style={{ maxWidth: 680 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#E8C670",
              textShadow: "0 1px 8px rgba(0,0,0,0.4)",
              margin: "0 0 16px",
            }}
          >
            Préparation au Baccalauréat
          </p>
          <h1
            style={{
              fontSize: "clamp(30px, 4.6vw, 48px)",
              fontWeight: 600,
              lineHeight: 1.15,
              textShadow: "0 2px 12px rgba(0,0,0,0.35)",
              margin: "0 0 20px",
            }}
          >
            L'excellence de la préparation au Baccalauréat Français, où que vous soyez
          </h1>
          <p
            style={{
              fontSize: 17,
              color: "rgba(255,255,255,0.85)",
              margin: "0 0 32px",
              lineHeight: 1.6,
            }}
          >
            Cours en ligne en petits groupes interactifs guidés par des enseignants experts du programme officiel.
          </p>
          <a href="#forfaits">
            <button
              className="btn-accent"
              style={{ padding: "14px 28px", fontSize: 15, borderRadius: "var(--radius-sm)" }}
            >
              Découvrir nos forfaits
            </button>
          </a>
        </div>
      </section>

      {/* --- Matières disponibles --- */}
      <section className="container" style={{ paddingTop: "2.5rem", paddingBottom: "3.5rem" }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            textAlign: "center",
            margin: "0 0 20px",
          }}
        >
          Matières disponibles
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
          <SubjectBadge icon="📐" label="Mathématiques" />
          <SubjectBadge icon="✍️" label="Français" />
          <SubjectBadge icon="💭" label="Philosophie" />
          <SubjectBadge icon="⚛️" label="Physique-Chimie" />
          <SubjectBadge icon="🌍" label="HGGSP" />
          <SubjectBadge icon="📊" label="SES" />
          <SubjectBadge icon="🎤" label="Grand Oral" />
        </div>
      </section>

      {/* --- Pourquoi KLASSX --- */}
      <section className="container">
        <h2 style={{ fontSize: 26, fontWeight: 600, margin: "0 0 24px", textAlign: "center" }}>
          Pourquoi choisir KLASSX
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          <FeatureImageCard
            image="/images/features/maths.jpg"
            title="Mathématiques, à tous les niveaux"
            description="Spécialité, Maths Expertes, Maths Complémentaires — un enseignant qui connaît précisément le programme visé."
          />
          <FeatureImageCard
            image="/images/features/sciences.jpg"
            title="Sciences en petits groupes"
            description="Physique-Chimie, SVT — des séances interactives, pas des cours magistraux en amphi virtuel."
          />
          <FeatureImageCard
            image="/images/features/programme-officiel.jpg"
            title="Programme officiel français"
            description="Nos enseignants suivent le référentiel de l'Éducation nationale, en France comme en Tunisie."
          />
          <FeatureImageCard
            image="/images/features/grand-oral.jpg"
            title="Préparation au Grand Oral"
            description="Des séances individuelles dédiées à l'épreuve orale, pour arriver le jour J en confiance."
          />
        </div>
      </section>

      {/* --- Qui sommes-nous --- */}
      <section className="container">
        <div
          className="grid-2col-stack"
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: 40,
            alignItems: "center",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                margin: "0 0 10px",
              }}
            >
              Qui sommes-nous
            </p>
            <h2 style={{ fontSize: 26, fontWeight: 600, margin: "0 0 16px", lineHeight: 1.25 }}>
              Un accompagnement sur mesure pour le Bac français, en France comme à l'international
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
              KLASSX accompagne les élèves inscrits au Baccalauréat français où qu'ils vivent — Amérique du Nord,
              Asie, Europe et au-delà. Nous réunissons des enseignants experts du programme officiel autour de
              petits groupes de niveau, pour un suivi personnalisé qui respecte le rythme et le fuseau horaire de
              chaque élève.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
            }}
          >
            <FeatureCard
              icon="📚"
              title="À la carte"
              text="Choisissez uniquement les matières dont vous avez besoin, sans engagement sur le reste."
            />
            <FeatureCard
              icon="🎥"
              title="Cours en direct"
              text="Groupes de 10, 5, 3 élèves ou individuel — toutes matières, avec un vrai enseignant."
            />
            <FeatureCard
              icon="📐"
              title="Capsules maths"
              text="Vidéos courtes organisées par chapitre du programme, à regarder à votre rythme."
            />
          </div>
        </div>
      </section>

      {/* --- Nos enseignants experts --- */}
      {teachers.length > 0 && (
        <section className="container">
          <SectionHeading eyebrow="L'équipe" title="Nos enseignants experts" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 20,
              marginBottom: 20,
            }}
          >
            {teachers.map((t) => (
              <TeacherCard key={t.id} teacher={t} />
            ))}
          </div>
          <Link to="/nos-enseignants" style={{ fontWeight: 600 }}>
            Voir toute l'équipe pédagogique →
          </Link>
        </section>
      )}

      {/* --- Comment ça fonctionne & Forfaits --- */}
      <section className="container" id="forfaits">
        <SectionHeading eyebrow="Le fonctionnement" title="Comment ça fonctionne" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
            marginBottom: 40,
          }}
        >
          <StepCard number="1" title="Choisissez votre forfait" text="Sélectionnez la matière, le niveau et le nombre d'heures hebdomadaires souhaité." />
          <StepCard number="2" title="Rejoignez un groupe de niveau" text="Vous êtes placé dans un groupe d'élèves de niveau et de disponibilités compatibles." />
          <StepCard number="3" title="Suivez vos cours en visio" text="Retrouvez votre enseignant chaque semaine en direct, avec supports et enregistrements." />
        </div>

        {pricing.length > 0 && (
          <div className="pricing-grid">
            {pricing.map((p) => (
              <PricingCard key={p.group_tier} plan={p} />
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link to="/catalogue">
            <button className="btn-primary" style={{ padding: "12px 24px" }}>
              Voir tous les cours disponibles
            </button>
          </Link>
        </div>
      </section>

      {/* --- FAQ --- */}
      {faqs.length > 0 && (
        <section className="container" style={{ maxWidth: 760 }}>
          <SectionHeading eyebrow="Questions fréquentes" title="Vous vous posez des questions ?" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {faqs.map((faq) => (
              <FAQItem key={faq.id} faq={faq} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeading({ eyebrow, title }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 32 }}>
      <p
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          margin: "0 0 8px",
        }}
      >
        {eyebrow}
      </p>
      <h2 style={{ fontSize: 26, fontWeight: 600, margin: 0 }}>{title}</h2>
    </div>
  );
}

function SubjectBadge({ icon, label }) {
  return (
    <Link
      to="/catalogue"
      className="subject-badge"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        borderRadius: 999,
        border: "1px solid var(--border)",
        background: "var(--surface-1)",
        color: "var(--text-primary)",
        fontSize: 13,
        fontWeight: 500,
        boxShadow: "var(--shadow-sm)",
        transition: "all 0.15s ease",
      }}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </Link>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="card">
      <div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>{title}</h3>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

function FeatureImageCard({ image, title, description }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <img
        src={image}
        alt={title}
        style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
      />
      <div style={{ padding: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>{title}</h3>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>{description}</p>
      </div>
    </div>
  );
}

function StepCard({ number, title, text }) {
  return (
    <div className="card">
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "var(--ink)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 700,
          marginBottom: 12,
        }}
      >
        {number}
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>{title}</h3>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

function PricingCard({ plan }) {
  return (
    <div
      className="card pricing-card"
      style={{ textAlign: "center", display: "flex", flexDirection: "column" }}
    >
      <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px" }}>{plan.group_tier_display}</p>
      <p style={{ fontSize: 26, fontWeight: 700, margin: "0 0 4px" }}>
        {plan.price_per_hour_eur.toFixed(2).replace(".00", "")}€
        <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-muted)" }}>/heure</span>
      </p>
      <div style={{ flexGrow: 1 }} />
      <Link to={`/inscription?forfait=${plan.group_tier}`} style={{ marginTop: 16 }}>
        <button className="btn-primary" style={{ width: "100%" }}>
          Choisir
        </button>
      </Link>
    </div>
  );
}

function FAQItem({ faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ cursor: "pointer" }} onClick={() => setOpen((v) => !v)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{faq.question}</p>
        <span style={{ fontSize: 18, color: "var(--text-muted)" }}>{open ? "−" : "+"}</span>
      </div>
      {open && (
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: "12px 0 0" }}>
          {faq.response}
        </p>
      )}
    </div>
  );
}
