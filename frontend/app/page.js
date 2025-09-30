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

              {/* ⇩ New: Reaction bar with counts and current user's reaction */}
              <ReactionBar post={p} onChanged={load} />

              {/* ⇩ New: Comments (with replies) for this post */}
              <CommentsThread postId={p.id} me={me} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
