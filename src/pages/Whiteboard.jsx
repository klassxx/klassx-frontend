import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../api/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

/**
 * Encapsule public/whiteboard.html (fichier autonome, HTML/JS classique
 * — pas du React) dans une iframe, et lui transmet la séance + le jeton
 * d'accès par message privé (postMessage) une fois qu'il signale être
 * prêt — jamais dans l'URL de l'iframe, pour éviter qu'un jeton
 * d'accès ne traîne dans l'historique du navigateur ou les journaux.
 * L'accès réel est de toute façon revérifié côté serveur à chaque appel
 * (voir ClassSessionViewSet._check_whiteboard_access) — ce composant ne
 * fait que relayer, il ne décide de rien lui-même.
 */
export default function Whiteboard() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const iframeRef = useRef(null);

  useEffect(() => {
    function handleMessage(event) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.kind !== "klassx-ready") return;
      iframeRef.current.contentWindow.postMessage(
        {
          kind: "klassx-init",
          sessionId,
          accessToken: localStorage.getItem("klassx_access"),
          apiBase: API_BASE,
          role: user?.role === "teacher" ? "teacher" : "student",
          studentName: user ? `${user.first_name} ${user.last_name}`.trim() : "Élève",
        },
        window.location.origin
      );
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [sessionId, user]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#22352a", zIndex: 50 }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          position: "absolute", top: 10, left: 10, zIndex: 51,
          background: "rgba(0,0,0,.4)", color: "#fff", border: "1px solid rgba(255,255,255,.3)",
          borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer",
        }}
      >
        ← Retour
      </button>
      <iframe
        ref={iframeRef}
        src="/whiteboard.html"
        title="Tableau de la séance"
        style={{ width: "100%", height: "100%", border: "none" }}
        allow="microphone"
      />
    </div>
  );
}
