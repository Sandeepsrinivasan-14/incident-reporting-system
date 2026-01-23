import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "./AuthContext";
import IncidentList from "./IncidentList";

export default function Dashboard() {
  const { token, user, role, logout } = useAuth();
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

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
      const response = await fetch("http://localhost:3001/api/incidents", {
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
                  {showForm ? "Close Form" : "New Incident"}
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
              <div style={{ marginTop: "8px" }}>
                <IncidentList incidents={filteredIncidents} role={role} />
              </div>
            )}
          </div>

          {/* RIGHT: FORM PLACEHOLDER */}
          <div style={styles.contentCard}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                {role === "REPORTER" ? "Create New Incident" : "Details"}
              </div>
              <span style={styles.pill}>
                {role === "REPORTER" ? "Reporter view" : "Resolver view"}
              </span>
            </div>

            {role === "REPORTER" ? (
              showForm ? (
                <p style={{ fontSize: "13px", color: "#6b7280" }}>
                  (Form component wiring will be added in the next step.)
                </p>
              ) : (
                <p style={{ fontSize: "13px", color: "#6b7280" }}>
                  Click "New Incident" above to open the form.
                </p>
              )
            ) : (
              <p style={{ fontSize: "13px", color: "#6b7280" }}>
                Select an incident from the left to see more details here
                (resolver enhancements can be added next).
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
