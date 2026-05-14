import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "./AuthContext";
import IncidentForm from "./IncidentForm";

// Priority levels for comparison
const PRIORITY_LEVELS = { low: 1, medium: 2, high: 3, critical: 4 };

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

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchIncidents();
  }, [token, role]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/incidents", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to load incidents");
      }

      const data = await response.json();
      setIncidents(data);
    } catch (err) {
      setError(err.message || "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleUpdateIncident = async (incidentId, updates) => {
    try {
      setUpdateError("");
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update incident");
      }

      setSuccessMsg("Incident updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchIncidents();
    } catch (err) {
      setUpdateError(err.message || "Failed to update incident");
      setTimeout(() => setUpdateError(""), 5000);
    }
  };

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f3f4f6",
      padding: "24px",
      fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
    },
    container: {
      maxWidth: "1200px",
      margin: "0 auto",
    },
    header: {
      background: "white",
      borderRadius: "16px",
      padding: "20px 24px",
      marginBottom: "24px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
    },
    headerLeft: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    logoCircle: {
      width: "40px",
      height: "40px",
      borderRadius: "12px",
      background:
        "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: 700,
      fontSize: "18px",
    },
    headerTitle: {
      fontSize: "20px",
      fontWeight: 700,
      color: "#111827",
    },
    headerSubtitle: {
      fontSize: "13px",
      color: "#6b7280",
    },
    headerRight: {
      textAlign: "right",
    },
    userEmail: {
      fontSize: "14px",
      fontWeight: 600,
      color: "#111827",
    },
    userRole: {
      fontSize: "12px",
      color: "#6b7280",
      textTransform: "capitalize",
    },
    logoutBtn: {
      marginTop: "8px",
      padding: "6px 12px",
      borderRadius: "999px",
      border: "none",
      background: "#ef4444",
      color: "white",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer",
      boxShadow: "0 6px 18px rgba(239,68,68,0.35)",
    },
    mainRow: {
      display: "grid",
      gridTemplateColumns: "2fr 1.4fr",
      gap: "24px",
      alignItems: "flex-start",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: "16px",
      marginBottom: "24px",
    },
    statCard: {
      background: "white",
      borderRadius: "14px",
      padding: "14px 16px",
      boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
      border: "1px solid #e5e7eb",
    },
    statLabel: {
      fontSize: "12px",
      color: "#6b7280",
      marginBottom: "6px",
    },
    statValue: {
      fontSize: "22px",
      fontWeight: 700,
    },
    statValueBlue: { color: "#4f46e5" },
    statValueOrange: { color: "#ea580c" },
    statValueYellow: { color: "#ca8a04" },
    statValueGreen: { color: "#16a34a" },
    contentCard: {
      background: "white",
      borderRadius: "16px",
      padding: "18px 18px 8px 18px",
      boxShadow: "0 12px 40px rgba(15,23,42,0.08)",
      border: "1px solid #e5e7eb",
    },
    cardHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "12px",
    },
    cardTitle: {
      fontSize: "16px",
      fontWeight: 600,
      color: "#111827",
    },
    pill: {
      fontSize: "11px",
      padding: "4px 10px",
      borderRadius: "999px",
      background: "#eef2ff",
      color: "#4f46e5",
      fontWeight: 600,
    },
    errorBanner: {
      marginTop: "8px",
      marginBottom: "8px",
      padding: "8px 10px",
      borderRadius: "10px",
      background: "#fef2f2",
      border: "1px solid #fecaca",
      color: "#991b1b",
      fontSize: "12px",
    },
    successBanner: {
      marginTop: "8px",
      marginBottom: "8px",
      padding: "8px 10px",
      borderRadius: "10px",
      background: "#f0fdf4",
      border: "1px solid #bbf7d0",
      color: "#166534",
      fontSize: "12px",
    },
  };

  const filterButtons = ["all", "open", "in_progress", "resolved"];

  const totalIncidents = incidents.length;
  const openIncidents = incidents.filter((i) => i.status === "open").length;
  const inProgressIncidents = incidents.filter(
    (i) => i.status === "in_progress"
  ).length;
  const resolvedIncidents = incidents.filter(
    (i) => i.status === "resolved"
  ).length;

  const filteredIncidents = incidents.filter((inc) => {
    if (filter === "all") return true;
    return inc.status === filter;
  });

  // Get available priority upgrades for a given incident
  const getAvailablePriorities = (currentPriority) => {
    const currentLevel = PRIORITY_LEVELS[currentPriority] || 0;
    return Object.entries(PRIORITY_LEVELS)
      .filter(([, level]) => level >= currentLevel)
      .map(([name]) => name);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* HEADER */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logoCircle}>IR</div>
            <div>
              <div style={styles.headerTitle}>Incident Manager</div>
              <div style={styles.headerSubtitle}>
                Track, prioritize, and resolve incidents efficiently.
              </div>
            </div>
          </div>

          <div style={styles.headerRight}>
            <div style={styles.userEmail}>{user?.email}</div>
            <div style={styles.userRole}>{role?.toLowerCase()}</div>
            <button style={styles.logoutBtn} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* STATS */}
        <section style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Incidents</div>
            <div style={{ ...styles.statValue, ...styles.statValueBlue }}>
              {totalIncidents}
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Open</div>
            <div style={{ ...styles.statValue, ...styles.statValueOrange }}>
              {openIncidents}
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>In Progress</div>
            <div style={{ ...styles.statValue, ...styles.statValueYellow }}>
              {inProgressIncidents}
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Resolved</div>
            <div style={{ ...styles.statValue, ...styles.statValueGreen }}>
              {resolvedIncidents}
            </div>
          </div>
        </section>

        {/* Global messages */}
        {updateError && <div style={styles.errorBanner}>{updateError}</div>}
        {successMsg && <div style={styles.successBanner}>{successMsg}</div>}

        {/* MAIN LAYOUT ROW */}
        <div style={styles.mainRow}>
          {/* LEFT: INCIDENTS LIST + FILTERS */}
          <div style={styles.contentCard}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>Incidents</div>
              <span style={styles.pill}>
                {role === "RESOLVER" ? "All incidents" : "My incidents"}
              </span>
            </div>

            {error && <div style={styles.errorBanner}>{error}</div>}

            {/* FILTER BAR + NEW INCIDENT BUTTON */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {filterButtons.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "999px",
                      border:
                        filter === f ? "none" : "1px solid #e5e7eb",
                      background:
                        filter === f ? "#4f46e5" : "white",
                      color: filter === f ? "white" : "#374151",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {f === "all"
                      ? "All"
                      : f === "in_progress"
                      ? "In Progress"
                      : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {role === "REPORTER" && (
                <button
                  onClick={() => setShowForm((prev) => !prev)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "999px",
                    border: "none",
                    background:
                      "linear-gradient(135deg,#4f46e5,#7c3aed)",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 8px 24px rgba(79,70,229,0.35)",
                  }}
                >
                  {showForm ? "Close Form" : "+ New Incident"}
                </button>
              )}
            </div>

            {/* INCIDENT LIST */}
            {loading ? (
              <div style={{ padding: "16px", fontSize: "13px" }}>
                Loading incidents...
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div
                style={{
                  padding: "16px",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                No incidents found for this filter.
              </div>
            ) : (
              <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {filteredIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>
                          {incident.title}
                        </div>
                        <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "6px" }}>
                          {incident.description}
                        </div>
                        <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                          #{incident.id} &bull; Reporter: {incident.reporter?.email || "N/A"}
                        </div>
                      </div>

                      <div style={{ textAlign: "right", fontSize: "12px", minWidth: "100px" }}>
                        <div
                          style={{
                            marginBottom: "4px",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            display: "inline-block",
                            backgroundColor:
                              incident.status === "open" ? "#fef3c7" :
                              incident.status === "in_progress" ? "#dbeafe" :
                              "#dcfce7",
                            color:
                              incident.status === "open" ? "#92400e" :
                              incident.status === "in_progress" ? "#1e40af" :
                              "#166534",
                            fontWeight: 600,
                          }}
                        >
                          {incident.status === "in_progress" ? "In Progress" : incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                        </div>
                        <div style={{
                          marginTop: "4px",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          display: "inline-block",
                          backgroundColor:
                            incident.priority === "critical" ? "#fef2f2" :
                            incident.priority === "high" ? "#fff7ed" :
                            incident.priority === "medium" ? "#fefce8" :
                            "#f0fdf4",
                          color:
                            incident.priority === "critical" ? "#991b1b" :
                            incident.priority === "high" ? "#9a3412" :
                            incident.priority === "medium" ? "#854d0e" :
                            "#166534",
                          fontWeight: 600,
                        }}>
                          {incident.priority.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    {/* RESOLVER: Update controls */}
                    {role === "RESOLVER" && (
                      <div style={{
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: "1px solid #f3f4f6",
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}>
                        {/* Status update buttons */}
                        {incident.status === "open" && (
                          <button
                            onClick={() => handleUpdateIncident(incident.id, { status: "in_progress" })}
                            style={{
                              padding: "5px 12px",
                              borderRadius: "999px",
                              border: "none",
                              background: "#3b82f6",
                              color: "white",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Start Work
                          </button>
                        )}
                        {incident.status === "in_progress" && (
                          <button
                            onClick={() => handleUpdateIncident(incident.id, { status: "resolved" })}
                            style={{
                              padding: "5px 12px",
                              borderRadius: "999px",
                              border: "none",
                              background: "#16a34a",
                              color: "white",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
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

                        {/* Priority upgrade selector */}
                        {incident.status !== "resolved" && (
                          <select
                            value={incident.priority}
                            onChange={(e) => {
                              if (e.target.value !== incident.priority) {
                                handleUpdateIncident(incident.id, { priority: e.target.value });
                              }
                            }}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "8px",
                              border: "1px solid #e5e7eb",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                              background: "white",
                            }}
                          >
                            {getAvailablePriorities(incident.priority).map((p) => (
                              <option key={p} value={p}>
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                              </option>
                            ))}
                          </select>
                        )}

                        <span style={{ fontSize: "10px", color: "#9ca3af", fontStyle: "italic" }}>
                          ⚠ Priority can only be upgraded
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: FORM / INFO PANEL */}
          <div style={styles.contentCard}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                {role === "REPORTER" ? "Create New Incident" : "Resolver Actions"}
              </div>
              <span style={styles.pill}>
                {role === "REPORTER" ? "Reporter view" : "Resolver view"}
              </span>
            </div>

            {role === "REPORTER" ? (
              showForm ? (
                <IncidentForm onSuccess={() => {
                  fetchIncidents();
                  setShowForm(false);
                }} />
              ) : (
                <div style={{ padding: "16px 0", textAlign: "center" }}>
                  <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px" }}>
                    Click "New Incident" to create a report.
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "12px",
                      border: "none",
                      background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                      color: "white",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(79,70,229,0.3)",
                    }}
                  >
                    + Create Incident
                  </button>
                </div>
              )
            ) : (
              <div style={{ padding: "8px 0" }}>
                <div style={{ fontSize: "13px", color: "#374151", lineHeight: "1.8" }}>
                  <p style={{ fontWeight: 600, marginBottom: "8px" }}>As a Resolver, you can:</p>
                  <ul style={{ paddingLeft: "16px", color: "#6b7280" }}>
                    <li>View all incidents across the system</li>
                    <li>Update incident status (Open → In Progress → Resolved)</li>
                    <li>Upgrade incident priority (never downgrade)</li>
                    <li>Filter incidents by status</li>
                  </ul>
                  <div style={{
                    marginTop: "16px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    fontSize: "12px",
                    color: "#92400e",
                  }}>
                    ⚠️ <strong>Priority Rule:</strong> Once set, incident priority can only be maintained or increased. Any attempt to lower the priority will be rejected by the system.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
