import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../api/AuthContext";
import Skeleton from "../components/Skeleton";
import PaymentTrustBadge from "../components/PaymentTrustBadge";

export default function ChatTutoring() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubscriptionId, setActiveSubscriptionId] = useState(null);
  const [buyingId, setBuyingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    document.title = "Chat avec un enseignant — KLASSX";
    const requests = [api.chatTutoringPlans()];
    if (user?.role === "student") requests.push(api.myChatSubscriptions());
    Promise.all(requests)
      .then(([plansData, subsData]) => {
        setPlans(plansData.results || plansData);
        if (subsData) setSubscriptions(subsData.results || subsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  async function handleSubscribe(plan) {
    if (!user) {
      navigate("/connexion?next=/chat-enseignant");
      return;
    }
    setBuyingId(plan.id);
    setMessage("");
    try {
      const data = await api.chatTutoringCheckout(plan.id);
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setMessage(data.detail || "Demande enregistrée — contactez-nous pour connaître les modalités de paiement.");
      }
    } catch (err) {
      setMessage(err.message || "La demande a échoué.");
    } finally {
      setBuyingId(null);
    }
  }

  async function handleTryFree(plan) {
    if (!user) {
      navigate("/connexion?next=/chat-enseignant");
      return;
    }
    setBuyingId(plan.id);
    setMessage("");
    try {
      const subscription = await api.chatTutoringTryFree(plan.id);
      setSubscriptions((prev) => {
        const exists = prev.some((s) => s.id === subscription.id);
        return exists ? prev.map((s) => (s.id === subscription.id ? subscription : s)) : [...prev, subscription];
      });
      setActiveSubscriptionId(subscription.id);
    } catch (err) {
      setMessage(err.message || "Impossible de démarrer l'essai gratuit.");
    } finally {
      setBuyingId(null);
    }
  }

  const activeSubscription = subscriptions.find((s) => s.id === activeSubscriptionId);

  if (loading) {
    return (
      <div className="container">
        <Skeleton variant="cards" count={3} />
      </div>
    );
  }

  // Vue "fil de discussion" — une fois qu'on a choisi un abonnement actif.
  if (activeSubscription) {
    return (
      <div className="container" style={{ maxWidth: 720 }}>
        <button onClick={() => setActiveSubscriptionId(null)} style={{ marginBottom: 16 }}>
          ← Retour
        </button>
        <ChatThreadView subscription={activeSubscription} isTeacherView={false} />
      </div>
    );
  }

  return (
    <div className="container">
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 4px" }}>Chat avec un enseignant</h1>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 28px" }}>
        Posez vos questions par écrit, envoyez une photo de votre devoir — réponse sous 24h.
      </p>

      {subscriptions.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>Mes abonnements</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {subscriptions.map((sub) => (
              <div key={sub.id} className="card card-row">
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{sub.plan_name}</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
                    {sub.status === "active"
                      ? `${sub.questions_used_this_period}/${sub.max_questions_per_month} questions ce mois-ci`
                      : "En attente de paiement"}
                  </p>
                </div>
                {sub.status === "active" && (
                  <button onClick={() => setActiveSubscriptionId(sub.id)}>Ouvrir le fil</button>
                )}
                {sub.status === "pending" && !sub.free_question_used && (
                  <button onClick={() => setActiveSubscriptionId(sub.id)}>Poser ma question gratuite</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {message && <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>{message}</p>}

      <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>Services disponibles</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
        {plans.map((plan) => {
          const existingSub = subscriptions.find((s) => s.plan === plan.id);
          const isActive = existingSub?.status === "active";
          const canTryFree = !existingSub || !existingSub.free_question_used;
          return (
            <div key={plan.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{plan.name}</h3>
              <p style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600, margin: 0 }}>
                Avec {plan.teacher_name}
                {plan.subject_name ? ` — ${plan.subject_name}` : ""}
              </p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                Jusqu'à {plan.max_questions_per_month} questions par mois
              </p>
              {plan.description && (
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{plan.description}</p>
              )}
              <p style={{ fontSize: 22, fontWeight: 700, margin: "8px 0 0" }}>
                {(plan.price_cents / 100).toFixed(2)}€<span style={{ fontSize: 13, fontWeight: 400 }}>/mois</span>
              </p>
              {canTryFree && !isActive && (
                <button
                  onClick={() =>
                    existingSub ? setActiveSubscriptionId(existingSub.id) : handleTryFree(plan)
                  }
                  disabled={buyingId === plan.id}
                >
                  {buyingId === plan.id ? "…" : "🎁 Poser ma 1ère question gratuitement"}
                </button>
              )}
              <button className="btn-primary" onClick={() => handleSubscribe(plan)} disabled={buyingId === plan.id || isActive}>
                {isActive ? "Déjà abonné" : buyingId === plan.id ? "…" : existingSub ? "Payer maintenant" : "S'abonner"}
              </button>
              {!isActive && <PaymentTrustBadge />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Réutilisé par la vue élève ET la vue enseignant (voir
 * TeacherChatPage.jsx) — `isTeacherView` change juste le libellé du champ
 * d'envoi, la logique reste identique des deux côtés.
 */
export function ChatThreadView({ subscription, isTeacherView }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    api
      .chatThreadMessages(subscription.id)
      .then((data) => setMessages(data.results || data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [subscription.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!content.trim() && !file) return;
    setSending(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("content", content);
      if (file) formData.append("attachment", file);
      const sent = await api.sendChatMessage(subscription.id, formData);
      setMessages((prev) => [...prev, sent]);
      setContent("");
      setFile(null);
    } catch (err) {
      setError(err.message || "L'envoi a échoué.");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <Skeleton variant="rows" count={3} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "70vh" }}>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: "4px 0" }}>
        {messages.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {isTeacherView ? "Aucune question pour l'instant." : "Posez votre première question ci-dessous."}
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.sender === user?.id ? "flex-end" : "flex-start",
              maxWidth: "80%",
              background: msg.sender === user?.id ? "var(--accent-bg, #FBF1DD)" : "var(--surface-2, #EFEDE7)",
              borderRadius: 12,
              padding: "10px 14px",
            }}
          >
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px", fontWeight: 600 }}>{msg.sender_name}</p>
            {msg.content && <p style={{ fontSize: 14, margin: 0, whiteSpace: "pre-wrap" }}>{msg.content}</p>}
            {msg.attachment && (
              <a href={msg.attachment} target="_blank" rel="noreferrer" style={{ fontSize: 12, display: "block", marginTop: 6 }}>
                📎 Voir la pièce jointe
              </a>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
        <textarea
          placeholder={isTeacherView ? "Votre réponse..." : "Votre question..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          style={{ width: "100%", resize: "vertical" }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ fontSize: 12 }} />
          <button type="submit" className="btn-primary" disabled={sending} style={{ marginLeft: "auto" }}>
            {sending ? "…" : "Envoyer"}
          </button>
        </div>
        {error && <p style={{ fontSize: 12, color: "var(--warning)", margin: 0 }}>{error}</p>}
      </form>
    </div>
  );
}
