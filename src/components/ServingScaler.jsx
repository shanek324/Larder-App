export default function ServingScaler({ baseServings, value, onChange }) {
  const steps = [1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24];
  const allSteps = [...new Set([...steps, baseServings, value])].sort((a, b) => a - b);

  return (
    <div style={{ background: "#fdf6e8", border: "1px solid #e8d5a0", borderRadius: 12, padding: "14px 18px", marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#5c4a2a" }}>⚖️ Scale Recipe</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9e8a73" }}>Base: {baseServings} servings</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => { const idx = allSteps.indexOf(value); if (idx > 0) onChange(allSteps[idx - 1]); }} style={{ width: 30, height: 30, borderRadius: "50%", border: "1.5px solid #c8a96e", background: "#fffdf8", color: "#c8a96e", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>−</button>
        <div style={{ flex: 1, display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center" }}>
          {[1, 2, 3, 4, 6, 8, 12].map(n => (
            <button key={n} onClick={() => onChange(n)} style={{ padding: "4px 10px", borderRadius: 20, border: "1.5px solid", borderColor: value === n ? "#c8a96e" : "#ddd5c8", background: value === n ? "#c8a96e" : "#fffdf8", color: value === n ? "#fff" : "#7a6651", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, transition: "all 0.15s ease" }}>{n}</button>
          ))}
        </div>
        <button onClick={() => { const idx = allSteps.indexOf(value); if (idx < allSteps.length - 1) onChange(allSteps[idx + 1]); else onChange(value + 1); }} style={{ width: 30, height: 30, borderRadius: "50%", border: "1.5px solid #c8a96e", background: "#fffdf8", color: "#c8a96e", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>+</button>
      </div>
      {value !== baseServings && (
        <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9e8a73" }}>Showing for <strong style={{ color: "#c8a96e" }}>{value} servings</strong> (×{(value / baseServings).toFixed(2).replace(/\.?0+$/, "")})</span>
          <button onClick={() => onChange(baseServings)} style={{ background: "none", border: "none", color: "#c8a96e", fontFamily: "'DM Sans', sans-serif", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Reset</button>
        </div>
      )}
    </div>
  );
}
