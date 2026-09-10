import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import Skeleton from "../components/Skeleton";
import { ChatThreadView } from "./ChatTutoring";

/**
 * /enseignant/chat — liste des abonnements de chat où CET enseignant
 * doit répondre (voir MyTeacherChatSubscriptionsView côté backend,
 * déjà filtré sur assigned_teacher). Réutilise ChatThreadView, le même
 * composant que côté élève — la logique d'affichage des messages est
 * strictement identique, seul le libellé du champ de saisie change.
 */
export default function TeacherChatPage() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubscriptionId, setActiveSubscriptionId] = useState(null);

  useEffect(() => {
    document.title = "Chat élèves — KLASSX";
    api
      .myTeacherChatSubscriptions()
      .then((data) => setSubscriptions(data.results || data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeSubscription = subscriptions.find((s) => s.id === activeSubscriptionId);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Chat avec mes élèves</h1>
          <p>Répondez aux questions de vos abonnés — réponse attendue sous 24h.</p>
        </div>
      </div>

      <button onClick={() => navigate("/enseignant")} style={{ marginBottom: 24 }}>
        ← Retour à Mes cours
      </button>

      {loading && <Skeleton variant="rows" count={3} />}

      {!loading && activeSubscription && (
        <div style={{ maxWidth: 720 }}>
          <button onClick={() => setActiveSubscriptionId(null)} style={{ marginBottom: 16 }}>
            ← Retour à la liste
          </button>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{activeSubscription.plan_name}</p>
          <ChatThreadView subscription={activeSubscription} isTeacherView={true} />
        </div>
      )}

      {!loading && !activeSubscription && (
        <>
          {subscriptions.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Aucun élève abonné pour l'instant.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {subscriptions.map((sub) => (
                <div key={sub.id} className="card card-row">
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{sub.plan_name}</p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
                      {sub.questions_used_this_period}/{sub.max_questions_per_month} questions ce mois-ci
                    </p>
                  </div>
                  <button onClick={() => setActiveSubscriptionId(sub.id)}>Ouvrir le fil</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
