import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const Landing = () => {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="page-container">
      <section className="hero-stat">
        <p className="hero-stat-label">FoodPrint</p>
        <h1 className="hero-stat-number">Surplus food, redirected.</h1>
        <p className="hero-stat-caption">
          Restaurants, hostels, and canteens list what's left over. Nearby NGOs and students get
          notified and claim it before it's wasted.
        </p>
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
          <Link to="/register" className="btn btn-primary">
            Get started
          </Link>
          <Link to="/login" className="btn btn-secondary" style={{ borderColor: "#fff", color: "#fff" }}>
            Log in
          </Link>
        </div>
      </section>

      <div className="dashboard-grid">
        <div className="card">
          <h3>For providers</h3>
          <p>Log surplus food in seconds and see AI-assisted predictions of how much to prepare next time.</p>
        </div>
        <div className="card">
          <h3>For NGOs &amp; students</h3>
          <p>Get notified the moment surplus food is listed nearby, and claim it before the pickup window closes.</p>
        </div>
        <div className="card">
          <h3>For everyone</h3>
          <p>Track collective impact through a shared analytics dashboard of food saved over time.</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
