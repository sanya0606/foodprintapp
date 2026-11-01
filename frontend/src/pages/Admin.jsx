import React, { useEffect, useState, useCallback } from "react";
import api from "../api/api";
import "../styles/admin.css";

const ROLE_LABEL = { provider: "Provider", ngo: "NGO", student: "Student", admin: "Admin" };

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/users", { params: roleFilter ? { role: roleFilter } : {} });
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleActive = async (user) => {
    setBusyId(user._id);
    try {
      await api.patch(`/users/${user._id}`, { isActive: !user.isActive });
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update user.");
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = async (user, role) => {
    setBusyId(user._id);
    try {
      await api.patch(`/users/${user._id}`, { role });
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Could not change role.");
    } finally {
      setBusyId(null);
    }
  };

  const removeUser = async (user) => {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    setBusyId(user._id);
    try {
      await api.delete(`/users/${user._id}`);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete user.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page-container">
      <h1>Admin panel</h1>
      <p>Manage restaurants, NGOs, students, and admin accounts on FoodPrint.</p>

      <div className="card admin-filters">
        <div className="field">
          <label htmlFor="roleFilter">Filter by role</label>
          <select id="roleFilter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All roles</option>
            <option value="provider">Providers</option>
            <option value="ngo">NGOs</option>
            <option value="student">Students</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {error && <div className="form-error-banner">{error}</div>}

      <div className="card">
        {loading ? (
          <p>Loading users...</p>
        ) : users.length === 0 ? (
          <p>No users match this filter.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Organization</th>
                  <th>Role</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="cell-strong">{u.name}</div>
                      <div className="cell-sub">{u.email}</div>
                    </td>
                    <td>{u.organizationName || "—"}</td>
                    <td>
                      <select
                        value={u.role}
                        disabled={busyId === u._id}
                        onChange={(e) => changeRole(u, e.target.value)}
                      >
                        {Object.entries(ROLE_LABEL).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{u.location || "—"}</td>
                    <td>
                      <span className={`tag ${u.isActive ? "tag-available" : "tag-expired"}`}>
                        {u.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="row-actions">
                      <button className="btn btn-secondary" disabled={busyId === u._id} onClick={() => toggleActive(u)}>
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button className="btn btn-danger" disabled={busyId === u._id} onClick={() => removeUser(u)}>
                        Delete
                      </button>
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

export default Admin;
