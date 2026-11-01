import React, { useEffect, useState, useCallback } from "react";
import api from "../api/api";
import "../styles/browse.css";

const CATEGORY_OPTIONS = [
  { value: "", label: "All categories" },
  { value: "cooked_meal", label: "Cooked meal" },
  { value: "bakery", label: "Bakery" },
  { value: "produce", label: "Fresh produce" },
  { value: "packaged", label: "Packaged food" },
  { value: "other", label: "Other" },
];

const STATUS_LABEL = {
  available: "Available",
  claimed: "Claimed",
  expired: "Expired",
};

const BrowseSurplus = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claimingId, setClaimingId] = useState(null);
  const [filters, setFilters] = useState({ category: "", status: "available" });

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;
      const { data } = await api.get("/food", { params });
      setListings(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load listings right now.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleClaim = async (id) => {
    setClaimingId(id);
    try {
      await api.patch(`/food/${id}/claim`);
      fetchListings();
    } catch (err) {
      setError(err.response?.data?.message || "Could not claim this listing.");
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="page-container">
      <h1>Browse surplus food</h1>
      <p>Filter what's nearby and claim it before the pickup window closes.</p>

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
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="available">Available</option>
            <option value="claimed">Claimed</option>
            <option value="">All</option>
          </select>
        </div>
      </div>

      {error && <div className="form-error-banner">{error}</div>}

      {loading ? (
        <p>Loading listings...</p>
      ) : listings.length === 0 ? (
        <div className="empty-state card">
          <h3>Nothing here yet</h3>
          <p>No surplus food matches these filters right now. Check back soon.</p>
        </div>
      ) : (
        <div className="listing-grid">
          {listings.map((item) => (
            <div className="card listing-card" key={item._id}>
              <div className="listing-card-header">
                <h3>{item.foodName}</h3>
                <span className={`tag tag-${item.status}`}>{STATUS_LABEL[item.status]}</span>
              </div>
              <p className="listing-meta">
                {item.quantity} {item.unit} · {item.category.replace("_", " ")}
              </p>
              {item.description && <p>{item.description}</p>}
              <p className="listing-meta">
                Pickup: {new Date(item.pickupWindowStart).toLocaleString()} –{" "}
                {new Date(item.pickupWindowEnd).toLocaleTimeString()}
              </p>
              <p className="listing-meta">
                From: {item.provider?.organizationName || item.provider?.name || "Provider"}
              </p>
              {item.status === "available" && (
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => handleClaim(item._id)}
                  disabled={claimingId === item._id}
                >
                  {claimingId === item._id ? "Claiming..." : "Claim this"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseSurplus;
