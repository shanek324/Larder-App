import { useState } from "react";
import { supabase } from "./supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("signin"); // signin | signup | forgot
  const [success, setSuccess] = useState(null);

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    setSuccess(null);
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

  async function handleResendConfirmation() {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) setError(error.message);
    else setSuccess("Confirmation email sent. Check your inbox (and spam folder).");
    setLoading(false);
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) setError(error.message);
    else setSuccess("Password reset email sent. Check your inbox (and spam folder).");
    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key !== "Enter") return;
    if (mode === "signin") handleSignIn();
    else if (mode === "signup") handleSignUp();
    else if (mode === "forgot") handleForgotPassword();
  }

  function switchMode(next) {
    setMode(next);
    setError(null);
    setSuccess(null);
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <p className="login-emoji">🫙</p>
        <h1 className="login-title">Larder</h1>
        <p className="login-subtitle">Your kitchen, organised</p>

        {mode !== "forgot" && (
          <div className="login-mode-toggle">
            <button
              onClick={() => switchMode("signin")}
              className={"login-mode-btn" + (mode === "signin" ? " active" : "")}
            >Sign In</button>
            <button
              onClick={() => switchMode("signup")}
              className={"login-mode-btn" + (mode === "signup" ? " active" : "")}
            >Create Account</button>
          </div>
        )}

        {mode === "forgot" && (
          <p className="login-forgot-hint">
            Enter your email and we will send you a link to reset your password.
          </p>
        )}

        <input
          type="email"
          placeholder="Email" aria-label="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          className="input login-input"
        />

        {mode !== "forgot" && (
          <input
            type="password"
            placeholder="Password" aria-label="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="input login-input"
          />
        )}

        {error && <p className="login-error">{error}</p>}
        {success && <p className="login-success">{success}</p>}

        <button
          onClick={
            mode === "signin" ? handleSignIn :
            mode === "signup" ? handleSignUp :
            handleForgotPassword
          }
          disabled={loading}
          className="btn btn-primary btn-full login-btn"
        >
          {loading
            ? (mode === "signin" ? "Signing in…" : mode === "signup" ? "Creating account…" : "Sending…")
            : (mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send reset email")}
        </button>

        <div className="login-links">
          {mode === "signin" && (
            <>
              <button onClick={() => switchMode("forgot")} className="login-link-btn">
                Forgot password?
              </button>
              <button onClick={handleResendConfirmation} disabled={loading} className="login-link-btn">
                Resend confirmation
              </button>
            </>
          )}
          {mode === "forgot" && (
            <button onClick={() => switchMode("signin")} className="login-link-btn">
              ← Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
