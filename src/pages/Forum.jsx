import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../api/AuthContext";

export default function Forum() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [threads, setThreads] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.subjects().then((data) => setSubjects(data.results || data)).catch(() => {});
  }, []);

  function loadThreads() {
    setLoading(true);
    const params = subjectFilter ? `?subject=${subjectFilter}` : "";
    api
      .forumThreads(params)
      .then((data) => setThreads(data.results || data))
      .finally(() => setLoading(false));
  }

  useEffect(loadThreads, [subjectFilter]);

  if (selectedThreadId) {
    return (
      <ThreadDetail
        threadId={selectedThreadId}
        user={user}
        onBack={() => {
          setSelectedThreadId(null);
          loadThreads();
        }}
      />
    );
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 600, margin: "0 0 4px" }}>Forum</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>Posez vos questions par matière.</p>
        </div>
        {user && (
          <button className="btn-primary" onClick={() => setShowNewThread((s) => !s)}>
            {showNewThread ? "Annuler" : "Nouvelle question"}
          </button>
        )}
      </div>

      {showNewThread && (
        <NewThreadForm
          subjects={subjects}
          onCreated={() => {
            setShowNewThread(false);
            loadThreads();
          }}
        />
      )}

      <div style={{ margin: "20px 0" }}>
        <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} style={{ width: "auto" }}>
          <option value="">Toutes les matières</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Chargement…</p>}
      {!loading && threads.length === 0 && <p style={{ color: "var(--text-muted)" }}>Aucune question pour l'instant.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {threads.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedThreadId(t.id)}
            className="card"
            style={{ textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}
          >
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{t.title}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0" }}>
                {t.author_name} · {t.reply_count} réponse{t.reply_count > 1 ? "s" : ""}
              </p>
            </div>
            {t.is_solved && (
              <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: "var(--radius)", background: "var(--success-bg)", color: "var(--success)" }}>
                Résolu
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function NewThreadForm({ subjects, onCreated }) {
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("terminale");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!subject) return;
    setSubmitting(true);
    try {
      await api.createForumThread({ subject, level, title, body });
      onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <select required value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value="" disabled>
            Matière
          </option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="1ere">1ère</option>
          <option value="terminale">Terminale</option>
        </select>
      </div>
      <input placeholder="Titre de votre question" required value={title} onChange={(e) => setTitle(e.target.value)} style={{ marginBottom: 12 }} />
      <textarea
        placeholder="Détaillez votre question…"
        required
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        style={{ width: "100%", padding: 12, border: "1px solid var(--border)", borderRadius: "var(--radius)", marginBottom: 12, fontFamily: "inherit" }}
      />
      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? "Publication…" : "Publier"}
      </button>
    </form>
  );
}

function ThreadDetail({ threadId, user, onBack }) {
  const [thread, setThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api.forumThread(threadId).then(setThread);
    api.forumReplies(threadId).then((data) => setReplies(data.results || data));
  }

  useEffect(load, [threadId]);

  async function handleReply(e) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      await api.createForumReply(threadId, reply);
      setReply("");
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkSolved() {
    await api.markThreadSolved(threadId);
    load();
  }

  if (!thread) return <div className="container">Chargement…</div>;

  const canMarkSolved = user && (user.id === thread.user || user.role === "teacher");

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <button onClick={onBack} style={{ marginBottom: 16 }}>
        ← Retour au forum
      </button>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h1 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 8px" }}>{thread.title}</h1>
          {thread.is_solved && (
            <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: "var(--radius)", background: "var(--success-bg)", color: "var(--success)" }}>
              Résolu
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 12px" }}>{thread.body}</p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Par {thread.author_name}</p>
        {canMarkSolved && !thread.is_solved && (
          <button onClick={handleMarkSolved} style={{ marginTop: 12 }}>
            Marquer comme résolu
          </button>
        )}
      </div>

      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 8px" }}>
        {replies.length} réponse{replies.length > 1 ? "s" : ""}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {replies.map((r) => (
          <div key={r.id} className="card">
            <p style={{ fontSize: 13, margin: "0 0 4px" }}>{r.body}</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
              {r.author_name}
              {r.author_role === "teacher" && (
                <span style={{ marginLeft: 6, color: "var(--accent-text)", fontWeight: 500 }}>· Enseignant</span>
              )}
            </p>
          </div>
        ))}
      </div>

      {user ? (
        <form onSubmit={handleReply} style={{ display: "flex", gap: 8 }}>
          <input placeholder="Écrire une réponse…" value={reply} onChange={(e) => setReply(e.target.value)} style={{ flex: 1 }} />
          <button type="submit" className="btn-primary" disabled={submitting}>
            Répondre
          </button>
        </form>
      ) : (
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Connectez-vous pour répondre.</p>
      )}
    </div>
  );
}
