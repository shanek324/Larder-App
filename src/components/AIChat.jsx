import { useState, useEffect, useRef } from "react";
import { callClaude } from "../utils";

export default function AIChat({ recipe, onUpdate }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    const system = `You are a culinary assistant helping the user with a recipe. The current recipe is:
Title: ${recipe.title}
Servings: ${recipe.servings}
Ingredients: ${recipe.ingredients.map(i => `${i.amount} ${i.name}`).join(", ")}
Method: ${recipe.method.join(" | ")}
Notes: ${recipe.notes || "None"}

When the user asks to modify the recipe, respond with explanation AND:
<recipe_update>
{"title":"...","description":"...","servings":N,"prepTime":"...","cookTime":"...","ingredients":[{"name":"...","amount":"..."}],"method":["..."],"notes":"...","tags":["..."]}
</recipe_update>

If just a question, reply normally. Be concise. Use metric/Irish measurements.`;

    try {
      const reply = await callClaude(newMessages, system);
      const updateMatch = reply.match(/<recipe_update>([\s\S]*?)<\/recipe_update>/);
      let displayReply = reply.replace(/<recipe_update>[\s\S]*?<\/recipe_update>/, "").trim();
      if (updateMatch) {
        try {
          const updated = JSON.parse(updateMatch[1].trim());
          onUpdate(updated);
          displayReply += "\n\n✅ Recipe updated!";
        } catch (e) {}
      }
      setMessages([...newMessages, { role: "assistant", content: displayReply }]);
    } catch (e) {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, something went wrong." }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#faf7f2", borderRadius: 12, border: "1.5px solid #e8e0d5", overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #e8e0d5", background: "#fffdf8" }}>
        <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#5c4a2a" }}>✦ AI Recipe Assistant</p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9e8a73", fontFamily: "'DM Sans', sans-serif" }}>Ask me to adjust servings, swap ingredients, or change the method</p>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#b5a48e", fontSize: 13, marginTop: 20, fontFamily: "'DM Sans', sans-serif", fontStyle: "italic" }}>
            Try: "Make this for 4 people" or "Swap the cream for crème fraîche"
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%", background: m.role === "user" ? "#c8a96e" : "#fff", color: m.role === "user" ? "#fff" : "#3a2e22", padding: "10px 14px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, border: m.role === "assistant" ? "1px solid #e8e0d5" : "none", whiteSpace: "pre-wrap" }}>
            {m.content}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", background: "#fff", border: "1px solid #e8e0d5", padding: "10px 14px", borderRadius: "4px 16px 16px 16px", fontSize: 13, color: "#9e8a73", fontFamily: "'DM Sans', sans-serif" }}>
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "12px 16px", borderTop: "1px solid #e8e0d5", display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask something about this recipe..."
          style={{ flex: 1, padding: "9px 14px", border: "1.5px solid #ddd5c8", borderRadius: 24, fontFamily: "'DM Sans', sans-serif", fontSize: 13, background: "#fffdf8", outline: "none", color: "#3a2e22" }}
        />
        <button onClick={send} disabled={loading} style={{ background: "#c8a96e", color: "#fff", border: "none", borderRadius: 24, padding: "9px 18px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, opacity: loading ? 0.6 : 1 }}>
          Send
        </button>
      </div>
    </div>
  );
}
