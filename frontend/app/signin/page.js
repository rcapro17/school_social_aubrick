"use client";

import { useState } from "react";
import Link from "next/link";
import { API_BASE } from "../../lib/apiClient";

export default function SignIn() {
  console.log('🏷️ Página SignIn carregada');
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
        console.log('🔑 Token salvo:', data.access);
        console.log('🏠 Redirecionando...');
        window.location.href = "/";
    } catch {
      setError("Invalid credentials");
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: "40px auto" }}>
        <h3>Sign in</h3>
        {error && <div style={{ color: "red" }}>{error}</div>}
        <form onSubmit={submit}>
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
            style={{ marginTop: 8 }}
          />
          <button className="btn" style={{ marginTop: 8 }} type="submit">
            Sign in
          </button>
        </form>
        <div style={{ marginTop: 32 }}>
          No account? <Link href="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
