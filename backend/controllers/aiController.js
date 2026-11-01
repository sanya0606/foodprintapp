const FoodListing = require("../models/FoodListing");
const { summarize, predictByCategory, buildRecommendations, ruleBasedReply } = require("../services/insights");

// Collect the data the assistant is allowed to see, based on the user's role
async function buildContext(user, filters = {}) {
  await FoodListing.updateMany(
    { status: "available", pickupWindowEnd: { $lt: new Date() } },
    { $set: { status: "expired" } }
  );

  const query = {};
  if (user.role === "provider") query.provider = user._id;
  if (user.role === "ngo" || user.role === "student") query.claimedBy = user._id;
  if (filters.category) query.category = filters.category;
  if (filters.from || filters.to) {
    query.pickupWindowStart = {};
    if (filters.from) query.pickupWindowStart.$gte = new Date(filters.from);
    if (filters.to) query.pickupWindowStart.$lte = new Date(filters.to);
  }

  const listings = await FoodListing.find(query).lean();
  const predictions = predictByCategory(listings);
  const ctx = {
    role: user.role,
    summary: summarize(listings),
    predictions,
    recommendations: buildRecommendations(predictions),
  };

  if (user.role !== "provider") {
    const open = await FoodListing.find({ status: "available" }).populate("provider", "organizationName name").limit(10).lean();
    ctx.available = open.map((l) => ({
      foodName: l.foodName, quantity: l.quantity, unit: l.unit, category: l.category,
      provider: l.provider?.organizationName || l.provider?.name, pickupEnds: l.pickupWindowEnd,
    }));
  }
  return ctx;
}

// Ask Gemini. Returns null if no key is set or the call fails, so callers can fall back to rules.
async function askGemini(system, history, message) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const contents = [
    ...history.map((h) => ({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: String(h.text) }] })),
    { role: "user", parts: [{ text: message }] },
  ];
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents }),
    });
    if (!res.ok) throw new Error(`Gemini returned ${res.status}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || null;
  } catch (err) {
    console.error("Gemini call failed:", err.message);
    return null;
  }
}

const systemPrompt = (ctx) =>
  "You are FoodPrint's assistant, helping reduce food waste. Answer briefly (under 120 words) using ONLY the data below. " +
  "If the data doesn't answer the question, say so. The user's role is " + ctx.role + ".\nDATA:\n" + JSON.stringify(ctx);

// @route GET /api/ai/insights   (rule-based predictions, no LLM needed)
const getInsights = async (req, res) => {
  try {
    const ctx = await buildContext(req.user);
    res.json({ summary: ctx.summary, predictions: ctx.predictions, recommendations: ctx.recommendations });
  } catch (error) {
    res.status(500).json({ message: "Could not build insights", error: error.message });
  }
};

// @route POST /api/ai/chat   body: { message, history? }
const chat = async (req, res) => {
  try {
    const message = String(req.body.message || "").trim().slice(0, 500);
    if (!message) return res.status(400).json({ message: "Message is required" });
    const history = (Array.isArray(req.body.history) ? req.body.history : []).slice(-6)
      .filter((h) => h && ["user", "assistant"].includes(h.role) && h.text);

    const ctx = await buildContext(req.user);
    const llm = await askGemini(systemPrompt(ctx), history, message);
    res.json({ reply: llm || ruleBasedReply(message, ctx), source: llm ? "gemini" : "rules" });
  } catch (error) {
    res.status(500).json({ message: "Assistant failed", error: error.message });
  }
};

// @route POST /api/ai/analyze   body: { category?, from?, to? }  -> explains the filtered analytics
const analyze = async (req, res) => {
  try {
    const ctx = await buildContext(req.user, req.body || {});
    const ask = "Explain these filtered analytics in 3 short sentences and give one action to reduce waste.";
    const llm = await askGemini(systemPrompt(ctx), [], ask);
    const s = ctx.summary;
    const fallback = `Across ${s.total} listings, ${s.claimed} were claimed (${s.claimRate}%) and ${s.expired} expired. ` +
      (ctx.recommendations[0] || "");
    res.json({ analysis: llm || fallback, source: llm ? "gemini" : "rules", summary: s });
  } catch (error) {
    res.status(500).json({ message: "Analysis failed", error: error.message });
  }
};

module.exports = { getInsights, chat, analyze };
