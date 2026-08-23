import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { IconInstagram, IconFacebook, IconLinkedin, IconTiktok, IconSend } from "./Icons";

const socialLinks = [
  { label: "Instagram", href: "https://instagram.com/klassx", Icon: IconInstagram },
  { label: "Facebook", href: "https://facebook.com/klassx", Icon: IconFacebook },
  { label: "LinkedIn", href: "https://linkedin.com/company/klassx", Icon: IconLinkedin },
  { label: "TikTok", href: "https://tiktok.com/@klassx", Icon: IconTiktok },
];

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--surface-1)",
        marginTop: 48,
      }}
    >
      <div
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          padding: "2.5rem 2.5rem 2rem",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <div style={{ maxWidth: 320 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 8px" }}>
            <img src="/brand/logo-icon.png" alt="" style={{ height: 24, width: "auto" }} />
            <p style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>KLASSX</p>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 16px" }}>
            La préparation au Baccalauréat français en ligne, où que vous soyez dans le monde.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            {socialLinks.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--ink)";
                  e.currentTarget.style.color = "var(--ink)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Icon width={16} height={16} />
              </a>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 40 }}>
          <FooterColumn
            title="KLASSX"
            links={[
              { to: "/catalogue", label: "Nos cours" },
              { to: "/inscription", label: "S'inscrire" },
            ]}
          />
          <FooterColumn
            title="Informations légales"
            links={[
              { to: "/mentions-legales", label: "Mentions légales" },
              { to: "/cgv", label: "CGV" },
              { to: "/confidentialite", label: "Politique de confidentialité" },
            ]}
          />
          <FooterColumn
            title="Contact"
            links={[{ to: "mailto:succes@reussir-mon-bac.com", label: "succes@reussir-mon-bac.com", external: true }]}
          />
        </div>

        <NewsletterForm />
      </div>

      <div
        style={{
          borderTop: "1px solid var(--border)",
          padding: "1rem 2.5rem",
          textAlign: "center",
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        © {new Date().getFullYear()} KLASSX. Tous droits réservés.
      </div>
    </footer>
  );
}

/**
 * Enregistre réellement l'inscription côté backend (voir
 * /public/newsletter/, core/services/brevo.py) — l'email est stocké en
 * base ET poussé vers Brevo (best-effort côté serveur).
 */
function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    try {
      await api.subscribeNewsletter(email);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div style={{ maxWidth: 280 }}>
      <p
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          margin: "0 0 12px",
        }}
      >
        Newsletter
      </p>
      {status === "done" ? (
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
          Merci ! Vous êtes bien inscrit(e).
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
          <input
            type="email"
            required
            placeholder="Votre email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ height: 38, fontSize: 13 }}
            aria-label="Adresse email pour la newsletter"
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={status === "loading"}
            style={{ padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            aria-label="S'inscrire à la newsletter"
          >
            <IconSend width={16} height={16} />
          </button>
        </form>
      )}
      {status === "error" && (
        <p style={{ fontSize: 11, color: "var(--warning)", margin: "8px 0 0" }}>
          Une erreur est survenue, réessayez.
        </p>
      )}
      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "8px 0 0", lineHeight: 1.5 }}>
        Conseils Bac et nouveautés KLASSX, une fois par mois.
      </p>
    </div>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <p
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          margin: "0 0 12px",
        }}
      >
        {title}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {links.map((link) =>
          link.external ? (
            <a key={link.to} href={link.to} style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {link.label}
            </a>
          ) : (
            <Link key={link.to} to={link.to} style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {link.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
}
