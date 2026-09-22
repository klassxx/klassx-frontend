import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import Skeleton from "../components/Skeleton";
import { useSeoMeta } from "../utils/seo";

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useSeoMeta({
    title: "Blog",
    description: "Conseils, méthodes et actualités pour réussir le baccalauréat français, en France comme à l'étranger — par l'équipe KLASSX.",
  });

  useEffect(() => {
    api
      .blogPosts()
      .then((data) => setPosts(data.results || data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container">
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 4px" }}>Blog</h1>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 28px" }}>
        Conseils, méthodes et actualités pour réussir le Bac.
      </p>

      {loading && <Skeleton variant="cards" count={3} />}
      {!loading && posts.length === 0 && (
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Aucun article publié pour l'instant.</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
        {posts.map((post) => (
          <Link
            key={post.id}
            to={`/blog/${post.slug}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="card" style={{ padding: 0, overflow: "hidden", height: "100%" }}>
              {post.cover_image && (
                <img
                  src={post.cover_image}
                  alt={post.title}
                  style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
                />
              )}
              <div style={{ padding: 16 }}>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 6px" }}>
                  {new Date(post.published_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                </p>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>{post.title}</h3>
                {post.excerpt && (
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                    {post.excerpt}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
