import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { useSeoMeta } from "../utils/seo";

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setPost(null);
    setError("");
    api
      .blogPost(slug)
      .then(setPost)
      .catch(() => setError("Cet article n'existe pas ou n'est plus disponible."));
  }, [slug]);

  useSeoMeta({
    title: post?.title,
    description: post?.excerpt,
    image: post?.cover_image,
    jsonLd: post
      ? {
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          image: post.cover_image || undefined,
          datePublished: post.published_at,
          dateModified: post.updated_at,
          author: post.author_name ? { "@type": "Person", name: post.author_name } : undefined,
          publisher: { "@type": "Organization", name: "KLASSX" },
        }
      : null,
  });

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <Link to="/blog" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        ← Retour au blog
      </Link>

      {error && <p style={{ color: "var(--text-secondary)", marginTop: 20 }}>{error}</p>}

      {post && (
        <article style={{ marginTop: 20 }}>
          {post.cover_image && (
            <img
              src={post.cover_image}
              alt={post.title}
              style={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: "var(--radius)", marginBottom: 24 }}
            />
          )}
          <h1 style={{ fontSize: 30, fontWeight: 700, margin: "0 0 8px" }}>{post.title}</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 32px" }}>
            {new Date(post.published_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}
            {post.author_name && ` · ${post.author_name}`}
          </p>
          <div
            style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-primary)" }}
            // Contenu HTML complet — sûr uniquement parce que seul un
            // admin peut écrire un article (voir BlogPostAdmin, aucune
            // vue publique ne permet d'écrire du contenu ici). Ne
            // JAMAIS faire ça pour du contenu soumis par un élève ou un
            // enseignant.
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      )}
    </div>
  );
}
