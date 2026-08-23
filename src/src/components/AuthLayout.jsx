import { HERO_IMAGE_URL } from "../config/media";

/**
 * Shared split-screen layout for Login and Register: a branded panel on
 * the left (photo optional, see src/config/media.js), the form on the
 * right. Stacks vertically on small screens.
 */
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        minHeight: "calc(100vh - 73px)",
      }}
      className="auth-layout"
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          padding: "3rem",
          minHeight: 320,
          backgroundImage: HERO_IMAGE_URL
            ? `linear-gradient(180deg, rgba(20,30,54,0.45), rgba(20,30,54,0.88)), url(${HERO_IMAGE_URL})`
            : "linear-gradient(160deg, #1B2A4A 0%, #26375E 60%, #3A4E7A 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "white",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 12px" }}>
            <img src="/brand/logo-icon.png" alt="" style={{ height: 34, width: "auto" }} />
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 26,
                fontWeight: 600,
                margin: 0,
              }}
            >
              KLASSX
            </p>
          </div>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", maxWidth: 340, lineHeight: 1.6, margin: 0 }}>
            Cours en direct, capsules vidéo et forum — tout ce qu'il faut pour préparer votre bac, matière par matière.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem 2rem",
        }}
      >
        <div style={{ width: "100%", maxWidth: 420 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, textAlign: "center", margin: "0 0 6px" }}>{title}</h1>
          {subtitle && (
            <p
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                textAlign: "center",
                margin: "0 0 28px",
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .auth-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
