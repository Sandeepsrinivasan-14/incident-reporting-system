import { useState } from "react";
import useAuth from "./AuthContext";

export default function IncidentForm({ onSuccess }) {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), priority }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create incident");
      }

      setTitle("");
      setDescription("");
      setPriority("medium");
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || "Failed to create incident");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    fontSize: "14px",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "5px",
    color: "#374151",
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{
          marginBottom: "12px",
          padding: "8px 12px",
          borderRadius: "8px",
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          fontSize: "13px",
          border: "1px solid #fecaca",
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: "12px" }}>
        <label style={labelStyle}>Title *</label>
        <input
          type="text"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief incident title"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={labelStyle}>Description</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What happened? Include relevant details."
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Priority</label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          style={inputStyle}
        >
          <option value="low">Low — Minor issue, no immediate impact</option>
          <option value="medium">Medium — Moderate impact, should be fixed soon</option>
          <option value="high">High — Significant impact, needs urgent attention</option>
          <option value="critical">Critical — System down or major data risk</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "10px 18px",
          borderRadius: "999px",
          border: "none",
          background: loading
            ? "#9ca3af"
            : "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
          color: "white",
          fontSize: "14px",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          width: "100%",
          transition: "all 0.2s ease",
        }}
      >
        {loading ? "Submitting..." : "Submit Incident"}
      </button>
    </form>
  );
}
