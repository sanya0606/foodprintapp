import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import "../styles/admin.css";

const MyClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/food/claims/mine");
        setClaims(data);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load your claims.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="page-container">
      <h1>My claims</h1>
      <p>Surplus food you've claimed, with pickup details.</p>

      {error && <div className="form-error-banner">{error}</div>}

      <div className="card">
        {loading ? (
          <p>Loading...</p>
        ) : claims.length === 0 ? (
          <div className="empty-state">
            <h3>Nothing claimed yet</h3>
            <p>
              <Link to="/browse">Browse available surplus</Link> to claim your first one.
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Quantity</th>
                  <th>From</th>
                  <th>Pickup window</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div className="cell-strong">{c.foodName}</div>
                      <div className="cell-sub">{c.category.replace("_", " ")}</div>
                    </td>
                    <td>{c.quantity} {c.unit}</td>
                    <td>
                      <div>{c.provider?.organizationName || c.provider?.name}</div>
                      <div className="cell-sub">{c.provider?.location}</div>
                    </td>
                    <td>
                      {new Date(c.pickupWindowStart).toLocaleString()} –{" "}
                      {new Date(c.pickupWindowEnd).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyClaims;
