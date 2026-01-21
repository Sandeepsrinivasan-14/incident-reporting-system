import { useState, useEffect } from "react";
import axios from "axios";
import { Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function ReporterDashboard() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM" });

  useEffect(() => { fetchIncidents(); }, [user]);

  const fetchIncidents = async () => {
    try {
      if (user?.id) {
        const { data } = await axios.get(`/api/incidents/reporter/${user.id}`);
        setIncidents(data);
      }
    } catch (err) { console.error("Error:", err); }
  };

  const submitIncident = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) { alert("Fill all fields"); return; }
    if (!user) { alert("Not logged in"); return; }
    try {
      await axios.post("/api/incidents", { 
        title: form.title,
        description: form.description,
        priority: form.priority,
        reporterId: user.id 
      });
      setForm({ title: "", description: "", priority: "MEDIUM" });
      await fetchIncidents();
    } catch (err) {
      alert("Failed: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Report Incidents</h2>
        <span className="text-gray-600">{user?.email}</span>
      </div>
      <form onSubmit={submitIncident} className="bg-white p-8 rounded-2xl shadow-lg mb-8 space-y-4">
        <input className="w-full p-4 border rounded-xl" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea className="w-full p-4 border rounded-xl" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="4" />
        <select className="w-full p-4 border rounded-xl" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <button type="submit" className="w-full bg-green-600 text-white p-4 rounded-xl font-bold flex items-center justify-center"><Plus className="w-5 h-5 mr-2" /> Report Incident</button>
      </form>
      <div className="grid gap-4">
        <h3 className="text-xl font-bold mb-4">My Reported Incidents</h3>
        {incidents.length === 0 ? (
          <p className="text-gray-500">No incidents reported yet</p>
        ) : (
          incidents.map((i) => (
            <div key={i.id} className="bg-white p-6 rounded-xl shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-xl">{i.title}</h3>
                <span className={"px-3 py-1 rounded-full text-sm font-semibold " + (i.priority === "CRITICAL" ? "bg-red-600 text-white" : i.priority === "HIGH" ? "bg-orange-600 text-white" : "bg-yellow-500 text-white")}>{i.priority}</span>
              </div>
              <p className="text-gray-600 mb-4">{i.description}</p>
              <div className="flex justify-between text-sm">
                <span className={"px-3 py-1 rounded-full font-semibold " + (i.status === "RESOLVED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>{i.status}</span>
                <span className="text-gray-500">{new Date(i.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
