import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/dashboard.css";

const providerActions = [
  { to: "/upload", label: "Log surplus food", desc: "Tell nearby NGOs and students what's ready for pickup." },
  { to: "/analytics", label: "View your waste trends", desc: "See how much you've saved and where wastage still happens." },
];

const recipientActions = [
  { to: "/browse", label: "Browse available surplus", desc: "Find food listed nearby and claim it before it expires." },
  { to: "/analytics", label: "See community impact", desc: "Track how much food has been redirected so far." },
];

const Dashboard = () => {
  const { user } = useAuth();
  const isProvider = user.role === "provider" || user.role === "admin";
  const actions = isProvider ? providerActions : recipientActions;

  return (
    <div className="page-container">
      <section className="hero-stat">
        <div>
          <p className="hero-stat-label">Welcome back, {user.name.split(" ")[0]}</p>
          <h1 className="hero-stat-number">128 kg</h1>
          <p className="hero-stat-caption">of food redirected through FoodPrint so far this month</p>
        </div>
      </section>

      <div className="dashboard-grid">
        {actions.map((action) => (
          <Link to={action.to} className="card dashboard-card" key={action.to}>
            <h3>{action.label}</h3>
            <p>{action.desc}</p>
            <span className="dashboard-card-link">Go →</span>
          </Link>
        ))}
        <Link to="/analytics" className="card dashboard-card">
          <h3>Analytics dashboard</h3>
          <p>Filter activity by date, category, or provider and view charts and KPIs.</p>
          <span className="dashboard-card-link">Go →</span>
        </Link>
        {user.role === "admin" && (
          <Link to="/admin" className="card dashboard-card">
            <h3>Admin panel</h3>
            <p>Manage registered restaurants, NGOs, and user accounts.</p>
            <span className="dashboard-card-link">Go →</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
