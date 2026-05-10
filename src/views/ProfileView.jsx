import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function ProfileView({ session, onSignOut, onNavigate, recipes, collections }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session?.user?.id)
        .single();
      setProfile(data);
      setLoading(false);
    }
    loadProfile();
  }, [session]);

  const tier = profile?.tier || "starter";
  const used = profile?.ai_credits_used || 0;
  const limit = tier === "power" ? "∞" : tier === "starter" ? 5 : 0;

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">{session?.user?.email}</p>
        </div>
      </div>

      {/* Account tier */}
      <div className="profile-card">
        <p className="profile-card-label">Account</p>
        <div className="profile-tier-row">
          <span className={"profile-tier-badge profile-tier-" + tier}>{tier === "power" ? "⚡ Power" : tier === "starter" ? "🌱 Starter" : "🆓 Free"}</span>
          <span className="profile-credits">{used} / {limit} AI actions today</span>
        </div>
      </div>

      {/* My Library stats */}
      <div className="profile-card" style={{ marginTop: 12 }}>
        <p className="profile-card-label">My Library</p>
        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-value">{recipes.length}</span>
            <span className="profile-stat-label">Recipes</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{collections.length}</span>
            <span className="profile-stat-label">Collections</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{recipes.filter(r => r.is_public).length}</span>
            <span className="profile-stat-label">Public</span>
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <div className="profile-card" style={{ marginTop: 12 }}>
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
      <div style={{ marginTop: 24 }}>
        <button onClick={onSignOut} className="btn btn-outline btn-full">Sign Out</button>
      </div>
    </div>
  );
}
