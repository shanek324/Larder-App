import { useState, useEffect, useRef } from "react";
import { callClaude } from "../utils";

const SUGGESTIONS = [
  "Make this for 4 people",
  "Swap the cream for crème fraîche",
  "Make it spicier",
  "What can I substitute for the main protein?",
];

export default function AIChat({ recipe, onUpdate, checkCredits }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function send(text) {
    const userMsg = (text || input).trim();
    if (!userMsg || loading) return;
    if (checkCredits && !(await checkCredits())) return;
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
      const reply = await callClaude(newMessages.slice(-10), system);
      const updateMatch = reply.match(/<recipe_update>([\s\S]*?)<\/recipe_update>/);
      let displayReply = reply.replace(/<recipe_update>[\s\S]*?<\/recipe_update>/, "").trim();
      if (updateMatch) {
        try {
          const updated = JSON.parse(updateMatch[1].trim());
          onUpdate(updated);
          displayReply += "\n\n✅ Recipe updated!";
        } catch (e) {
          displayReply += "\n\n⚠️ Recipe update failed (couldn't parse changes).";
        }
      }
      setMessages([...newMessages, { role: "assistant", content: displayReply }]);
    } catch (e) {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, something went wrong." }]);
    }
    setLoading(false);
  }

  return (
    <div className="aichat">
      <div className="aichat-header">
        <div>
          <p className="aichat-header-title">✦ AI Recipe Assistant</p>
          <p className="aichat-header-subtitle">Ask me to adjust, swap ingredients, or change the method</p>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} className="aichat-clear">Clear</button>
        )}
      </div>

      <div className="aichat-messages">
        {messages.length === 0 && (
          <div className="aichat-suggestions">
            <p className="aichat-suggestions-label">Try asking:</p>
            <div className="aichat-suggestions-list">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} className="aichat-suggestion">{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={"aichat-msg" + (m.role === "user" ? " aichat-msg-user" : " aichat-msg-assistant")}>
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="aichat-msg aichat-msg-assistant aichat-thinking">Thinking…</div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="aichat-input-row">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask something about this recipe..."
          className="input aichat-input"
        />
        <button onClick={() => send()} disabled={loading} className="btn btn-gold aichat-send">
          Send
        </button>
      </div>
    </div>
  );
}
