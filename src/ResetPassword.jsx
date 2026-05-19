import { useState } from "react";
import { supabase } from "./supabase";
import { toast } from "./toast";

export default function ResetPassword({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    toast.success("Password updated. You're signed in.");
    setLoading(false);
    onDone();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <p className="login-emoji">🔑</p>
        <h1 className="login-title">Set new password</h1>
        <p className="login-subtitle">Choose a new password for your account.</p>

        <input
          type="password"
          placeholder="New password" aria-label="New password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          className="input login-input"
          autoFocus
        />
        <input
          type="password"
          placeholder="Confirm password" aria-label="Confirm password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="input login-input"
        />

        {error && <p className="login-error">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn btn-primary btn-full login-btn"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </div>
    </div>
  );
}
