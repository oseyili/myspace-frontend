import React, { useEffect, useMemo, useState } from "react";

/**
 * API base handling (Vite)
 */
const RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL || "").trim();
const API_BASE = RAW_API_BASE.replace(/\/$/, "");

const isPlaceholder =
  !RAW_API_BASE ||
  RAW_API_BASE.includes("YOUR_RENDER_BACKEND_URL") ||
  RAW_API_BASE.includes("PASTE");

const apiBaseStatus = isPlaceholder
  ? `VITE_API_BASE_URL is NOT set correctly. Current value: "${RAW_API_BASE}"`
  : `VITE_API_BASE_URL OK: ${API_BASE}`;

/**
 * Helpers
 */
async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export default function App() {
  // ---- Auth ----
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(() => localStorage.getItem("authToken") || "");
  const [authError, setAuthError] = useState("");

  // ---- Rooms/dashboard ----
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // ---- Create room form ----
  const [roomNumber, setRoomNumber] = useState("");
  const [roomType, setRoomType] = useState("");
  const [price, setPrice] = useState("");

  const authHeader = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  useEffect(() => {
    // Keep token persisted if present
    if (token) localStorage.setItem("authToken", token);
    else localStorage.removeItem("authToken");
  }, [token]);

  async function login() {
    setAuthError("");
    if (!API_BASE) {
      setAuthError("Missing VITE_API_BASE_URL");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        setAuthError(data?.message || `Login failed (${res.status})`);
        return;
      }

      const t = data?.token || data?.accessToken || data?.jwt || "";
      if (!t) {
        setAuthError("Login succeeded but no token returned by backend.");
        return;
      }
      setToken(t);
    } catch (e) {
      setAuthError("Network error during login.");
    }
  }

  function logout() {
    setToken("");
    setEmail("");
    setPassword("");
    setRooms([]);
  }

  async function loadRooms() {
    setApiError("");
    if (!API_BASE) {
      setApiError("Missing VITE_API_BASE_URL");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/rooms`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
      });

      const data = await safeJson(res);

      if (!res.ok) {
        setApiError(data?.message || `Load rooms failed (${res.status})`);
        return;
      }

      // Accept either {rooms:[...]} or [...]
      const list = Array.isArray(data) ? data : Array.isArray(data?.rooms) ? data.rooms : [];
      setRooms(list);
    } catch (e) {
      setApiError("Network error loading rooms.");
    } finally {
      setLoading(false);
    }
  }

  async function createRoom() {
    setApiError("");
    if (!API_BASE) {
      setApiError("Missing VITE_API_BASE_URL");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        roomNumber: roomNumber ? Number(roomNumber) : roomNumber,
        roomType,
        price: price ? Number(price) : price,
      };

      const res = await fetch(`${API_BASE}/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        setApiError(data?.message || `Create room failed (${res.status})`);
        return;
      }

      // refresh
      await loadRooms();
      setRoomNumber("");
      setRoomType("");
      setPrice("");
    } catch (e) {
      setApiError("Network error creating room.");
    } finally {
      setLoading(false);
    }
  }

  /**
   * LOGIN VIEW
   */
  if (!token) {
    return (
      <div style={{ maxWidth: 420, margin: "80px auto", fontFamily: "system-ui", padding: 16 }}>
        <h2 style={{ marginBottom: 8 }}>Login</h2>
        <p style={{ marginTop: 0 }}>{apiBaseStatus}</p>

        <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: 10 }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: 10 }}
          />
          <button onClick={login} style={{ padding: 10, cursor: "pointer" }}>
            Log in
          </button>
        </div>

        {authError && <p style={{ color: "crimson", marginTop: 12 }}>{authError}</p>}

        <p style={{ opacity: 0.8, marginTop: 16 }}>
          Note: This expects your backend to support <code>POST /auth/login</code> and return a token.
        </p>
      </div>
    );
  }

  /**
   * DASHBOARD VIEW
   */
  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui", padding: 16 }}>
      <h1 style={{ marginBottom: 6 }}>My Space</h1>
      <p style={{ marginTop: 0 }}>{apiBaseStatus}</p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "16px 0" }}>
        <button onClick={loadRooms} disabled={loading} style={{ padding: 10, cursor: "pointer" }}>
          {loading ? "Loading..." : "Load rooms"}
        </button>
        <button onClick={logout} style={{ padding: 10, cursor: "pointer" }}>
          Log out
        </button>
      </div>

      <h3 style={{ marginTop: 24 }}>Create room</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8 }}>
        <input
          placeholder="Room number"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          style={{ padding: 10 }}
        />
        <input
          placeholder="Room type"
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
          style={{ padding: 10 }}
        />
        <input
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{ padding: 10 }}
        />
        <button onClick={createRoom} disabled={loading} style={{ padding: 10, cursor: "pointer" }}>
          Create room
        </button>
      </div>

      {apiError && <p style={{ color: "crimson", marginTop: 12 }}>{apiError}</p>}

      <h3 style={{ marginTop: 28 }}>Rooms</h3>
      {rooms.length === 0 ? (
        <p style={{ opacity: 0.8 }}>No rooms loaded yet.</p>
      ) : (
        <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left" style={{ borderBottom: "1px solid #ddd" }}>
                Room number
              </th>
              <th align="left" style={{ borderBottom: "1px solid #ddd" }}>
                Room type
              </th>
              <th align="left" style={{ borderBottom: "1px solid #ddd" }}>
                Price
              </th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((r, idx) => (
              <tr key={r?.id || r?._id || idx}>
                <td style={{ borderBottom: "1px solid #eee" }}>{r?.roomNumber ?? r?.number ?? ""}</td>
                <td style={{ borderBottom: "1px solid #eee" }}>{r?.roomType ?? r?.type ?? ""}</td>
                <td style={{ borderBottom: "1px solid #eee" }}>{r?.price ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
