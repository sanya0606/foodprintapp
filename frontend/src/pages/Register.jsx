import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_OPTIONS = [
  { value: "provider", label: "Restaurant / Canteen (I have surplus food)" },
  { value: "ngo", label: "NGO (I collect food for distribution)" },
  { value: "student", label: "Student (I want surplus food alerts)" },
];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "provider",
    organizationName: "",
    location: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.email.trim()) {
      next.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      next.email = "Enter a valid email address";
    }
    if (!form.password) {
      next.password = "Password is required";
    } else if (form.password.length < 6) {
      next.password = "Password must be at least 6 characters";
    }
    if (form.confirmPassword !== form.password) {
      next.confirmPassword = "Passwords do not match";
    }
    if (form.role === "provider" && !form.organizationName.trim()) {
      next.organizationName = "Restaurant / canteen name is required";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { confirmPassword, ...payload } = form;
      await register(payload);
      navigate("/dashboard");
    } catch (err) {
      setServerError(err.response?.data?.message || "Could not create account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container page-container--narrow">
      <h1>Create your account</h1>
      <p>Join FoodPrint as a food provider, an NGO, or a student volunteer.</p>

      <div className="card">
        {serverError && <div className="form-error-banner">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="role">I am signing up as</label>
            <select id="role" name="role" value={form.role} onChange={handleChange}>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Jane Doe" />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>

          {form.role === "provider" && (
            <div className="field">
              <label htmlFor="organizationName">Restaurant / canteen name</label>
              <input
                id="organizationName"
                name="organizationName"
                value={form.organizationName}
                onChange={handleChange}
                placeholder="Green Leaf Canteen"
              />
              {errors.organizationName && <div className="field-error">{errors.organizationName}</div>}
            </div>
          )}

          {form.role === "ngo" && (
            <div className="field">
              <label htmlFor="organizationName">NGO name</label>
              <input
                id="organizationName"
                name="organizationName"
                value={form.organizationName}
                onChange={handleChange}
                placeholder="Helping Hands Foundation"
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="location">Location / area</label>
            <input
              id="location"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="City / neighbourhood"
            />
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
              />
              {errors.password && <div className="field-error">{errors.password}</div>}
            </div>
            <div className="field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && <div className="field-error">{errors.confirmPassword}</div>}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>

      <p style={{ marginTop: "1rem" }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
};

export default Register;
