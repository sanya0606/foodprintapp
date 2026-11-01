import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import "../styles/admin.css";

const CATEGORY_OPTIONS = [
  { value: "cooked_meal", label: "Cooked meal" },
  { value: "bakery", label: "Bakery" },
  { value: "produce", label: "Fresh produce" },
  { value: "packaged", label: "Packaged food" },
  { value: "other", label: "Other" },
];
const UNIT_OPTIONS = ["servings", "kg", "plates", "packets"];

// datetime-local inputs need "YYYY-MM-DDTHH:mm" in local time
const toLocalInput = (iso) => {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // listing being edited
  const [form, setForm] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/food/mine");
      setListings(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const startEdit = (item) => {
    setEditing(item);
    setFormErrors({});
    setForm({
      foodName: item.foodName,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      description: item.description || "",
      pickupWindowStart: toLocalInput(item.pickupWindowStart),
      pickupWindowEnd: toLocalInput(item.pickupWindowEnd),
    });
  };

  const validate = () => {
    const next = {};
    if (!form.foodName.trim()) next.foodName = "Food name is required";
    if (!form.quantity || Number(form.quantity) <= 0) next.quantity = "Enter a quantity greater than 0";
    if (new Date(form.pickupWindowEnd) <= new Date(form.pickupWindowStart)) {
      next.pickupWindowEnd = "Pickup end must be after pickup start";
    }
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await api.put(`/food/${editing._id}`, { ...form, quantity: Number(form.quantity) });
      setEditing(null);
      await fetchListings();
    } catch (err) {
      setFormErrors({ server: err.response?.data?.message || "Could not save changes." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Remove "${item.foodName}"?`)) return;
    try {
      await api.delete(`/food/${item._id}`);
      await fetchListings();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete listing.");
    }
  };

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="page-container">
      <h1>My listings</h1>
      <p>Everything you've published. Edit a listing while it's still available, or remove it.</p>

      {error && <div className="form-error-banner">{error}</div>}

      {editing && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h3>Edit listing</h3>
          {formErrors.server && <div className="form-error-banner">{formErrors.server}</div>}
          <form onSubmit={handleSave} noValidate>
            <div className="field">
              <label htmlFor="foodName">Food name</label>
              <input id="foodName" name="foodName" value={form.foodName} onChange={change} />
              {formErrors.foodName && <div className="field-error">{formErrors.foodName}</div>}
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="category">Category</label>
                <select id="category" name="category" value={form.category} onChange={change}>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="unit">Unit</label>
                <select id="unit" name="unit" value={form.unit} onChange={change}>
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="quantity">Quantity</label>
              <input id="quantity" name="quantity" type="number" min="0" value={form.quantity} onChange={change} />
              {formErrors.quantity && <div className="field-error">{formErrors.quantity}</div>}
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="pickupWindowStart">Pickup start</label>
                <input id="pickupWindowStart" name="pickupWindowStart" type="datetime-local" value={form.pickupWindowStart} onChange={change} />
              </div>
              <div className="field">
                <label htmlFor="pickupWindowEnd">Pickup end</label>
                <input id="pickupWindowEnd" name="pickupWindowEnd" type="datetime-local" value={form.pickupWindowEnd} onChange={change} />
                {formErrors.pickupWindowEnd && <div className="field-error">{formErrors.pickupWindowEnd}</div>}
              </div>
            </div>
            <div className="field">
              <label htmlFor="description">Notes</label>
              <textarea id="description" name="description" rows="2" value={form.description} onChange={change} />
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <p>Loading...</p>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <h3>No listings yet</h3>
            <p>
              <Link to="/upload">Log your first surplus food</Link> to get started.
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Quantity</th>
                  <th>Pickup window</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {listings.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="cell-strong">{item.foodName}</div>
                      <div className="cell-sub">{item.category.replace("_", " ")}</div>
                    </td>
                    <td>{item.quantity} {item.unit}</td>
                    <td>
                      <div>{new Date(item.pickupWindowStart).toLocaleString()}</div>
                      <div className="cell-sub">until {new Date(item.pickupWindowEnd).toLocaleTimeString()}</div>
                    </td>
                    <td>
                      <span className={`tag tag-${item.status}`}>{item.status}</span>
                      {item.claimedBy && (
                        <div className="cell-sub">by {item.claimedBy.organizationName || item.claimedBy.name}</div>
                      )}
                    </td>
                    <td className="row-actions">
                      {item.status === "available" && (
                        <button className="btn btn-secondary" onClick={() => startEdit(item)}>Edit</button>
                      )}
                      <button className="btn btn-danger" onClick={() => handleDelete(item)}>Delete</button>
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

export default MyListings;
