import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";

async function apiGet(path) {
  if (!API_BASE) throw new Error("Missing VITE_API_BASE_URL (set it in Vercel).");
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
  return res.json();
}

async function apiPost(path, body, token) {
  if (!API_BASE) throw new Error("Missing VITE_API_BASE_URL (set it in Vercel).");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`POST ${path} failed (${res.status}) ${txt}`);
  }
  return res.json();
}

export default function App() {
  const [hotelId, setHotelId] = useState("");
  const [token, setToken] = useState("");
  const [rooms, setRooms] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [roomNumber, setRoomNumber] = useState("");
  const [roomType, setRoomType] = useState("");
  const [price, setPrice] = useState("");

  async function loadRooms() {
    setMsg("");
    if (!hotelId) return setMsg("Enter a Hotel ID first.");
    try {
      setLoading(true);
      const data = await apiGet(`/api/rooms/${encodeURIComponent(hotelId)}`);
      setRooms(Array.isArray(data) ? data : (data.rooms || []));
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function createRoom(e) {
    e.preventDefault();
    setMsg("");
    if (!hotelId) return setMsg("Enter a Hotel ID first.");
    if (!token) return setMsg("Enter a token (required to create rooms).");
    if (!roomNumber) return setMsg("Room number is required.");

    const payload = {
      hotelId,
      roomNumber,
      roomType,
      price: price ? Number(price) : undefined,
    };

    try {
      setLoading(true);
      await apiPost("/api/rooms", payload, token);
      setRoomNumber("");
      setRoomType("");
      setPrice("");
      await loadRooms();
      setMsg("Room created.");
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: "system-ui", maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <h1 style={{ margin: 0 }}>My Space</h1>
      <p style={{ marginTop: 6, opacity: 0.8 }}>Rooms dashboard (frontend)</p>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Hotel</h3>

          <label>Hotel ID</label>
          <input
            value={hotelId}
            onChange={(e) => setHotelId(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc", marginTop: 6 }}
            placeholder="e.g. 123"
          />

          <div style={{ height: 12 }} />

          <label>Auth Token (for create)</label>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc", marginTop: 6 }}
            placeholder="paste token here (no Bearer word)"
          />

          <div style={{ height: 12 }} />

          <button
            onClick={loadRooms}
            disabled={loading}
            style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ccc", cursor: "pointer" }}
          >
            {loading ? "Loading..." : "Load rooms"}
          </button>

          {msg ? <div style={{ marginTop: 10 }}>{msg}</div> : null}
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
            Backend base is read from <code>VITE_API_BASE_URL</code>.
          </div>
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Create room</h3>

          <form onSubmit={createRoom}>
            <label>Room number</label>
            <input
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc", marginTop: 6 }}
            />

            <div style={{ height: 12 }} />

            <label>Room type</label>
            <input
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc", marginTop: 6 }}
            />

            <div style={{ height: 12 }} />

            <label>Price</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc", marginTop: 6 }}
              inputMode="decimal"
            />

            <div style={{ height: 12 }} />

            <button
              type="submit"
              disabled={loading}
              style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ccc", cursor: "pointer" }}
            >
              {loading ? "Working..." : "Create room"}
            </button>
          </form>
        </div>
      </div>

      <div style={{ height: 16 }} />

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Rooms</h3>
        {!rooms.length ? (
          <div style={{ opacity: 0.7 }}>No rooms loaded yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>Room</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>Type</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r, i) => (
                <tr key={r._id || r.id || i}>
                  <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>{r.roomNumber ?? r.number ?? "-"}</td>
                  <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>{r.roomType ?? r.type ?? "-"}</td>
                  <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>{r.price ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
