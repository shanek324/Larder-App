import { useState } from "react";
import { supabase } from "./supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#faf7f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fffdf8", border: "1.5px solid #e8e0d5", borderRadius: 16, padding: 40, width: 340, textAlign: "center" }}>
        <p style={{ fontSize: 40, marginBottom: 8 }}>🫙</p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#2c1810", marginBottom: 24 }}>Larder</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", padding: "10px 14px", marginBottom: 12, borderRadius: 8, border: "1.5px solid #e8e0d5", fontFamily: "'DM Sans', sans-serif", fontSize: 14, boxSizing: "border-box" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{ width: "100%", padding: "10px 14px", marginBottom: 16, borderRadius: 8, border: "1.5px solid #e8e0d5", fontFamily: "'DM Sans', sans-serif", fontSize: 14, boxSizing: "border-box" }}
        />
        {error && <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: "100%", background: "#2c1810", color: "#f5e6c8", border: "none", borderRadius: 8, padding: "10px 0", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </div>
    </div>
  );
}
