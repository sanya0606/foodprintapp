// Rule-based "AI" analytics: turns listing history into predictions and recommendations.
// Pure functions (no database calls) so they are easy to test and explain.

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Summary numbers for any list of listings
function summarize(listings) {
  const s = { total: listings.length, available: 0, claimed: 0, expired: 0, savedQty: 0, wastedQty: 0 };
  listings.forEach((l) => {
    s[l.status] += 1;
    if (l.status === "claimed") s.savedQty += l.quantity;
    if (l.status === "expired") s.wastedQty += l.quantity;
  });
  s.claimRate = s.total ? Math.round((s.claimed / s.total) * 100) : 0;
  return s;
}

// Per-category prediction for a provider: how much surplus to expect and how much to cut.
function predictByCategory(listings) {
  const groups = {};
  listings.forEach((l) => {
    groups[l.category] = groups[l.category] || [];
    groups[l.category].push(l);
  });

  return Object.entries(groups).map(([category, items]) => {
    const totalQty = items.reduce((sum, l) => sum + l.quantity, 0);
    const wastedQty = items.filter((l) => l.status === "expired").reduce((sum, l) => sum + l.quantity, 0);
    const avgSurplus = Math.round(totalQty / items.length);
    const wasteRate = totalQty ? Math.round((wastedQty / totalQty) * 100) : 0;

    // Busiest weekday for surplus in this category
    const byDay = {};
    items.forEach((l) => {
      const d = new Date(l.createdAt || l.pickupWindowStart).getDay();
      byDay[d] = (byDay[d] || 0) + l.quantity;
    });
    const topDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];

    return {
      category,
      listings: items.length,
      avgSurplus,                                   // expected surplus per listing
      wasteRate,                                    // % of surplus nobody claimed
      topDay: topDay ? DAYS[topDay[0]] : null,
      // Recommendation: prepare less by the share that tends to go to waste
      suggestedCut: Math.round((avgSurplus * wasteRate) / 100),
    };
  }).sort((a, b) => b.wasteRate - a.wasteRate);
}

// Plain-English recommendations built from the predictions
function buildRecommendations(predictions) {
  if (!predictions.length) return ["Log a few surplus listings so FoodPrint can start predicting demand."];
  return predictions.map((p) => {
    const unit = p.category.replace("_", " ");
    if (p.wasteRate >= 30) {
      return `High waste for ${unit} (${p.wasteRate}% unclaimed). Prepare about ${p.suggestedCut} fewer units per batch.`;
    }
    if (p.wasteRate > 0) {
      return `${unit}: ${p.wasteRate}% went unclaimed. Small trim of about ${p.suggestedCut} units is enough.`;
    }
    return `${unit}: everything was claimed. Current quantities (about ${p.avgSurplus} per listing) look right.`;
  });
}

// Used when no LLM key is configured: answers common questions from the same data
function ruleBasedReply(message, ctx) {
  const m = message.toLowerCase();
  const s = ctx.summary;
  if (/(waste|expire|unclaimed)/.test(m)) {
    return `${s.expired} of ${s.total} listings expired unclaimed (${s.wastedQty} units wasted). ` +
      (ctx.recommendations[0] || "");
  }
  if (/(prepare|cook|how much|quantity|reduce|cut|predict)/.test(m)) {
    return ctx.recommendations.join(" ");
  }
  if (/(saved|impact|claimed|success)/.test(m)) {
    return `${s.claimed} listings were claimed, saving ${s.savedQty} units. Claim rate is ${s.claimRate}%.`;
  }
  if (/(available|now|claim|find)/.test(m) && ctx.available) {
    return ctx.available.length
      ? "Available now: " + ctx.available.map((l) => `${l.foodName} (${l.quantity} ${l.unit}, ${l.provider})`).join("; ")
      : "Nothing is available right now. Check back soon.";
  }
  return `Overview: ${s.total} listings, ${s.claimed} claimed (${s.claimRate}%), ${s.expired} expired. ` +
    "Ask me about waste, how much to prepare, food saved, or what's available.";
}

module.exports = { summarize, predictByCategory, buildRecommendations, ruleBasedReply };
