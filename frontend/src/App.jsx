import { useAuth, AuthProvider } from "./context/AuthContext";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import ReporterDashboard from "./components/ReporterDashboard";
import ResolverDashboard from "./components/ResolverDashboard";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/reporter"
        element={user?.role === "REPORTER" ? <ReporterDashboard /> : <Navigate to="/login" />}
      />
      <Route
        path="/resolver"
        element={user?.role === "RESOLVER" ? <ResolverDashboard /> : <Navigate to="/login" />}
      />
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={user.role === "REPORTER" ? "/reporter" : "/resolver"} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
