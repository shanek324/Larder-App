import { useState } from "react";
import { supabase } from "./supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("signin");
  const [success, setSuccess] = useState(null);

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function handleSignUp() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Account created! Check your email to confirm, then sign in.");
      setMode("signin");
    }
    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") mode === "signin" ? handleSignIn() : handleSignUp();
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <p className="login-emoji">🫙</p>
        <h1 className="login-title">Larder</h1>
        <p className="login-subtitle">Your kitchen, organised</p>

        <div className="login-mode-toggle">
          <button
            onClick={() => { setMode("signin"); setError(null); setSuccess(null); }}
            className={"login-mode-btn" + (mode === "signin" ? " active" : "")}
          >Sign In</button>
          <button
            onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}
            className={"login-mode-btn" + (mode === "signup" ? " active" : "")}
          >Create Account</button>
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          className="input login-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          className="input login-input"
        />
        {error && <p className="login-error">{error}</p>}
        {success && <p className="login-success">{success}</p>}
        <button
          onClick={mode === "signin" ? handleSignIn : handleSignUp}
          disabled={loading}
          className="btn btn-primary btn-full login-btn"
        >
          {loading ? (mode === "signin" ? "Signing in…" : "Creating account…") : (mode === "signin" ? "Sign In" : "Create Account")}
        </button>
      </div>
    </div>
  );
}
