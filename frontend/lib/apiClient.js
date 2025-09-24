// frontend/lib/apiClient.js
"use client";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000/api";

export function apiOrigin() {
  // strip trailing /api from API_BASE
  return API_BASE.replace(/\/api\/?$/, "");
}

export function authHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function toAbsoluteUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url; // already absolute
  return `${apiOrigin()}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function handleTokenError() {
  // Limpar o token expirado
  localStorage.removeItem("token");
  // Redirecionar para a página de login
  window.location.href = "/signin";
}

export async function api(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...authHeaders(),
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      try {
        const errorJson = JSON.parse(errorText);
        // Se for erro de token expirado/inválido
        if (errorJson.code === "token_not_valid") {
          await handleTokenError();
          return;
        }
      } catch {
        // Se não for JSON, apenas lança o erro original
      }
      throw new Error(errorText);
    }

    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (error) {
    if (error.message.includes("token_not_valid")) {
      await handleTokenError();
      return;
    }
    throw error;
  }
}

export async function apiForm(path, formData) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { ...authHeaders() },
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.code === "token_not_valid") {
          await handleTokenError();
          return;
        }
      } catch {}
      throw new Error(errorText);
    }

    return res.json();
  } catch (error) {
    if (error.message.includes("token_not_valid")) {
      await handleTokenError();
      return;
    }
    throw error;
  }
}
