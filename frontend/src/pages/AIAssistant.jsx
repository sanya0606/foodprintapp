import React, { useEffect, useRef, useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import "../styles/ai.css";

const PROMPTS = {
  provider: ["How much should I prepare?", "Which food gets wasted most?", "How much have I saved?"],
  ngo: ["What's available now?", "How much have I claimed?"],
  student: ["What's available now?", "How much have I claimed?"],
  admin: ["How much waste is there overall?", "What is the claim rate?"],
};

const AIAssistant = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState(null);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! Ask me about your food data, waste, or how much to prepare." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get("/ai/insights").then(({ data }) => setInsights(data)).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    const history = messages.slice(1);
    setMessages((m) => [...m, { role: "user", text: message }]);
    setInput("");
    setSending(true);
    try {
      const { data } = await api.post("/ai/chat", { message, history });
      setMessages((m) => [...m, { role: "assistant", text: data.reply, source: data.source }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", text: err.response?.data?.message || "Sorry, something went wrong." }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page-container">
      <h1>AI assistant</h1>
      <p>Ask questions about your data. Predictions and tips are generated from your own listing history.</p>

      {insights && insights.predictions.length > 0 && (
        <div className="ai-insights">
          {insights.predictions.map((p) => (
            <div className="card ai-insight" key={p.category}>
              <span className="ai-insight-cat">{p.category.replace("_", " ")}</span>
              <div className="ai-insight-num">{p.wasteRate}%</div>
              <div className="ai-insight-sub">unclaimed, about {p.avgSurplus} surplus per listing</div>
              {p.suggestedCut > 0 && <div className="ai-insight-tip">Prepare ~{p.suggestedCut} fewer</div>}
            </div>
          ))}
        </div>
      )}

      <div className="card ai-chat">
        <div className="ai-messages">
          {messages.map((m, i) => (
            <div key={i} className={`ai-msg ai-msg-${m.role}`}>
              {m.text}
              {m.source && <span className="ai-source">{m.source === "gemini" ? "Gemini" : "rule-based"}</span>}
            </div>
          ))}
          {sending && <div className="ai-msg ai-msg-assistant">Thinking...</div>}
          <div ref={bottomRef} />
        </div>

        <div className="ai-prompts">
          {(PROMPTS[user.role] || []).map((p) => (
            <button key={p} className="ai-chip" onClick={() => send(p)} disabled={sending}>{p}</button>
          ))}
        </div>

        <form className="ai-form" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask something..." maxLength={500} />
          <button className="btn btn-primary" disabled={sending || !input.trim()}>Send</button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;
