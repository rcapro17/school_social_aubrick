"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import ReactionBar from "@/components/ReactionBar";
import CommentsThread from "@/components/CommentsThread";
import styles from "./page.module.css";
import { api, apiForm, authHeaders, toAbsoluteUrl } from "@/lib/apiClient";

export default function TimelinePage() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const popularEmojis = [
    "😀", "😂", "😍", "🥰", "😊", "😎", "🤔", "😢",
    "😭", "😡", "🤯", "🥳", "😴", "🤗", "👍", "👎",
    "👏", "🙌", "🤝", "💪", "🙏", "❤️", "💯", "🔥",
    "✨", "⭐", "🎉", "🎊", "🎈", "🎁", "💡", "📌"
  ];

  async function load() {
    setLoading(true);
    try {
      const user = await api("/me/").catch(() => null);
      setMe(user);
      const data = await api("/posts/");
      setPosts(data.results || data);
    } finally {
      setLoading(false);
    }
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

  function removeImage(index) {
    setImages(images.filter((_, i) => i !== index));
  }

  function addEmoji(emoji) {
    setContent(content + emoji);
    setShowEmojiPicker(false);
  }

  function openGiphyPicker() {
    alert("Integração com Giphy em breve! 🎬");
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
          <div className="card" style={{ position: 'relative', overflow: 'visible' }}>
            <div className={styles.composer}>
              {me?.avatar && (
                <Link href={`/u/${me.id}`} title="My profile">
                  <img
                    className="avatar"
                    src={toAbsoluteUrl(me.avatar)}
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

            {images.length > 0 && (
              <div style={{ 
                marginTop: 12, 
                marginLeft: 52,
                display: 'flex', 
                gap: 8, 
                flexWrap: 'wrap' 
              }}>
                {images.map((img, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      position: 'relative',
                      width: 100,
                      height: 100,
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '1px solid #e1e8ed'
                    }}
                  >
                    <img 
                      src={URL.createObjectURL(img)} 
                      alt={`preview ${idx}`}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }}
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 'bold',
                        padding: 0
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ 
              marginTop: 8, 
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              paddingLeft: 52
            }}>
              <input
                id="image-upload-input"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImages(Array.from(e.target.files || []))}
                style={{ display: 'none' }}
              />
              
              <label 
                htmlFor="image-upload-input" 
                style={{
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                  backgroundColor: 'transparent',
                  border: 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(243, 99, 20, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Adicionar imagens"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#F36314"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </label>

              <button
                onClick={openGiphyPicker}
                style={{
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                  backgroundColor: 'transparent',
                  border: 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(243, 99, 20, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Adicionar GIF"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#F36314"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                  <path d="M8 8h8"></path>
                  <path d="M8 12h8"></path>
                  <path d="M8 16h5"></path>
                </svg>
              </button>

              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  style={{
                    cursor: 'pointer',
                    padding: 8,
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s',
                    backgroundColor: showEmojiPicker ? 'rgba(243, 99, 20, 0.1)' : 'transparent',
                    border: 'none'
                  }}
                  onMouseEnter={(e) => !showEmojiPicker && (e.currentTarget.style.backgroundColor = 'rgba(243, 99, 20, 0.1)')}
                  onMouseLeave={(e) => !showEmojiPicker && (e.currentTarget.style.backgroundColor = 'transparent')}
                  title="Adicionar emoji"
                >
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="#F36314"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                  </svg>
                </button>

                {showEmojiPicker && (
                  <>
                    <div 
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 998
                      }}
                      onClick={() => setShowEmojiPicker(false)}
                    />
                    
                    <div style={{
                      position: 'fixed',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: 'white',
                      border: '1px solid #e1e8ed',
                      borderRadius: 12,
                      padding: 12,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      width: 280,
                      maxHeight: 200,
                      overflowY: 'auto',
                      zIndex: 999
                    }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(8, 1fr)',
                        gap: 4
                      }}>
                        {popularEmojis.map((emoji, idx) => (
                          <button
                            key={idx}
                            onClick={() => addEmoji(emoji)}
                            style={{
                              fontSize: 22,
                              padding: 6,
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              borderRadius: 6,
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {images.length > 0 && (
                <span style={{ fontSize: 14, color: '#536471', marginLeft: 4 }}>
                  {images.length} {images.length === 1 ? 'imagem' : 'imagens'}
                </span>
              )}

              <button className="btn" onClick={createPost} style={{ marginLeft: 'auto' }}>
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
              <div className={styles.postHeader}>
                {p.author?.avatar && (
                  <Link
                    href={`/u/${p.author.id}`}
                    title={`${p.author.username}'s profile`}>
                    <img
                      className="avatar"
                      src={toAbsoluteUrl(p.author.avatar)}
                      alt={p.author.username}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </Link>
                )}
                <div>
                  <div>
                    <Link href={`/u/${p.author.id}`}>
                      <strong>{p.author?.username}</strong>
                    </Link>
                    {" • "}
                    <small>{new Date(p.created_at).toLocaleString()}</small>
                  </div>
                  <div style={{ color: "#666" }}>{p.author?.role}</div>
                </div>
                {canManage(p) && (
                  <div className={styles.actionsRight}>
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
                  src={toAbsoluteUrl(img.image)}
                  className="post-image"
                  alt="img"
                />
              ))}

              <ReactionBar post={p} onChanged={load} />
              <CommentsThread postId={p.id} me={me} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}