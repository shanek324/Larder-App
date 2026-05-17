import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabase";

function getInitials(profile, email) {
  const source = (profile?.username || email || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function ProfileView({ session, onSignOut, onNavigate, recipes, collections }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    async function loadProfile() {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setProfile(data);
      if (!editingUsername) setUsernameInput(data?.username || "");
      setLoading(false);
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  async function saveUsername() {
    setSavingUsername(true);
    await supabase.from("profiles").update({ username: usernameInput.trim() }).eq("id", session?.user?.id);
    setProfile(p => ({ ...p, username: usernameInput.trim() }));
    setEditingUsername(false);
    setSavingUsername(false);
  }

  const tier = profile?.tier || "starter";
  const used = profile?.ai_credits_used || 0;
  const limit = tier === "power" ? "∞" : tier === "starter" ? 5 : 0;
  const initials = getInitials(profile, session?.user?.email);
  const email = session?.user?.email || "";

  // Most cooked recipe
  const mostCooked = useMemo(() => {
    const withCounts = recipes.filter(r => (r.cook_count || 0) > 0);
    if (withCounts.length === 0) return null;
    return [...withCounts].sort((a, b) => (b.cook_count || 0) - (a.cook_count || 0))[0];
  }, [recipes]);

  const totalCooks = useMemo(
    () => recipes.reduce((sum, r) => sum + (r.cook_count || 0), 0),
    [recipes]
  );

  return (
    <div className="view profile-view">
      {/* Avatar header */}
      <div className="profile-hero">
        <div className="profile-avatar" aria-hidden="true">{initials}</div>
        <h1 className="profile-name">{profile?.username || "Set your name"}</h1>
        <p className="profile-email">{email}</p>
      </div>

      {/* Display name (editable) */}
      <div className="profile-card">
        <p className="profile-card-label">Display Name</p>
        {editingUsername ? (
          <div className="profile-edit-row">
            <input
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              placeholder="Your name"
              className="input profile-edit-input"
              autoFocus
            />
            <button onClick={saveUsername} disabled={savingUsername} className="btn btn-gold">
              {savingUsername ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setEditingUsername(false); setUsernameInput(profile?.username || ""); }}
              className="btn btn-secondary"
            >Cancel</button>
          </div>
        ) : (
          <div className="profile-display-row">
            <span className={"profile-display-value" + (profile?.username ? "" : " profile-display-empty")}>
              {profile?.username || "Add a name to appear on public recipes"}
            </span>
            <button onClick={() => setEditingUsername(true)} className="btn btn-secondary profile-edit-btn">Edit</button>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="profile-stats-row">
        <div className="profile-stat-tile">
          <span className="profile-stat-tile-value">{recipes.length}</span>
          <span className="profile-stat-tile-label">Recipes</span>
        </div>
        <div className="profile-stat-tile">
          <span className="profile-stat-tile-value">{totalCooks}</span>
          <span className="profile-stat-tile-label">Cooks</span>
        </div>
        <div className="profile-stat-tile">
          <span className="profile-stat-tile-value">{collections.length}</span>
          <span className="profile-stat-tile-label">Collections</span>
        </div>
        <div className="profile-stat-tile">
          <span className="profile-stat-tile-value">{recipes.filter(r => r.is_public).length}</span>
          <span className="profile-stat-tile-label">Public</span>
        </div>
      </div>

      {/* Most cooked highlight */}
      {mostCooked && (
        <button
          onClick={() => onNavigate("recipe", mostCooked.id)}
          className="profile-highlight"
        >
          <div className="profile-highlight-body">
            <p className="profile-highlight-eyebrow">Most cooked</p>
            <p className="profile-highlight-title">{mostCooked.title}</p>
            <p className="profile-highlight-meta">Cooked {mostCooked.cook_count}× · tap to open</p>
          </div>
          <span className="profile-highlight-arrow">→</span>
        </button>
      )}

      {/* Account tier */}
      <div className="profile-card">
        <p className="profile-card-label">Account</p>
        <div className="profile-tier-row">
          <span className={"profile-tier-badge profile-tier-" + tier}>
            {tier === "power" ? "⚡ Power" : tier === "starter" ? "🌱 Starter" : "🆓 Free"}
          </span>
          <span className="profile-credits">{used} / {limit} AI actions today</span>
        </div>
      </div>

      {/* Navigation links */}
      <div className="profile-card">
        <p className="profile-card-label">My Stuff</p>
        <button onClick={() => onNavigate("collections")} className="profile-nav-item">
          <span>📁 Collections</span>
          <span className="profile-nav-chevron">›</span>
        </button>
        <button onClick={() => onNavigate("history")} className="profile-nav-item">
          <span>📋 Cook History</span>
          <span className="profile-nav-chevron">›</span>
        </button>
      </div>

      {/* Sign out */}
      <button onClick={onSignOut} className="btn btn-outline btn-full profile-signout">Sign Out</button>
    </div>
  );
}
