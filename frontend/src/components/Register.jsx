import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "./AuthContext";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("REPORTER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Registration failed");
      }

      const data = await response.json();
      login(data.token, data.user.role, data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      position: "relative",
      overflow: "hidden",
      fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
      padding: "20px",
    },
    animatedBackground: {
      position: "absolute",
      width: "100%",
      height: "100%",
      zIndex: 0,
    },
    blob: {
      position: "absolute",
      borderRadius: "50%",
      animation: "float 7s ease-in-out infinite",
    },
    blob1: {
      width: "300px",
      height: "300px",
      background: "rgba(255, 255, 255, 0.1)",
      top: "-100px",
      right: "-50px",
    },
    blob2: {
      width: "250px",
      height: "250px",
      background: "rgba(255, 255, 255, 0.05)",
      bottom: "50px",
      left: "50px",
    },
    rightPanel: {
      flex: 1,
      minWidth: "350px",
      maxWidth: "500px",
      position: "relative",
      zIndex: 1,
    },
    formCard: {
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(20px)",
      borderRadius: "20px",
      padding: "40px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
      border: "1px solid rgba(255, 255, 255, 0.3)",
    },
    formHeader: {
      marginBottom: "24px",
      textAlign: "center",
    },
    formTitle: {
      fontSize: "28px",
      fontWeight: 700,
      color: "#1f2937",
      marginBottom: "8px",
    },
    formSubtitle: {
      fontSize: "14px",
      color: "#6b7280",
    },
    errorAlert: {
      background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
      border: "1px solid #fca5a5",
      color: "#991b1b",
      padding: "12px 16px",
      borderRadius: "12px",
      marginBottom: "16px",
      fontSize: "14px",
    },
    inputGroup: {
      marginBottom: "20px",
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: 600,
      color: "#374151",
      marginBottom: "8px",
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      border: "2px solid #e5e7eb",
      borderRadius: "12px",
      fontSize: "14px",
      transition: "all 0.3s ease",
      fontFamily: "inherit",
    },
    select: {
      width: "100%",
      padding: "12px 16px",
      border: "2px solid #e5e7eb",
      borderRadius: "12px",
      fontSize: "14px",
      transition: "all 0.3s ease",
      fontFamily: "inherit",
      background: "white",
    },
    submitBtn: {
      width: "100%",
      padding: "14px 24px",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "16px",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.3s ease",
      marginTop: "8px",
    },
    footer: {
      marginTop: "16px",
      fontSize: "13px",
      textAlign: "center",
      color: "#6b7280",
    },
    link: {
      color: "#667eea",
      fontWeight: 600,
      textDecoration: "none",
      marginLeft: "4px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.animatedBackground}>
        <div style={{ ...styles.blob, ...styles.blob1 }} />
        <div style={{ ...styles.blob, ...styles.blob2 }} />
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Create Account</h2>
            <p style={styles.formSubtitle}>Join the Incident Management System</p>
          </div>

          {error && <div style={styles.errorAlert}>{error}</div>}

          <form onSubmit={handleRegister}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={styles.select}
              >
                <option value="REPORTER">Reporter — Report incidents</option>
                <option value="RESOLVER">Resolver — Manage incidents</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <div style={styles.footer}>
            Already have an account?
            <Link to="/login" style={styles.link}>
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
