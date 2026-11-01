import React, { useEffect, useState, useCallback } from "react";
import api from "../api/api";
import "../styles/analytics.css";
import "../styles/ai.css";

const CATEGORY_OPTIONS = [
  { value: "", label: "All categories" },
  { value: "cooked_meal", label: "Cooked meal" },
  { value: "bakery", label: "Bakery" },
  { value: "produce", label: "Fresh produce" },
  { value: "packaged", label: "Packaged food" },
  { value: "other", label: "Other" },
];

const EMPTY_STATS = {
  kpis: { totalListings: 0, available: 0, claimed: 0, expired: 0, savedQuantity: 0, completionRate: 0 },
  byCategory: [],
  overTime: [],
};

const Analytics = () => {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ category: "", from: "", to: "" });
  const [analysis, setAnalysis] = useState(null);
  const [explaining, setExplaining] = useState(false);

  const explain = async () => {
    setExplaining(true);
    try {
      const { data } = await api.post("/ai/analyze", filters);
      setAnalysis(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate the AI summary.");
    } finally {
      setExplaining(false);
    }
  };

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const { data } = await api.get("/food/stats", { params });
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load analytics data.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const kpis = {
    total: stats.kpis.totalListings,
    claimed: stats.kpis.claimed,
    expired: stats.kpis.expired,
    savedQty: stats.kpis.savedQuantity,
    completionRate: stats.kpis.completionRate,
  };

  const maxCount = Math.max(1, ...stats.byCategory.map((r) => r.count));
  const byCategory = stats.byCategory.map((r) => ({
    category: r.category.replace("_", " "),
    count: r.count,
    pct: Math.round((r.count / maxCount) * 100),
  }));

  return (
    <div className="page-container">
      <h1>Analytics dashboard</h1>
      <p>Filter FoodPrint activity by category or date range to see trends and impact.</p>

      <div className="card browse-filters">
        <div className="field">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="from">From</label>
          <input
            id="from"
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="to">To</label>
          <input
            id="to"
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          />
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <button className="btn btn-secondary" onClick={explain} disabled={explaining}>
          {explaining ? "Analysing..." : "Explain these numbers with AI"}
        </button>
      </div>
      {analysis && (
        <div className="card ai-analysis">
          <h3>AI insight ({analysis.source === "gemini" ? "Gemini" : "rule-based"})</h3>
          <p>{analysis.analysis}</p>
        </div>
      )}

      {error && <div className="form-error-banner">{error}</div>}

      <div className="kpi-grid">
        <div className="card kpi-card">
          <span className="kpi-label">Total listings</span>
          <span className="kpi-value">{kpis.total}</span>
        </div>
        <div className="card kpi-card">
          <span className="kpi-label">Food saved (claimed)</span>
          <span className="kpi-value">{kpis.savedQty}</span>
        </div>
        <div className="card kpi-card">
          <span className="kpi-label">Goal-completion rate</span>
          <span className="kpi-value">{kpis.completionRate}%</span>
        </div>
        <div className="card kpi-card">
          <span className="kpi-label">Expired (unclaimed)</span>
          <span className="kpi-value kpi-value-warn">{kpis.expired}</span>
        </div>
      </div>

      <div className="card chart-card">
        <h3>Listings by category</h3>
        {loading ? (
          <p>Loading chart...</p>
        ) : byCategory.length === 0 ? (
          <p className="listing-meta">No data for the selected filters.</p>
        ) : (
          <div className="bar-chart">
            {byCategory.map((row) => (
              <div className="bar-row" key={row.category}>
                <span className="bar-label">{row.category}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${row.pct}%` }} />
                </div>
                <span className="bar-count">{row.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
