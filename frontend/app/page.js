"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, apiForm, authHeaders, API_BASE } from "../lib/apiClient";

// Função para corrigir URL do avatar
function getAvatarUrl(avatar) {
  if (!avatar) return null;
  
  // Se já é URL completa, use como está
  if (avatar.startsWith('http')) return avatar;
  
  // Remove /api/ se estiver presente e constrói URL correta
  const baseUrl = API_BASE.replace('/api', '');
  return `${baseUrl}${avatar}`;
}

function Header({ me, onLogout }) {
  return (
    <div className="header">
      <div className="header-inner">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img 
          src="/logo/logotipo.png"
          alt="SociAubrick Logo"
          style={{ widht: 100, height:  100 }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!me ? (
            <Link href="/signin" className="btn secondary">
              Sign in
            </Link>
          ) : (
            <>
              {me.avatar && (
                <img 
                  className="avatar" 
                  src={getAvatarUrl(me.avatar)} 
                  alt="avatar"
                  onError={(e) => {
                    console.log('Erro no avatar do header:', e.target.src);
                    e.target.style.display = 'none';
                  }}
                />
              )}
              <span>
                {me.username} • {me.role}
              </span>
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
  const [successMsg, setSuccessMsg] = useState("");

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
    try {
      await api(`/posts/${postId}/`, { method: "DELETE" });
      setSuccessMsg("✅ Post Successfully deleted!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      let msg = err.message;
      try {
        const json = JSON.parse(msg);
        msg = json.detail || msg;
      } catch {}
      alert("Erro ao deletar: " + msg);
      console.error("Delete error:", err);
    }
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
      {successMsg && (
        <div style={{
          position: "fixed",
          bottom: 24,
          left: 24,
          background: "#23232a",
          color: "#f4f4f5",
          padding: "12px 24px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          zIndex: 2000,
        }}>
          {successMsg}
        </div>
      )}
      <div className="container">
        {/* ...existing code... */}
        {!me && (
          <div className="card">
            Please <Link href="/signin">sign in</Link> to post and react.
          </div>
        )}

        {me && (
          <div className="card">
            <div style={{ display: "flex", gap: 8 }}>
              {me.avatar && (
                <img 
                  className="avatar" 
                  src={getAvatarUrl(me.avatar)} 
                  alt="me"
                  onError={(e) => {
                    console.log('Erro no avatar do post:', e.target.src);
                    e.target.style.display = 'none';
                  }}
                />
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
                {p.author?.avatar && (
                  <img 
                    className="avatar" 
                    src={getAvatarUrl(p.author.avatar)} 
                    alt="a"
                    onError={(e) => {
                      console.log('Erro no avatar do post:', e.target.src);
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <div>
                  <div>
                    <strong>{p.author?.username}</strong> •{" "}
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
                  src={getAvatarUrl(img.image)} 
                  className="post-image"
                  alt="img"
                  onError={(e) => {
                    console.log('Erro na imagem do post:', e.target.src);
                  }}
                />
              ))}

              <div className="reacts">
                <button className="react" onClick={() => react(p.id, "👍")}>
                  👍 Like
                </button>
                <button className="react" onClick={() => react(p.id, "❤️")}>
                  ❤️ Love
                </button>
                <button className="react" onClick={() => react(p.id, "😂")}>
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