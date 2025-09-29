"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, apiForm } from "../../../lib/apiClient";

// Reuse your helper approach
import { API_BASE } from "../../../lib/apiClient";
function getMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE.replace("/api", "")}${
    path.startsWith("/") ? "" : "/"
  }${path}`;
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
              {me.avatar && (
                <Link href={`/u/${me.id}`} title="My profile">
                  <img
                    className="avatar"
                    src={getMediaUrl(me.avatar)}
                    alt="me"
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

export default function UserProfilePage() {
  const params = useParams(); // /u/[id]
  const router = useRouter();
  const userId = params?.id;

  const [me, setMe] = useState(null);
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const isOwnPage = me && user && me.id === user.id;

  async function load() {
    setLoading(true);
    try {
      const meResp = await api("/me/").catch(() => null);
      if (meResp) setMe(meResp);

      // user details + posts by author
      const theUser = await api(`/users/${userId}/`);
      setUser(theUser);

      const userPosts = await api(`/posts/?author=${userId}`);
      setPosts(userPosts.results || userPosts);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (userId) load();
  }, [userId]);

  async function changeAvatar(e) {
    e.preventDefault();
    if (!avatarFile) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("avatar", avatarFile);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/users/${userId}/avatar/`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
      setAvatarFile(null);
      alert("Avatar updated!");
    } catch (err) {
      console.error(err);
      alert("Could not update avatar.");
    } finally {
      setSaving(false);
    }
  }

  function onLogout() {
    localStorage.removeItem("token");
    router.push("/signin");
  }

  return (
    <div>
      <Header me={me} onLogout={onLogout} />

      <div className="container">
        {loading && <div className="card">Loading profile...</div>}

        {!loading && user && (
          <>
            {/* Cover + avatar + intro (Facebook-ish) */}
            <div className="card" style={{ padding: 0 }}>
              <div
                style={{
                  background: "#e3e6ea",
                  height: 160,
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                }}
              />
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                  padding: 16,
                  marginTop: -40,
                }}>
                <img
                  className="avatar"
                  alt={user.username}
                  src={
                    getMediaUrl(user.avatar) ||
                    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
                  }
                  style={{ width: 80, height: 80, border: "3px solid #fff" }}
                />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {user.username}
                  </div>
                  <div style={{ color: "#666" }}>{user.role}</div>
                </div>
              </div>

              {isOwnPage && (
                <form
                  onSubmit={changeAvatar}
                  style={{ padding: "0 16px 16px 16px" }}>
                  <div className="row" style={{ alignItems: "center" }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setAvatarFile(e.target.files?.[0] || null)
                      }
                    />
                    <button
                      className="btn"
                      type="submit"
                      disabled={saving || !avatarFile}>
                      {saving ? "Saving..." : "Change avatar"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Composer – only on own page */}
            {isOwnPage && (
              <div className="card">
                <div>
                  Tip: Post from the main timeline for now (we can add
                  profile-scoped posting later).
                </div>
                <div style={{ marginTop: 8 }}>
                  <Link href="/" className="btn secondary">
                    Go to timeline
                  </Link>
                </div>
              </div>
            )}

            {/* Posts list (user’s posts) */}
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Posts</h3>
              {posts.length === 0 && <div>No posts yet.</div>}
              {posts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    borderTop: "1px solid #eee",
                    paddingTop: 12,
                    marginTop: 12,
                  }}>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {p.author?.avatar && (
                      <Link href={`/u/${p.author.id}`}>
                        <img
                          className="avatar"
                          src={getMediaUrl(p.author.avatar)}
                          alt={p.author.username}
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
                  </div>

                  {p.content && (
                    <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                      {p.content}
                    </div>
                  )}

                  {p.images?.map((img) => (
                    <img
                      key={img.id}
                      src={getMediaUrl(img.image)}
                      className="post-image"
                      alt="img"
                    />
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
