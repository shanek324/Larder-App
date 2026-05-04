export default function ServingScaler({ baseServings, value, onChange }) {
  const steps = [1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24];
  const allSteps = [...new Set([...steps, baseServings, value])].sort((a, b) => a - b);
  const quickSteps = [1, 2, 3, 4, 6, 8, 12];

  function decrement() {
    const idx = allSteps.indexOf(value);
    if (idx > 0) onChange(allSteps[idx - 1]);
  }

  function increment() {
    const idx = allSteps.indexOf(value);
    if (idx < allSteps.length - 1) onChange(allSteps[idx + 1]);
    else onChange(value + 1);
  }

  return (
    <div className="scaler">
      <div className="scaler-header">
        <span className="scaler-label">⚖️ Scale Recipe</span>
        <span className="scaler-base">Base: {baseServings} servings</span>
      </div>
      <div className="scaler-controls">
        <button onClick={decrement} className="scaler-step-btn">−</button>
        <div className="scaler-quick">
          {quickSteps.map(n => (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={"scaler-quick-btn" + (value === n ? " active" : "")}
            >{n}</button>
          ))}
        </div>
        <button onClick={increment} className="scaler-step-btn">+</button>
      </div>
      {value !== baseServings && (
        <div className="scaler-footer">
          <span className="scaler-footer-text">
            Showing for <strong className="scaler-footer-value">{value} servings</strong> (×{(value / baseServings).toFixed(2).replace(/\.?0+$/, "")})
          </span>
          <button onClick={() => onChange(baseServings)} className="scaler-reset">Reset</button>
        </div>
      )}
    </div>
  );
}
