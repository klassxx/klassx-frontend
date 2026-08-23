import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../api/AuthContext";

const linkStyle = { color: "var(--text-secondary)", fontWeight: 500 };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/connexion");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--surface-1)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        className="navbar-inner"
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.1rem 2.5rem",
        }}
      >
        <Link to="/" onClick={closeMenu} style={{ display: "flex", alignItems: "center" }}>
          <img src="/brand/logo-horizontal.png" alt="KLASSX" style={{ height: 38, width: "auto" }} />
        </Link>

        {/* Desktop nav — hidden below 860px, replaced by the collapsible menu below */}
        <nav className="navbar-links-desktop" style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <Link to="/nos-enseignants" style={linkStyle}>
            Nos Enseignants
          </Link>
          <Link to="/catalogue" style={linkStyle}>
            Rejoindre un cours
          </Link>
          <Link to="/forum" style={linkStyle}>
            Forum
          </Link>
          {user ? (
            <>
              {user.role === "student" && (
                <Link to="/tableau-de-bord" style={linkStyle}>
                  Tableau de bord
                </Link>
              )}
              {user.role === "student" && (
                <Link to="/capsules" style={linkStyle}>
                  Maths en libre-service
                </Link>
              )}
              {user.role === "teacher" && (
                <Link to="/enseignant" style={linkStyle}>
                  Mes cours
                </Link>
              )}
              {user.role === "admin" && (
                <Link to="/admin" style={linkStyle}>
                  Admin
                </Link>
              )}
              <button onClick={handleLogout}>Déconnexion</button>
            </>
          ) : (
            <>
              <Link to="/connexion" style={linkStyle}>
                Se connecter
              </Link>
              <Link to="/inscription">
                <button className="btn-accent">Créer un compte</button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile hamburger — hidden above 860px */}
        <button
          className="navbar-burger"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            display: "none", border: "none", background: "transparent", padding: 8,
            width: 40, height: 40, alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden="true">
            {menuOpen ? (
              <path d="M1 1L21 15M21 1L1 15" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <>
                <line x1="0" y1="1" x2="22" y2="1" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
                <line x1="0" y1="8" x2="22" y2="8" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
                <line x1="0" y1="15" x2="22" y2="15" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <nav
          className="navbar-links-mobile"
          style={{
            display: "flex", flexDirection: "column", gap: 4, padding: "0.5rem 1.5rem 1.25rem",
            borderTop: "1px solid var(--border)",
          }}
        >
          <Link to="/nos-enseignants" onClick={closeMenu} style={{ ...linkStyle, padding: "10px 4px" }}>
            Nos Enseignants
          </Link>
          <Link to="/catalogue" onClick={closeMenu} style={{ ...linkStyle, padding: "10px 4px" }}>
            Rejoindre un cours
          </Link>
          <Link to="/forum" onClick={closeMenu} style={{ ...linkStyle, padding: "10px 4px" }}>
            Forum
          </Link>
          {user ? (
            <>
              {user.role === "student" && (
                <Link to="/tableau-de-bord" onClick={closeMenu} style={{ ...linkStyle, padding: "10px 4px" }}>
                  Tableau de bord
                </Link>
              )}
              {user.role === "student" && (
                <Link to="/capsules" onClick={closeMenu} style={{ ...linkStyle, padding: "10px 4px" }}>
                  Maths en libre-service
                </Link>
              )}
              {user.role === "teacher" && (
                <Link to="/enseignant" onClick={closeMenu} style={{ ...linkStyle, padding: "10px 4px" }}>
                  Mes cours
                </Link>
              )}
              {user.role === "admin" && (
                <Link to="/admin" onClick={closeMenu} style={{ ...linkStyle, padding: "10px 4px" }}>
                  Admin
                </Link>
              )}
              <button onClick={handleLogout} style={{ marginTop: 8, width: "100%" }}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/connexion" onClick={closeMenu} style={{ ...linkStyle, padding: "10px 4px" }}>
                Se connecter
              </Link>
              <Link to="/inscription" onClick={closeMenu} style={{ marginTop: 8 }}>
                <button className="btn-accent" style={{ width: "100%" }}>
                  Créer un compte
                </button>
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
