"use client";

import { useState } from "react";
import { API_BASE } from "../../lib/apiClient";

export default function SignUp() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "student",
    first_name: "",
    last_name: "",
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
      // 1) create the user
      const res = await fetch(`${API_BASE}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());

      // 2) login
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

      // 3) fetch /me to get my id
      const meRes = await fetch(`${API_BASE}/me/`, {
        headers: { Authorization: `Bearer ${token.access}` },
      });
      const me = await meRes.json();

      // 4) upload avatar if selected
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

      // 5) go to timeline
      location.href = "/";
    } catch (e) {
      setErr("Could not sign up");
      console.error(e);
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 520, margin: "40px auto" }}>
        <h3>Create account</h3>
        {err && <div style={{ color: "red" }}>{err}</div>}
        <form onSubmit={submit}>
          <div className="row">
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
            style={{ marginTop: 8 }}
          />
          <input
            className="input"
            placeholder="Email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            style={{ marginTop: 8 }}
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            style={{ marginTop: 8 }}
          />
          <div style={{ marginTop: 8 }}>
            Role:
            <select
              className="input"
              value={form.role}
              onChange={(e) => update("role", e.target.value)}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
            </select>
          </div>
          <div style={{ marginTop: 8 }}>
            Avatar (optional):{" "}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatar(e.target.files?.[0] || null)}
            />
          </div>
          <button className="btn" style={{ marginTop: 8 }} type="submit">
            Sign up
          </button>
        </form>
      </div>
    </div>
  );
}
