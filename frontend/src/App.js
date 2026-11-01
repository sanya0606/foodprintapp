import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UploadSurplus from "./pages/UploadSurplus";
import BrowseSurplus from "./pages/BrowseSurplus";
import Analytics from "./pages/Analytics";
import Admin from "./pages/Admin";
import MyListings from "./pages/MyListings";
import MyClaims from "./pages/MyClaims";
import AIAssistant from "./pages/AIAssistant";

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute roles={["provider", "admin"]}>
              <UploadSurplus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-listings"
          element={
            <ProtectedRoute roles={["provider", "admin"]}>
              <MyListings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-claims"
          element={
            <ProtectedRoute roles={["ngo", "student", "admin"]}>
              <MyClaims />
            </ProtectedRoute>
          }
        />
        <Route
          path="/browse"
          element={
            <ProtectedRoute roles={["ngo", "student", "admin"]}>
              <BrowseSurplus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assistant"
          element={
            <ProtectedRoute>
              <AIAssistant />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
