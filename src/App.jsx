import React, { useState } from "react";

const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const API_BASE = RAW_API_BASE.replace(/\/$/, "");

const isPlaceholder =
  !RAW_API_BASE ||
  RAW_API_BASE.includes("YOUR_RENDER_BACKEND_URL") ||
  RAW_API_BASE.includes("PASTE");

const apiBaseStatus = isPlaceholder
  ? `VITE_API_BASE_URL is NOT set correctly. Current value: "${RAW_API_BASE}"`
  : `VITE_API_BASE_URL OK: ${API_BASE}`;

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
      setRooms(Array.isArray(data) ? data : []);
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
    if (!token) return setMsg("Enter a token.");
    if (!roomNumber) return setMsg("Room number required.");

    try {
      setLoading(true);
      await apiPost("/api/rooms", {
        hotelId,
        roomNumber,
        roomType,
        price: price ? Number(price) : undefined,
      }, token);

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
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>My Space</h1>

      <p style={{ fontSize: 13, opacity: 0.8 }}>{apiBaseStatus}</p>

      <input placeholder="Hotel ID" value={hotelId} onChange={e => setHotelId(e.target.value)} />
      <input placeholder="Auth token" value={token} onChange={e => setToken(e.target.value)} />

      <button onClick={loadRooms}>Load rooms</button>

      <ul>
        {rooms.map(r => (
          <li key={r.id}>{r.roomNumber} – {r.roomType} – {r.price}</li>
        ))}
      </ul>

      <form onSubmit={createRoom}>
        <input placeholder="Room number" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} />
        <input placeholder="Room type" value={roomType} onChange={e => setRoomType(e.target.value)} />
        <input placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} />
        <button>Create room</button>
      </form>

      {msg && <p>{msg}</p>}
    </div>
  );
}
