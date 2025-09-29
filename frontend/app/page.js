"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, apiForm, authHeaders, API_BASE } from "../lib/apiClient";

// Helper para normalizar URL de mídia (avatar/imagens) vinda do Django
function getAvatarUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path; // já é absoluta
  const baseUrl = API_BASE.replace("/api", ""); // remove /api
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

function Header({ me, onLogout }) {
  return (
    <div className="header">
      <div className="header-inner">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/">
            <strong>School Social</strong>
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!me ? (
            <Link href="/signin" className="btn secondary">
              Sign in
            </Link>
          ) : (
            <>
              {/* Header: me (top-right) */}
              {me?.avatar && (
                <Link href={`/u/${me.id}`} title="My profile">
                  <img
                    className="avatar"
                    src={getAvatarUrl(me.avatar)}
                    alt="me"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </Link>
              )}
              <Link
                href={`/u/${me.id}`}
                className="btn-link"
                title="My profile">
                <span>
                  {me.username} • {me.role}
                </span>
              </Link>
              <button className="btn secondary" onClick={onLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);

  async function load() {
    setLoading(true);
    try {
      const user = await api("/me/");
      setMe(user);
      const data = await api("/posts/");
      setPosts(data.results || data);
    } catch {
      setMe(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createPost() {
    if (!content && images.length === 0) return;
    const post = await api("/posts/", {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    for (const file of images) {
      const fd = new FormData();
      fd.set("image", file);
      await apiForm(`/posts/${post.id}/upload_image/`, fd);
    }
    setContent("");
    setImages([]);
    await load();
  }

  async function react(postId, type = "like") {
    await api(`/posts/${postId}/react/`, {
      method: "POST",
      body: JSON.stringify({ type }),
    });
    await load();
  }

  async function unreact(postId) {
    await api(`/posts/${postId}/unreact/`, { method: "POST" });
    await load();
  }

  async function remove(postId) {
    if (!confirm("Delete this post?")) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/posts/${postId}/`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    });
    await load();
  }

  function canManage(post) {
    if (!me) return false;
    if (me.role === "teacher") return true;
    return post.author?.id === me.id;
  }

  return (
    <div>
      <Header
        me={me}
        onLogout={() => {
          localStorage.removeItem("token");
          location.reload();
        }}
      />
      <div className="container">
        {!me && (
          <div className="card">
            Please <Link href="/signin">sign in</Link> to post and react.
          </div>
        )}

        {me && (
          <div className="card">
            <div style={{ display: "flex", gap: 8 }}>
              {/* Composer: me (left of textarea) */}
              {me?.avatar && (
                <Link href={`/u/${me.id}`} title="My profile">
                  <img
                    className="avatar"
                    src={getAvatarUrl(me.avatar)}
                    alt="me"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </Link>
              )}
              <textarea
                rows={3}
                placeholder="Share an update..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div className="row" style={{ marginTop: 8, alignItems: "center" }}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImages(Array.from(e.target.files || []))}
              />
              <button className="btn" onClick={createPost}>
                Post
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="card">Loading...</div>
        ) : (
          posts.map((p) => (
            <div className="card" key={p.id}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* Each post: author avatar */}
                {p.author?.avatar && (
                  <Link
                    href={`/u/${p.author.id}`}
                    title={`${p.author.username}'s profile`}>
                    <img
                      className="avatar"
                      src={getAvatarUrl(p.author.avatar)}
                      alt={p.author.username}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </Link>
                )}
                <div>
                  <div>
                    {/* Each post: author name link */}
                    <Link href={`/u/${p.author.id}`}>
                      <strong>{p.author?.username}</strong>
                    </Link>
                    {" • "}
                    <small>{new Date(p.created_at).toLocaleString()}</small>
                  </div>
                  <div style={{ color: "#666" }}>{p.author?.role}</div>
                </div>
                {canManage(p) && (
                  <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                    <button className="react" onClick={() => remove(p.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {p.content && (
                <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                  {p.content}
                </div>
              )}

              {p.images?.map((img) => (
                <img
                  key={img.id}
                  src={getAvatarUrl(img.image)} // normaliza URL das imagens do post
                  className="post-image"
                  alt="img"
                  onError={(e) =>
                    console.log("Erro na imagem do post:", e.currentTarget.src)
                  }
                />
              ))}

              <div className="reacts">
                <button className="react" onClick={() => react(p.id, "like")}>
                  👍 Like
                </button>
                <button className="react" onClick={() => react(p.id, "love")}>
                  ❤️ Love
                </button>
                <button className="react" onClick={() => react(p.id, "laugh")}>
                  😂 Laugh
                </button>
                <button className="react" onClick={() => unreact(p.id)}>
                  ❌ Remove reaction
                </button>
              </div>

              {p.reactions?.length > 0 && (
                <div style={{ marginTop: 6, color: "#666" }}>
                  {p.reactions.map((r) => r.type).join(" • ")}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
