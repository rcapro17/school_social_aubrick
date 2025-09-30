"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./signin.module.css";
import { API_BASE } from "@/lib/apiClient";

export default function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      localStorage.setItem("token", data.access);
      location.href = "/";
    } catch {
      setError("Invalid credentials");
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
          <h1 className={styles.title}>School Social</h1>
          <p className={styles.subtitle}>Connect with your school community</p>
        </div>
      </div>

      {/* RIGHT: form panel */}
      <div className={styles.right}>
        <div className={styles.formWrap}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Sign in</h3>
            {error && <div className={styles.error}>{error}</div>}
            <form onSubmit={submit} className={styles.form}>
              <input
                className="input"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                className="input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button className="btn" type="submit">
                Sign in
              </button>
            </form>
            <div className={styles.footer}>
              No account? <Link href="/signup">Create new account</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
