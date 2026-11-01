import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const CATEGORY_OPTIONS = [
  { value: "cooked_meal", label: "Cooked meal" },
  { value: "bakery", label: "Bakery" },
  { value: "produce", label: "Fresh produce" },
  { value: "packaged", label: "Packaged food" },
  { value: "other", label: "Other" },
];

const UNIT_OPTIONS = ["servings", "kg", "plates", "packets"];

const initialForm = {
  foodName: "",
  category: "cooked_meal",
  quantity: "",
  unit: "servings",
  description: "",
  pickupWindowStart: "",
  pickupWindowEnd: "",
};

const UploadSurplus = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next = {};
    if (!form.foodName.trim()) next.foodName = "Food name is required";
    if (!form.quantity || Number(form.quantity) <= 0) next.quantity = "Enter a quantity greater than 0";
    if (!form.pickupWindowStart) next.pickupWindowStart = "Pickup start time is required";
    if (!form.pickupWindowEnd) next.pickupWindowEnd = "Pickup end time is required";
    if (
      form.pickupWindowStart &&
      form.pickupWindowEnd &&
      new Date(form.pickupWindowEnd) <= new Date(form.pickupWindowStart)
    ) {
      next.pickupWindowEnd = "Pickup end must be after pickup start";
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
    setSuccess("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await api.post("/food", { ...form, quantity: Number(form.quantity) });
      setSuccess("Listing published. Nearby NGOs and students will be notified.");
      setForm(initialForm);
      setTimeout(() => navigate("/browse"), 1200);
    } catch (err) {
      setServerError(err.response?.data?.message || "Could not publish this listing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container page-container--narrow">
      <h1>Log surplus food</h1>
      <p>Share what's left over so it can be picked up before it goes to waste.</p>

      <div className="card">
        {serverError && <div className="form-error-banner">{serverError}</div>}
        {success && <div className="form-success-banner">{success}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="foodName">Food name</label>
            <input
              id="foodName"
              name="foodName"
              value={form.foodName}
              onChange={handleChange}
              placeholder="e.g. Vegetable pulao"
            />
            {errors.foodName && <div className="field-error">{errors.foodName}</div>}
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="category">Category</label>
              <select id="category" name="category" value={form.category} onChange={handleChange}>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="unit">Unit</label>
              <select id="unit" name="unit" value={form.unit} onChange={handleChange}>
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="quantity">Quantity</label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="0"
              value={form.quantity}
              onChange={handleChange}
              placeholder="e.g. 20"
            />
            {errors.quantity && <div className="field-error">{errors.quantity}</div>}
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="pickupWindowStart">Pickup window start</label>
              <input
                id="pickupWindowStart"
                name="pickupWindowStart"
                type="datetime-local"
                value={form.pickupWindowStart}
                onChange={handleChange}
              />
              {errors.pickupWindowStart && <div className="field-error">{errors.pickupWindowStart}</div>}
            </div>
            <div className="field">
              <label htmlFor="pickupWindowEnd">Pickup window end</label>
              <input
                id="pickupWindowEnd"
                name="pickupWindowEnd"
                type="datetime-local"
                value={form.pickupWindowEnd}
                onChange={handleChange}
              />
              {errors.pickupWindowEnd && <div className="field-error">{errors.pickupWindowEnd}</div>}
            </div>
          </div>

          <div className="field">
            <label htmlFor="description">Notes (optional)</label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={form.description}
              onChange={handleChange}
              placeholder="Allergens, packaging details, entrance to use, etc."
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Publishing..." : "Publish listing"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadSurplus;
