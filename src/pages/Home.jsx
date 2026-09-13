import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HERO_IMAGE_URL } from "../config/media";
import { api } from "../api/client";
import TeacherCard from "../components/TeacherCard";
import { toYoutubeEmbedUrl } from "../utils/youtube";

/**
 * Hero background photo is set in src/config/media.js (HERO_IMAGE_URL) so
 * it's shared with the login/register side panel — edit it in one place.
 */

export default function Home() {
  const [teachers, setTeachers] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [promoVideos, setPromoVideos] = useState([]);

  useEffect(() => {
    api.publicTeachers().then((data) => setTeachers(data.results || data)).catch(() => {});
    api.publicPricing().then(setPricing).catch(() => {});
    api.publicFAQ().then((data) => setFaqs(data.results || data)).catch(() => {});
    api.promoVideos().then((data) => setPromoVideos(data.results || data)).catch(() => {});
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
          // Fond clair uni — l'illustration (voir plus bas) a elle-même
          // un fond crème, un fond sombre par-dessus la rendrait terne
          // et effacerait ses couleurs. Cohérent avec le reste du site
          // (section "Pourquoi choisir KLASSX" juste en dessous).
          background: "var(--surface-0, #F7F6F3)",
          color: "var(--ink, #1B2A4A)",
        }}
      >
        {/* Fin liseré doré en haut — remet un point d'ancrage visuel
            fort, sans revenir à un fond sombre sur toute la bannière. */}
        <div
          style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 4,
            background: "linear-gradient(90deg, var(--accent-dark, #A97A22), var(--accent, #C9932E), var(--accent-dark, #A97A22))",
          }}
        />
        <div style={{ maxWidth: 680 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--accent-dark, #A97A22)",
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
              color: "var(--ink, #1B2A4A)",
              margin: "0 0 20px",
            }}
          >
            L'excellence de la préparation au Baccalauréat Français, où que vous soyez
          </h1>
          <p
            style={{
              fontSize: 17,
              color: "var(--text-secondary, #5C6270)",
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

          {HERO_IMAGE_URL && (
            <div
              className="hero-float-image"
              style={{
                maxWidth: 480, width: "100%", marginTop: 40, marginLeft: "auto", marginRight: "auto",
                background: "var(--surface-1, #FFFFFF)", borderRadius: "var(--radius, 16px)",
                boxShadow: "0 12px 32px rgba(27,42,74,0.12)", padding: 12,
              }}
            >
              <img src={HERO_IMAGE_URL} alt="" style={{ width: "100%", display: "block", borderRadius: "calc(var(--radius, 16px) - 6px)" }} />
            </div>
          )}
        </div>
      </section>

      {/* --- Offre : 1 mois gratuit de Maths --- */}
      <section className="container" style={{ paddingTop: "2rem" }}>
        <div
          className="card"
          style={{
            textAlign: "center", background: "var(--accent-soft, #FFF4E5)",
            border: "1px solid var(--accent, #E8A33D)", padding: "24px 20px",
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 6px" }}>
            🎁 Offre de rentrée — jusqu'au 30 octobre 2026
          </p>
          <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 6px" }}>
            1 forfait de groupe acheté = 1 mois de Maths offert
          </p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
            Même formule (taille de groupe et heures/mois) que votre forfait acheté, valable dès que votre groupe
            est constitué et votre premier mois facturé — contactez-nous à ce moment pour recevoir votre code.
          </p>
        </div>
      </section>

      {/* --- Matières disponibles --- */}
      {/* Fond blanc pur, en rupture avec le crème de la bannière au-dessus
          — évite l'effet "tout se fond ensemble" repéré visuellement. */}
      <div style={{ background: "var(--surface-1, #FFFFFF)" }}>
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
          <SubjectBadge icon="🧬" label="SVT" />
          <SubjectBadge icon="🌍" label="HGGSP" />
          <SubjectBadge icon="📊" label="SES" />
          <SubjectBadge icon="🎤" label="Grand Oral" />
        </div>
      </section>
      </div>

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
            description="Nos enseignants suivent le référentiel de l'Éducation nationale, en France comme au Canada."
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

      {/* --- Vidéos de présentation (gérées depuis l'admin) --- */}
      {promoVideos.length > 0 && (
        <section className="container">
          <SectionHeading eyebrow="Découvrir" title="KLASSX en vidéo" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {promoVideos.map((video) => {
              const embedUrl = toYoutubeEmbedUrl(video.video_url);
              if (!embedUrl) return null;
              return (
                <div key={video.id}>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px" }}>{video.title}</p>
                  <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: "var(--radius)", overflow: "hidden" }}>
                    <iframe
                      src={embedUrl}
                      title={video.title}
                      allowFullScreen
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* --- Chat avec un enseignant --- */}
      <div style={{ background: "var(--ink, #1B2A4A)" }}>
        <section
          className="container"
          style={{
            paddingTop: "3rem", paddingBottom: "3rem", display: "flex",
            flexWrap: "wrap", alignItems: "center", gap: 32, justifyContent: "space-between",
          }}
        >
          <div style={{ flex: "1 1 340px" }}>
            <p
              style={{
                fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
                color: "var(--accent, #C9932E)", margin: "0 0 12px",
              }}
            >
              Nouveau
            </p>
            <h2 style={{ fontSize: 26, fontWeight: 600, color: "white", margin: "0 0 12px" }}>
              💬 Une question sur un exercice ? Écrivez directement à un enseignant
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.6 }}>
              Envoyez votre question, joignez une photo de votre devoir — réponse sous 24h.
              La première question est gratuite, sans engagement.
            </p>
          </div>
          <Link to="/chat-enseignant">
            <button className="btn-accent" style={{ padding: "14px 28px", fontSize: 15, whiteSpace: "nowrap" }}>
              Essayer gratuitement
            </button>
          </Link>
        </section>
      </div>

      {/* --- Nos enseignants experts --- */}
      {teachers.length > 0 && (
        <section className="container">
          <SectionHeading eyebrow="L'équipe" title="Nos enseignants experts" />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--accent)", margin: "0 0 16px" }}>
            ✅ Tous nos enseignants sont 100% vérifiés
          </p>
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
  const hasDiscount = plan.discount_percentage > 0;
  return (
    <div
      className="card pricing-card"
      style={{ textAlign: "center", display: "flex", flexDirection: "column" }}
    >
      <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px" }}>{plan.group_tier_display}</p>
      {hasDiscount && (
        <span
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--ink)",
            background: "var(--accent)",
            borderRadius: 999,
            padding: "2px 10px",
            margin: "0 0 6px",
          }}
        >
          -{plan.discount_percentage}%
        </span>
      )}
      <p style={{ fontSize: 26, fontWeight: 700, margin: "0 0 4px" }}>
        {hasDiscount && (
          <span
            style={{
              fontSize: 15,
              fontWeight: 400,
              color: "var(--text-muted)",
              textDecoration: "line-through",
              marginRight: 6,
            }}
          >
            {plan.original_price_per_hour_eur.toFixed(2).replace(".00", "")}€
          </span>
        )}
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
