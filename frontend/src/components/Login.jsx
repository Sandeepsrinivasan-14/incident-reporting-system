import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "./AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const testAccounts = [
    { email: "reporter@test.com", password: "password", role: "Reporter" },
    { email: "resolver@test.com", password: "password", role: "Resolver" },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Login failed");
      }

      const data = await response.json();
      login(data.token, data.user.role, data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
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
      left: "-50px",
    },
    blob2: {
      width: "250px",
      height: "250px",
      background: "rgba(255, 255, 255, 0.05)",
      bottom: "50px",
      right: "50px",
    },
    blob3: {
      width: "200px",
      height: "200px",
      background: "rgba(255, 255, 255, 0.08)",
      top: "50%",
      right: "10%",
    },
    contentWrapper: {
      display: "flex",
      width: "100%",
      maxWidth: "1200px",
      margin: "0 auto",
      gap: "60px",
      position: "relative",
      zIndex: 1,
      alignItems: "center",
      flexWrap: "wrap",
      justifyContent: "center",
    },
    leftPanel: {
      flex: 1,
      minWidth: "300px",
      color: "white",
      textAlign: "center",
      display: "none",
    },
    brandTitle: {
      fontSize: "36px",
      fontWeight: 800,
      marginBottom: "12px",
    },
    brandSubtitle: {
      fontSize: "16px",
      opacity: 0.9,
      marginBottom: "32px",
    },
    rightPanel: {
      flex: 1,
      minWidth: "350px",
      maxWidth: "500px",
    },
    formCard: {
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(20px)",
      borderRadius: "20px",
      padding: "40px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
      border: "1px solid " + "rgba(255, 255, 255, 0.3)",
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
    testAccounts: {
      marginTop: "16px",
      fontSize: "12px",
      color: "#6b7280",
      textAlign: "center",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.animatedBackground}>
        <div style={{ ...styles.blob, ...styles.blob1 }} />
        <div style={{ ...styles.blob, ...styles.blob2 }} />
        <div style={{ ...styles.blob, ...styles.blob3 }} />
      </div>

      <div style={styles.contentWrapper}>
        <div style={styles.leftPanel}>
          <h1 style={styles.brandTitle}>Incident Manager</h1>
          <p style={styles.brandSubtitle}>
            Efficient incident tracking and resolution system.
          </p>
        </div>

        <div style={styles.rightPanel}>
          <div style={styles.formCard}>
            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>Welcome Back</h2>
              <p style={styles.formSubtitle}>Sign in to your account</p>
            </div>

            {error && <div style={styles.errorAlert}>{error}</div>}

            <form onSubmit={handleLogin}>
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={styles.input}
                />
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
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div style={styles.testAccounts}>
              Test accounts: reporter@test.com / resolver@test.com with password
              "password"
            </div>

            <div style={styles.footer}>
              Don&apos;t have an account?
              <Link to="/register" style={styles.link}>
                Sign up here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
