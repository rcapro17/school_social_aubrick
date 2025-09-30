"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./signup.module.css";
import { API_BASE } from "@/lib/apiClient";

export default function SignUp() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "student",
    first_name: "",
    last_name: "",
    bio: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [err, setErr] = useState("");

  function update(k, v) {
    setForm({ ...form, [k]: v });
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      // Create user (includes optional bio)
      const res = await fetch(`${API_BASE}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());

      // Login
      const tokenRes = await fetch(`${API_BASE}/auth/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
        }),
      });
      if (!tokenRes.ok) throw new Error(await tokenRes.text());
      const token = await tokenRes.json();
      localStorage.setItem("token", token.access);

      // Get my ID
      const meRes = await fetch(`${API_BASE}/me/`, {
        headers: { Authorization: `Bearer ${token.access}` },
      });
      const me = await meRes.json();

      // Upload avatar if provided
      if (avatar) {
        const fd = new FormData();
        fd.set("avatar", avatar);
        const up = await fetch(`${API_BASE}/users/${me.id}/avatar/`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token.access}` },
          body: fd,
        });
        if (!up.ok) throw new Error(await up.text());
      }

      location.href = "/";
    } catch (e) {
      setErr("Could not sign up");
      console.error(e);
    }
  }

  return (
    <div className={styles.split}>
      {/* LEFT: brand panel */}
      <div className={styles.left}>
        <div className={styles.leftInner}>
          <Image
            src="/logo/sociAubrick.png"
            alt="SociAubrick"
            width={440}
            height={440}
            priority
            className={styles.logo}
          />
          <h1 className={styles.title}>Welcome to School Social</h1>
          <p className={styles.subtitle}>Join your school’s private network</p>
        </div>
      </div>

      {/* RIGHT: form panel */}
      <div className={styles.right}>
        <div className={styles.formWrap}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Create account</h3>
            {err && <div className={styles.error}>{err}</div>}
            <form onSubmit={submit} className={styles.form}>
              <div className={styles.row}>
                <input
                  className="input"
                  placeholder="First name"
                  value={form.first_name}
                  onChange={(e) => update("first_name", e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Last name"
                  value={form.last_name}
                  onChange={(e) => update("last_name", e.target.value)}
                />
              </div>

              <input
                className="input"
                placeholder="Username"
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
              />
              <input
                className="input"
                placeholder="Email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
              <input
                className="input"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />

              <div className={styles.row}>
                <label className={styles.label}>Role</label>
                <select
                  className="input"
                  value={form.role}
                  onChange={(e) => update("role", e.target.value)}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                </select>
              </div>

              <textarea
                className="input"
                rows={3}
                placeholder="Short bio (optional)"
                value={form.bio}
                onChange={(e) => update("bio", e.target.value)}
              />

              <div className={styles.row}>
                <label className={styles.label}>Avatar (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatar(e.target.files?.[0] || null)}
                />
              </div>

              <button className="btn" type="submit">
                Sign up
              </button>
            </form>

            <div className={styles.footer}>
              Already have an account? <Link href="/signin">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
