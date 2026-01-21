import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ResolverDashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("open");
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    fetchIncidents();
  }, [user, navigate]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3001/api/incidents", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });
      setIncidents(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching incidents:", err);
      setError("Failed to load incidents");
    } finally {
      setLoading(false);
    }
  };

  const updateIncidentStatus = async (incidentId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch("http://localhost:3001/api/incidents/" + incidentId, 
        { status: newStatus },
        { headers: { Authorization: "Bearer " + token } }
      );
      fetchIncidents();
    } catch (err) {
      console.error("Error updating incident:", err);
      setError("Failed to update incident");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredIncidents = incidents.filter(incident => {
    if (filter === "open") return incident.status === "open";
    if (filter === "in_progress") return incident.status === "in_progress";
    if (filter === "resolved") return incident.status === "resolved";
    return true;
  });

  if (loading) return <div className="p-4">Loading incidents...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Resolver Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.email}</span>
            <button 
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter("open")}
            className={`px-4 py-2 rounded ${filter === "open" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Open
          </button>
          <button
            onClick={() => setFilter("in_progress")}
            className={`px-4 py-2 rounded ${filter === "in_progress" ? "bg-yellow-500 text-white" : "bg-gray-200"}`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter("resolved")}
            className={`px-4 py-2 rounded ${filter === "resolved" ? "bg-green-500 text-white" : "bg-gray-200"}`}
          >
            Resolved
          </button>
        </div>

        <div className="grid gap-4">
          {filteredIncidents.length === 0 ? (
            <div className="p-4 bg-gray-100 text-gray-600 rounded">
              No incidents found
            </div>
          ) : (
            filteredIncidents.map(incident => (
              <div key={incident.id} className="bg-white p-4 rounded shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">{incident.title}</h3>
                  <span className={`px-2 py-1 rounded text-white text-sm ${
                    incident.priority === "high" ? "bg-red-500" :
                    incident.priority === "medium" ? "bg-yellow-500" :
                    "bg-green-500"
                  }`}>
                    {incident.priority}
                  </span>
                </div>
                <p className="text-gray-600 mb-2">{incident.description}</p>
                <p className="text-sm text-gray-500 mb-3">Reporter: {incident.reporter?.email}</p>
                
                <div className="flex gap-2">
                  {incident.status === "open" && (
                    <button
                      onClick={() => updateIncidentStatus(incident.id, "in_progress")}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm"
                    >
                      Start Work
                    </button>
                  )}
                  {incident.status === "in_progress" && (
                    <button
                      onClick={() => updateIncidentStatus(incident.id, "resolved")}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {incident.status === "resolved" && (
                    <span className="text-green-600 text-sm font-semibold">? Resolved</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ResolverDashboard;
