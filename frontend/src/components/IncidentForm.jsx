import { useState } from "react";
import { AlertTriangle, FileText, Tag, Send } from "lucide-react";
import useAuth from "./AuthContext";

const PRIORITIES = [
  { value:"low",      label:"Low",      desc:"Minor issue, no immediate impact",          color:"#22c55e", bg:"#f0fdf4" },
  { value:"medium",   label:"Medium",   desc:"Moderate impact, should be fixed soon",     color:"#f59e0b", bg:"#fffbeb" },
  { value:"high",     label:"High",     desc:"Significant impact, needs urgent attention", color:"#f97316", bg:"#fff7ed" },
  { value:"critical", label:"Critical", desc:"System down or major data risk",            color:"#ef4444", bg:"#fef2f2" },
];

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
    if (!title.trim()) { setError("Title is required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), priority }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to create incident"); }
      setTitle(""); setDescription(""); setPriority("medium");
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || "Failed to create incident");
    } finally {
      setLoading(false);
    }
  };

  const selPri = PRIORITIES.find(p => p.value === priority);

  return (
    <form onSubmit={handleSubmit}>
      <style>{`
        .if-input:focus { outline:none; border-color:#7c3aed !important; box-shadow:0 0 0 3px rgba(124,58,237,0.12) !important; }
        .if-input::placeholder { color:#c4b5fd; }
        .pri-chip { transition:all 0.18s ease; cursor:pointer; }
        .pri-chip:hover { transform:translateY(-2px); }
        .if-submit:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(79,70,229,0.45) !important; }
      `}</style>

      {error && (
        <div style={{ marginBottom:"14px", padding:"10px 14px", borderRadius:"10px", background:"#fef2f2", border:"1px solid #fecaca", color:"#991b1b", fontSize:"13px", display:"flex", alignItems:"center", gap:"8px" }}>
          <AlertTriangle size={14} color="#ef4444" style={{ flexShrink:0 }} />
          {error}
        </div>
      )}

      {/* Title */}
      <div style={{ marginBottom:"14px" }}>
        <label style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"12px", fontWeight:700, color:"#374151", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.5px" }}>
          <FileText size={12} color="#7c3aed" /> Title *
        </label>
        <input
          className="if-input"
          type="text" required maxLength={200}
          value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief, clear incident title"
          style={{ width:"100%", padding:"10px 14px", borderRadius:"10px", border:"1.5px solid #e5e7eb", fontSize:"14px", fontFamily:"inherit", boxSizing:"border-box", transition:"all 0.2s", background:"#fafafa" }}
        />
        <div style={{ textAlign:"right", fontSize:"10px", color:"#c4b5fd", marginTop:"3px" }}>{title.length}/200</div>
      </div>

      {/* Description */}
      <div style={{ marginBottom:"14px" }}>
        <label style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"12px", fontWeight:700, color:"#374151", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.5px" }}>
          <FileText size={12} color="#7c3aed" /> Description
        </label>
        <textarea
          className="if-input"
          rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="What happened? Include steps to reproduce, impact, and any relevant details."
          style={{ width:"100%", padding:"10px 14px", borderRadius:"10px", border:"1.5px solid #e5e7eb", fontSize:"13px", fontFamily:"inherit", resize:"vertical", boxSizing:"border-box", lineHeight:"1.6", transition:"all 0.2s", background:"#fafafa" }}
        />
      </div>

      {/* Priority */}
      <div style={{ marginBottom:"18px" }}>
        <label style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"12px", fontWeight:700, color:"#374151", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>
          <Tag size={12} color="#7c3aed" /> Priority
        </label>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
          {PRIORITIES.map(p => (
            <div key={p.value} className="pri-chip" onClick={() => setPriority(p.value)}
              style={{ padding:"8px 10px", borderRadius:"10px", border:`2px solid ${priority===p.value ? p.color : "#e5e7eb"}`, background:priority===p.value ? p.bg : "white", transition:"all 0.18s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"2px" }}>
                <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:p.color, flexShrink:0 }} />
                <span style={{ fontSize:"12px", fontWeight:700, color:priority===p.value ? p.color : "#374151" }}>{p.label}</span>
              </div>
              <div style={{ fontSize:"10px", color:"#9ca3af", lineHeight:"1.4", paddingLeft:"14px" }}>{p.desc}</div>
            </div>
          ))}
        </div>
        {selPri && (
          <div style={{ marginTop:"8px", padding:"7px 10px", borderRadius:"8px", background:selPri.bg, border:`1px solid ${selPri.color}30`, fontSize:"11px", color:selPri.color, fontWeight:600, display:"flex", alignItems:"center", gap:"5px" }}>
            <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:selPri.color }} />
            {selPri.label} priority selected — {selPri.desc}
          </div>
        )}
      </div>

      <button
        className="if-submit"
        type="submit" disabled={loading}
        style={{ width:"100%", padding:"12px", borderRadius:"12px", border:"none", background:loading?"#9ca3af":"linear-gradient(135deg,#4f46e5,#7c3aed)", color:"white", fontSize:"14px", fontWeight:700, cursor:loading?"not-allowed":"pointer", boxShadow:"0 4px 16px rgba(79,70,229,0.35)", transition:"all 0.25s ease", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", opacity:loading?0.75:1 }}
      >
        {loading ? (
          <><div style={{ width:"16px", height:"16px", border:"2px solid rgba(255,255,255,0.3)", borderTop:"2px solid white", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} /> Submitting…</>
        ) : (
          <><Send size={15} /> Submit Incident</>
        )}
      </button>
    </form>
  );
}
