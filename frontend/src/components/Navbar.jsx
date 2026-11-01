import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          FoodPrint
        </Link>

        {user && (
          <nav className="navbar-links">
            <NavLink to="/dashboard" className="navbar-link">
              Dashboard
            </NavLink>
            {user.role === "provider" && (
              <>
                <NavLink to="/upload" className="navbar-link">
                  Log Surplus Food
                </NavLink>
                <NavLink to="/my-listings" className="navbar-link">
                  My Listings
                </NavLink>
              </>
            )}
            {(user.role === "ngo" || user.role === "student") && (
              <>
                <NavLink to="/browse" className="navbar-link">
                  Browse Surplus
                </NavLink>
                <NavLink to="/my-claims" className="navbar-link">
                  My Claims
                </NavLink>
              </>
            )}
            <NavLink to="/analytics" className="navbar-link">
              Analytics
            </NavLink>
            <NavLink to="/assistant" className="navbar-link">
              AI Assistant
            </NavLink>
            {user.role === "admin" && (
              <NavLink to="/admin" className="navbar-link">
                Admin
              </NavLink>
            )}
          </nav>
        )}

        <div className="navbar-actions">
          {user ? (
            <>
              <span className="navbar-user">Hi, {user.name.split(" ")[0]}</span>
              <button className="btn btn-secondary" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
