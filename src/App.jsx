import React, { useState } from "react";

/* =========================
   API BASE
========================= */
const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const API_BASE = RAW_API_BASE.replace(/\/$/, "");

const isPlaceholder =
  !RAW_API_BASE ||
  RAW_API_BASE.includes("YOUR_RENDER_BACKEND_URL") ||
  RAW_API_BASE.includes("PASTE");

const apiBaseStatus = isPlaceholder
  ? `VITE_API_BASE_URL is NOT set correctly. Current value: "${RAW_API_BASE}"`
  : `VITE_API_BASE_URL OK: ${API_BASE}`;

/* =========================
   APP
========================= */
export default function App() {
  /* ---------- AUTH STATE ---------- */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [authError, setAuthError] = useState("");

  /* ---------- LOGIN ---------- */
  async function login() {
    setAuthError("");
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAuthError(data?.message || `Login failed (${res.status})`);
        return;
      }

      setToken(data.token || data.accessToken || "");
    } catch (err) {
      setAuthError("Network error");
    }
  }

  /* =========================
     LOGIN SCREEN
  ========================= */
  if (!token) {
    return (
      <div style={{ maxWidth: 400, margin: "80px auto", fontFamily: "system-ui" }}>
        <h2>Login</h2>
        <p>{apiBaseStatus}</p>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 8 }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 8 }}
        />

        <button onClick={login}>Log in</button>

        {authError && <p style={{ color: "red" }}>{authError}</p>}
      </div>
    );
  }

  /* =========================
     DASHBOARD
  ========================= */
  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>My Space</h1>
      <p>{apiBaseStatus}</p>

      <p>
        <strong>Logged in</strong>
      </p>

      {/* Your existing dashboard UI can stay below */}
    </div>
  );
}
