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
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState("");
  const [gifs, setGifs] = useState([]);
  function handleGifClick() {
    setShowGifPicker((v) => !v);
    setShowEmojiPicker(false);
  }
  function handleEmojiClick() {
    setShowEmojiPicker((v) => !v);
    setShowGifPicker(false);
  }
  async function searchGiphy(term) {
    if (!term) return;
    const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(term)}&limit=8`);
    const data = await res.json();
    setGifs(data.data || []);
  }
  function addGifToPost(gifUrl) {
    setImages((imgs) => [...imgs, { url: gifUrl, isGif: true }]);
    setShowGifPicker(false);
  }
  function addEmojiToContent(emoji) {
    setContent((c) => c + emoji);
    setShowEmojiPicker(false);
  }
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
    try {
      const post = await api("/posts/", {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      for (const img of images) {
        if (img.isGif) {
          // Save GIF URL as a text post addition (or handle as needed)
          await api(`/posts/${post.id}/add_gif/`, {
            method: "POST",
            body: JSON.stringify({ url: img.url }),
          });
        } else {
          const fd = new FormData();
          fd.set("image", img);
          await apiForm(`/posts/${post.id}/upload_image/`, fd);
        }
      }
      setContent("");
      setImages([]);
      console.log("Setting success message...");
      setSuccessMsg("✅ Successfully posted!");
      setTimeout(() => {
        console.log("Clearing success message...");
        setSuccessMsg("");
      }, 3000);
      await load();
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Error creating post: " + err.message);
    }
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
          window.location.href = "/signin";
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
          zIndex: 9999,
          fontSize: "16px",
          fontWeight: "500",
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
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", position: "relative" }}>
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
              <div style={{ flex: 1, position: "relative" }}>
                <textarea
                  rows={3}
                  placeholder="What's happening?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  style={{ width: "100%" }}
                />
                {images.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, marginBottom: 8 }}>
                  {Array.from(images).map((file, index) => (
                    <div key={index} style={{ position: "relative" }}>
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        style={{
                          width: 100,
                          height: 100,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid #333"
                        }}
                      />
                      <button
                        onClick={() => setImages(images.filter((_, i) => i !== index))}
                        style={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          background: "#23232a",
                          border: "1px solid #333",
                          borderRadius: "50%",
                          width: 20,
                          height: 20,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 12,
                          cursor: "pointer"
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 18, marginTop: 16, alignItems: "center", position: "relative" }}>
                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    background: "#23232a",
                    borderRadius: "50%",
                    cursor: "pointer",
                    border: "1px solid #ff9800",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#ff9800" strokeWidth="2" fill="#23232a"/>
                      <circle cx="8" cy="13" r="2" fill="#ff9800" />
                      <path d="M21 19L15 13L11 17L7 13L3 17" stroke="#ff9800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: "none" }}
                      onChange={(e) => setImages(Array.from(e.target.files || []))}
                    />
                  </label>
                  <button type="button" style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    background: "#23232a",
                    borderRadius: "50%",
                    cursor: "pointer",
                    border: "1px solid #ff9800",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                  }} title="GIF" onClick={handleGifClick}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#ff9800" strokeWidth="2" fill="#23232a"/>
                      <text x="7" y="16" fontSize="8" fill="#ff9800" fontFamily="Arial">GIF</text>
                    </svg>
                  </button>
                  <button type="button" style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    background: "#23232a",
                    borderRadius: "50%",
                    cursor: "pointer",
                    border: "1px solid #ff9800",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                  }} title="Emoji" onClick={handleEmojiClick}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="#ff9800" strokeWidth="2" fill="#23232a"/>
                      <circle cx="9" cy="10" r="1.5" fill="#ff9800" />
                      <circle cx="15" cy="10" r="1.5" fill="#ff9800" />
                      <path d="M8 15C8.66667 16 10.6667 17 12 17C13.3333 17 15.3333 16 16 15" stroke="#ff9800" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                {showGifPicker && (
                  <div style={{ position: "absolute", left: 0, top: 40, background: "#23232a", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.2)", padding: 12, zIndex: 10, minWidth: 260 }}>
                    <input
                      type="text"
                      value={gifSearch}
                      onChange={e => {
                        setGifSearch(e.target.value);
                        searchGiphy(e.target.value);
                      }}
                      placeholder="Search GIFs..."
                      style={{ width: "100%", marginBottom: 8, padding: 6, borderRadius: 4, border: "1px solid #ff9800", background: "#18181b", color: "#fff" }}
                    />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {gifs.map(gif => (
                        <img key={gif.id} src={gif.images.fixed_height_small.url} alt="gif" style={{ width: 60, height: 60, borderRadius: 6, cursor: "pointer" }} onClick={() => addGifToPost(gif.images.fixed_height.url)} />
                      ))}
                    </div>
                  </div>
                )}
                {showEmojiPicker && (
                  <div style={{ position: "absolute", left: 60, top: 40, background: "#23232a", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.2)", padding: 12, zIndex: 10, minWidth: 180 }}>
                    {["😀","😂","😍","😎","😭","😡","👍","🙏","🎉","❤️"].map(e => (
                      <button key={e} style={{ fontSize: 22, margin: 4, background: "none", border: "none", cursor: "pointer", color: "#ff9800" }} onClick={() => addEmojiToContent(e)}>{e}</button>
                    ))}
                  </div>
                )}
                  <div style={{ flex: 1 }} />
                  <button className="btn" onClick={createPost} style={{
                    padding: "6px 18px",
                    fontSize: 14,
                    background: "#ff9800",
                    color: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                  }}>
                    Post
                  </button>
                </div>
              </div>
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

              {p.images?.map((img, idx) => (
                img.isGif ? (
                  <img
                    key={img.url + idx}
                    src={img.url}
                    className="post-image"
                    alt="gif"
                  />
                ) : (
                  <img
                    key={img.id}
                    src={getAvatarUrl(img.image)}
                    className="post-image"
                    alt="img"
                    onError={(e) => {
                      console.log('Erro na imagem do post:', e.target.src);
                    }}
                  />
                )
              ))}

              <div className="reacts">
                <button className="react" onClick={() => react(p.id, "👍")}>👍 Like</button>
                <button className="react" onClick={() => react(p.id, "❤️")}>❤️ Love</button>
                <button className="react" onClick={() => react(p.id, "😂")}>😂 Laugh</button>
                <button className="react" onClick={() => unreact(p.id)}>❌ Remove reaction</button>
              </div>

              {p.reactions?.length > 0 && (
                <div style={{ marginTop: 6, color: "#ffffffff", display: "flex", gap: 8 }}>
                  {Object.entries(
                    p.reactions.reduce((acc, r) => {
                      acc[r.type] = (acc[r.type] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([type, count]) => (
                    <span key={type}>{count > 1 ? `${count} ${type}` : type}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}