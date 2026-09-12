import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "./AuthContext";
import IncidentForm from "./IncidentForm";

const PRIORITY_LEVELS = { low: 1, medium: 2, high: 3, critical: 4 };

const PRIORITY_STYLES = {
  critical: { bg: "#fef2f2", color: "#991b1b", label: "Critical" },
  high:     { bg: "#fff7ed", color: "#9a3412", label: "High" },
  medium:   { bg: "#fefce8", color: "#854d0e", label: "Medium" },
  low:      { bg: "#f0fdf4", color: "#166534", label: "Low" },
};

const STATUS_STYLES = {
  open:        { bg: "#fef3c7", color: "#92400e", label: "Open" },
  in_progress: { bg: "#dbeafe", color: "#1e40af", label: "In Progress" },
  resolved:    { bg: "#dcfce7", color: "#166534", label: "Resolved" },
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function Dashboard() {
  const { token, user, role, logout } = useAuth();
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/incidents", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load incidents");
      }
      setIncidents(await res.json());
    } catch (err) {
      setError(err.message || "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchIncidents();
  }, [token, fetchIncidents, navigate]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleUpdate = async (incidentId, updates) => {
    setUpdatingId(incidentId);
    setUpdateError("");
    try {
      const res = await fetch(`/api/incidents/${incidentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update incident");
      }
      setSuccessMsg("Incident updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchIncidents();
    } catch (err) {
      setUpdateError(err.message || "Failed to update incident");
      setTimeout(() => setUpdateError(""), 5000);
    } finally {
      setUpdatingId(null);
    }
  };

  const getUpgradablePriorities = (currentPriority) => {
    const currentLevel = PRIORITY_LEVELS[currentPriority] || 0;
    return Object.entries(PRIORITY_LEVELS)
      .filter(([, level]) => level >= currentLevel)
      .map(([name]) => name);
  };

  const totalCount = incidents.length;
  const openCount = incidents.filter((i) => i.status === "open").length;
  const inProgressCount = incidents.filter((i) => i.status === "in_progress").length;
  const resolvedCount = incidents.filter((i) => i.status === "resolved").length;

  const filtered = incidents.filter((i) => filter === "all" || i.status === filter);

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: "16px", fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .dash-main { grid-template-columns: 1fr !important; }
          .dash-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-header { flex-direction: column !important; align-items: flex-start !important; }
          .dash-header-right { text-align: left !important; }
        }
        @media (max-width: 480px) {
          .dash-stats { grid-template-columns: 1fr 1fr !important; }
        }
        .incident-card:hover { background: #fafafa; }
        .filter-btn { transition: all 0.15s ease; }
        .action-btn { transition: all 0.15s ease; }
        .action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
      `}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* HEADER */}
        <header
          className="dash-header"
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "18px 22px",
            marginBottom: "20px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "42px", height: "42px", borderRadius: "12px",
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 700, fontSize: "17px", flexShrink: 0,
            }}>IR</div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}>Incident Manager</div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>Track, prioritize, and resolve incidents</div>
            </div>
          </div>

          <div className="dash-header-right" style={{ textAlign: "right" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>{user?.email}</div>
            <div style={{
              display: "inline-block", fontSize: "11px", padding: "2px 8px",
              borderRadius: "999px", marginTop: "3px",
              background: role === "RESOLVER" ? "#ede9fe" : "#dbeafe",
              color: role === "RESOLVER" ? "#5b21b6" : "#1d4ed8",
              fontWeight: 600, textTransform: "capitalize",
            }}>
              {role?.toLowerCase()}
            </div>
            <div style={{ marginTop: "8px" }}>
              <button
                onClick={handleLogout}
                style={{
                  padding: "5px 14px", borderRadius: "999px", border: "none",
                  background: "#ef4444", color: "white", fontSize: "12px",
                  fontWeight: 600, cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* STATS */}
        <section
          className="dash-stats"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "14px",
            marginBottom: "20px",
          }}
        >
          {[
            { label: "Total", value: totalCount, color: "#4f46e5" },
            { label: "Open", value: openCount, color: "#ea580c" },
            { label: "In Progress", value: inProgressCount, color: "#ca8a04" },
            { label: "Resolved", value: resolvedCount, color: "#16a34a" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: "white", borderRadius: "14px", padding: "14px 16px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "5px" }}>{label}</div>
              <div style={{ fontSize: "26px", fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </section>

        {/* Global messages */}
        {updateError && (
          <div style={{
            marginBottom: "14px", padding: "10px 14px", borderRadius: "10px",
            background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: "13px",
          }}>
            {updateError}
          </div>
        )}
        {successMsg && (
          <div style={{
            marginBottom: "14px", padding: "10px 14px", borderRadius: "10px",
            background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "13px",
          }}>
            ✓ {successMsg}
          </div>
        )}

        {/* MAIN LAYOUT */}
        <div
          className="dash-main"
          style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: "20px", alignItems: "flex-start" }}
        >
          {/* LEFT: INCIDENT LIST */}
          <div style={{
            background: "white", borderRadius: "16px", padding: "18px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                  {role === "RESOLVER" ? "All Incidents" : "My Incidents"}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                  {filtered.length} {filtered.length === 1 ? "incident" : "incidents"} shown
                </div>
              </div>
              {role === "REPORTER" && (
                <button
                  onClick={() => setShowForm((prev) => !prev)}
                  style={{
                    padding: "8px 16px", borderRadius: "999px", border: "none",
                    background: showForm ? "#6b7280" : "linear-gradient(135deg,#4f46e5,#7c3aed)",
                    color: "white", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                    boxShadow: showForm ? "none" : "0 4px 14px rgba(79,70,229,0.35)",
                  }}
                >
                  {showForm ? "✕ Cancel" : "+ New Incident"}
                </button>
              )}
            </div>

            {/* Filter bar */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
              {["all", "open", "in_progress", "resolved"].map((f) => (
                <button
                  key={f}
                  className="filter-btn"
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "5px 12px", borderRadius: "999px",
                    border: filter === f ? "none" : "1px solid #e5e7eb",
                    background: filter === f ? "#4f46e5" : "white",
                    color: filter === f ? "white" : "#374151",
                    fontSize: "12px", fontWeight: 600, cursor: "pointer",
                  }}
                >
                  {f === "all" ? "All" : f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
                  {f !== "all" && (
                    <span style={{
                      marginLeft: "5px", fontSize: "11px",
                      opacity: filter === f ? 0.8 : 0.6,
                    }}>
                      ({incidents.filter((i) => i.status === f).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {error && (
              <div style={{
                padding: "10px 12px", borderRadius: "8px",
                background: "#fef2f2", border: "1px solid #fecaca",
                color: "#991b1b", fontSize: "13px", marginBottom: "12px",
              }}>
                {error}
              </div>
            )}

            {loading ? (
              <div style={{ padding: "32px", textAlign: "center", color: "#6b7280", fontSize: "14px" }}>
                <div style={{
                  width: "24px", height: "24px", border: "3px solid #e5e7eb",
                  borderTop: "3px solid #4f46e5", borderRadius: "50%",
                  animation: "spin 0.7s linear infinite", margin: "0 auto 10px",
                }} />
                Loading incidents...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{
                padding: "40px 16px", textAlign: "center", color: "#6b7280", fontSize: "14px",
              }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                  {filter === "all" ? "📋" : "🔍"}
                </div>
                {filter === "all"
                  ? role === "REPORTER"
                    ? "No incidents yet. Click \"+ New Incident\" to create your first one."
                    : "No incidents have been reported yet."
                  : `No ${filter === "in_progress" ? "in-progress" : filter} incidents.`}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {filtered.map((incident) => {
                  const pStyle = PRIORITY_STYLES[incident.priority] || PRIORITY_STYLES.low;
                  const sStyle = STATUS_STYLES[incident.status] || STATUS_STYLES.open;
                  const isUpdating = updatingId === incident.id;

                  return (
                    <div
                      key={incident.id}
                      className="incident-card"
                      style={{
                        padding: "14px 16px", borderRadius: "12px",
                        border: "1px solid #e5e7eb", transition: "background 0.15s ease",
                        opacity: isUpdating ? 0.6 : 1,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "#111827", marginBottom: "3px" }}>
                            {incident.title}
                          </div>
                          {incident.description && (
                            <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "6px", lineHeight: "1.5" }}>
                              {incident.description}
                            </div>
                          )}
                          <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                            #{incident.id} · {incident.reporter?.email} · {formatDate(incident.createdAt)}
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end", flexShrink: 0 }}>
                          <span style={{
                            padding: "2px 8px", borderRadius: "999px", fontSize: "11px",
                            fontWeight: 600, background: sStyle.bg, color: sStyle.color,
                          }}>
                            {sStyle.label}
                          </span>
                          <span style={{
                            padding: "2px 8px", borderRadius: "999px", fontSize: "11px",
                            fontWeight: 600, background: pStyle.bg, color: pStyle.color,
                          }}>
                            {pStyle.label}
                          </span>
                        </div>
                      </div>

                      {/* Resolver controls */}
                      {role === "RESOLVER" && (
                        <div style={{
                          marginTop: "10px", paddingTop: "10px",
                          borderTop: "1px solid #f3f4f6",
                          display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap",
                        }}>
                          {incident.status === "open" && (
                            <button
                              className="action-btn"
                              onClick={() => handleUpdate(incident.id, { status: "in_progress" })}
                              disabled={isUpdating}
                              style={{
                                padding: "5px 12px", borderRadius: "999px", border: "none",
                                background: "#3b82f6", color: "white",
                                fontSize: "11px", fontWeight: 600, cursor: "pointer",
                              }}
                            >
                              Start Work
                            </button>
                          )}
                          {incident.status === "in_progress" && (
                            <button
                              className="action-btn"
                              onClick={() => handleUpdate(incident.id, { status: "resolved" })}
                              disabled={isUpdating}
                              style={{
                                padding: "5px 12px", borderRadius: "999px", border: "none",
                                background: "#16a34a", color: "white",
                                fontSize: "11px", fontWeight: 600, cursor: "pointer",
                              }}
                            >
                              Mark Resolved
                            </button>
                          )}
                          {incident.status === "resolved" && (
                            <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>
                              ✓ Resolved
                            </span>
                          )}

                          {incident.status !== "resolved" && (
                            <select
                              value={incident.priority}
                              disabled={isUpdating}
                              onChange={(e) => {
                                if (e.target.value !== incident.priority) {
                                  handleUpdate(incident.id, { priority: e.target.value });
                                }
                              }}
                              style={{
                                padding: "4px 8px", borderRadius: "8px",
                                border: "1px solid #e5e7eb", fontSize: "11px",
                                fontWeight: 600, cursor: "pointer", background: "white",
                              }}
                            >
                              {getUpgradablePriorities(incident.priority).map((p) => (
                                <option key={p} value={p}>
                                  {p.charAt(0).toUpperCase() + p.slice(1)}
                                </option>
                              ))}
                            </select>
                          )}

                          <span style={{ fontSize: "10px", color: "#9ca3af", fontStyle: "italic" }}>
                            Priority can only be upgraded
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div style={{
            background: "white", borderRadius: "16px", padding: "18px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb",
          }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "14px" }}>
              {role === "REPORTER" ? "Report an Incident" : "Resolver Guide"}
            </div>

            {role === "REPORTER" ? (
              showForm ? (
                <IncidentForm onSuccess={() => { fetchIncidents(); setShowForm(false); }} />
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: "40px", marginBottom: "10px" }}>📣</div>
                  <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px", lineHeight: "1.6" }}>
                    Spotted something that needs attention? Report it so the team can act fast.
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    style={{
                      padding: "10px 20px", borderRadius: "12px", border: "none",
                      background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                      color: "white", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(79,70,229,0.3)",
                    }}
                  >
                    + Create Incident Report
                  </button>
                </div>
              )
            ) : (
              <div>
                <p style={{ fontSize: "13px", color: "#374151", lineHeight: "1.8", marginBottom: "12px" }}>
                  As a <strong>Resolver</strong>, you can manage all incidents across the system.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                  {[
                    { icon: "👁", text: "View all reported incidents" },
                    { icon: "▶", text: "Move incidents Open → In Progress → Resolved" },
                    { icon: "⬆", text: "Upgrade incident priority (never downgrade)" },
                    { icon: "🔍", text: "Filter by status to focus your work" },
                  ].map(({ icon, text }) => (
                    <div key={text} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "#4b5563" }}>
                      <span style={{ flexShrink: 0 }}>{icon}</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
                <div style={{
                  padding: "10px 12px", borderRadius: "10px",
                  background: "#fffbeb", border: "1px solid #fde68a",
                  fontSize: "12px", color: "#92400e",
                }}>
                  <strong>Priority Rule:</strong> Once set, incident priority can only be increased.
                  The system blocks any downgrade attempt at the API level.
                  <br />
                  <span style={{ marginTop: "4px", display: "block", color: "#6b7280" }}>
                    Low → Medium → High → Critical
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
