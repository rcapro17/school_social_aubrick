"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import ReactionBar from "@/components/ReactionBar";
import CommentsThread from "@/components/CommentsThread";
import styles from "./profile.module.css";
import { api, API_BASE, toAbsoluteUrl } from "@/lib/apiClient";

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  const [me, setMe] = useState(null);
  const [user, setUser] = useState(null);
  const [bio, setBio] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioSaving, setBioSaving] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingCover, setSavingCover] = useState(false);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const isOwnPage = me && user && me.id === user.id;

  async function load() {
    setLoading(true);
    try {
      const meResp = await api("/me/").catch(() => null);
      if (meResp) setMe(meResp);

      const u = await api(`/users/${id}/`);
      setUser(u);
      setBio(u.bio || "");

      const ps = await api(`/posts/?author=${id}`);
      setPosts(ps.results || ps);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function uploadAvatar(file) {
    if (!file) return;
    setSavingAvatar(true);
    try {
      const fd = new FormData();
      fd.set("avatar", file);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/users/${id}/avatar/`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (err) {
      console.error(err);
      alert("Could not update avatar.");
    } finally {
      setSavingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function uploadCover(file) {
    if (!file) return;
    setSavingCover(true);
    try {
      const fd = new FormData();
      fd.set("cover", file);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/users/${id}/cover/`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (err) {
      console.error(err);
      alert("Could not update cover.");
    } finally {
      setSavingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  async function saveBio() {
    if (!bio.trim() && !user.bio) {
      setIsEditingBio(false);
      return;
    }
    
    setBioSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/users/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ bio: bio.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      
      const updatedUser = await res.json();
      setUser(updatedUser);
      setBio(updatedUser.bio || "");
      setIsEditingBio(false);
    } catch (e) {
      console.error(e);
      alert("Could not save bio.");
    } finally {
      setBioSaving(false);
    }
  }

  function cancelBioEdit() {
    setBio(user?.bio || "");
    setIsEditingBio(false);
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
            <div className="card" style={{ padding: 0 }}>
              <div className={styles.coverCard}>
                <div className={styles.coverBox}>
                  {user.cover ? (
                    <img
                      src={toAbsoluteUrl(user.cover)}
                      alt={`${user.username} cover`}
                      className={styles.coverImg}
                    />
                  ) : (
                    <div className={styles.coverPlaceholder} />
                  )}

                  {isOwnPage && (
                    <>
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => uploadCover(e.target.files?.[0])}
                        className={styles.hiddenInput}
                        id="cover-picker"
                      />
                      <label 
                        htmlFor="cover-picker" 
                        className={styles.coverEditBtn}
                        title="Change cover photo"
                      >
                        {savingCover ? "Saving..." : "Edit cover"}
                      </label>
                    </>
                  )}
                </div>

                <div className={styles.profileRow}>
                  <div className={styles.avatarWrap}>
                    <img
                      className={styles.avatar}
                      alt={user.username}
                      src={toAbsoluteUrl(user.avatar) || ""}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />

                    {isOwnPage && (
                      <>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => uploadAvatar(e.target.files?.[0])}
                          className={styles.hiddenInput}
                          id="avatar-picker"
                        />
                        <label
                          htmlFor="avatar-picker"
                          className={styles.avatarEditBtn}
                          title="Change profile photo">
                          {savingAvatar ? "Saving..." : "Edit photo"}
                        </label>
                      </>
                    )}
                  </div>

                  <div>
                    <div className={styles.displayName}>{user.username}</div>
                    <div className={styles.role}>{user.role}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 className={styles.cardTitle}>About</h3>
                {isOwnPage && !isEditingBio && (
                  <button 
                    className="btn secondary" 
                    onClick={() => setIsEditingBio(true)}
                    style={{ fontSize: 14, padding: '6px 12px' }}
                  >
                    Edit bio
                  </button>
                )}
              </div>

              {!isEditingBio ? (
                <p className={styles.bioText}>
                  {user.bio || (isOwnPage ? "No bio yet. Click 'Edit bio' to add one." : "No bio yet.")}
                </p>
              ) : (
                <div className={styles.bioForm}>
                  <textarea
                    rows={4}
                    className="input"
                    placeholder="Tell something about you (classes, interests, etc.)"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button 
                      className="btn" 
                      onClick={saveBio} 
                      disabled={bioSaving}
                    >
                      {bioSaving ? "Saving..." : "Save"}
                    </button>
                    <button 
                      className="btn secondary" 
                      onClick={cancelBioEdit}
                      disabled={bioSaving}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className={styles.cardTitle}>Posts</h3>
              {posts.length === 0 && <div>No posts yet.</div>}

              {posts.map((p) => (
                <div key={p.id} className={styles.postItem}>
                  <div className={styles.postHeader}>
                    {p.author?.avatar && (
                      <Link href={`/u/${p.author.id}`}>
                        <img
                          className="avatar"
                          src={toAbsoluteUrl(p.author.avatar)}
                          alt={p.author.username}
                          onError={(e) =>
                            (e.currentTarget.style.display = "none")
                          }
                        />
                      </Link>
                    )}
                    <div>
                      <div>
                        <Link href={`/u/${p.author.id}`}>
                          <strong>{p.author?.username}</strong>
                        </Link>{" "}
                        •{" "}
                        <small>{new Date(p.created_at).toLocaleString()}</small>
                      </div>
                      <div style={{ color: "#666" }}>{p.author?.role}</div>
                    </div>
                  </div>

                  {p.content && (
                    <div
                      style={{
                        marginTop: 18,
                        marginBottom: 18,
                        whiteSpace: "pre-wrap",
                      }}>
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
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}