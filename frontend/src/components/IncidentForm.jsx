import { useState, useRef } from "react";
import { AlertTriangle, FileText, Tag, Send, Paperclip, X, File } from "lucide-react";
import useAuth from "./AuthContext";
import { useToast } from "./Toast";

const PRIORITIES = [
  { value:"low",      label:"Low",      desc:"Minor issue, no immediate impact",           color:"#22c55e", bg:"#f0fdf4" },
  { value:"medium",   label:"Medium",   desc:"Moderate impact, should be fixed soon",      color:"#f59e0b", bg:"#fffbeb" },
  { value:"high",     label:"High",     desc:"Significant impact, needs urgent attention",  color:"#f97316", bg:"#fff7ed" },
  { value:"critical", label:"Critical", desc:"System down or major data risk",             color:"#ef4444", bg:"#fef2f2" },
];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function IncidentForm({ onSuccess }) {
  const { token } = useAuth();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = (picked) => {
    const allowed = /\.(jpeg|jpg|png|gif|pdf|txt|log|csv|json|zip)$/i;
    const valid = Array.from(picked).filter(f => {
      if (!allowed.test(f.name)) { toast(`${f.name}: unsupported type`, "error"); return false; }
      if (f.size > 10 * 1024 * 1024) { toast(`${f.name}: exceeds 10 MB`, "error"); return false; }
      return true;
    });
    setFiles(prev => [...prev, ...valid].slice(0, 5));
  };

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
      const incident = await res.json();

      // Upload attachments
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        await fetch(`/api/incidents/${incident.id}/attachments`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
      }

      setTitle(""); setDescription(""); setPriority("medium"); setFiles([]);
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
        .if-submit:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(79,70,229,0.45) !important; }
        .drop-zone { border:2px dashed #e5e7eb; border-radius:12px; padding:16px; text-align:center; cursor:pointer; transition:all 0.2s; }
        .drop-zone:hover { border-color:#7c3aed; background:#faf5ff; }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      {error && (
        <div style={{ marginBottom:"14px", padding:"10px 14px", borderRadius:"10px", background:"#fef2f2", border:"1px solid #fecaca", color:"#991b1b", fontSize:"13px", display:"flex", alignItems:"center", gap:"8px" }}>
          <AlertTriangle size={14} color="#ef4444" style={{ flexShrink:0 }} />
          {error}
        </div>
      )}

      <div style={{ marginBottom:"14px" }}>
        <label style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"12px", fontWeight:700, color:"#374151", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.5px" }}>
          <FileText size={12} color="#7c3aed" /> Title *
        </label>
        <input className="if-input" type="text" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief, clear incident title"
          style={{ width:"100%", padding:"10px 14px", borderRadius:"10px", border:"1.5px solid #e5e7eb", fontSize:"14px", fontFamily:"inherit", boxSizing:"border-box", transition:"all 0.2s", background:"#fafafa" }} />
        <div style={{ textAlign:"right", fontSize:"10px", color:"#c4b5fd", marginTop:"3px" }}>{title.length}/200</div>
      </div>

      <div style={{ marginBottom:"14px" }}>
        <label style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"12px", fontWeight:700, color:"#374151", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.5px" }}>
          <FileText size={12} color="#7c3aed" /> Description
        </label>
        <textarea className="if-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="What happened? Steps to reproduce, impact, relevant details."
          style={{ width:"100%", padding:"10px 14px", borderRadius:"10px", border:"1.5px solid #e5e7eb", fontSize:"13px", fontFamily:"inherit", resize:"vertical", boxSizing:"border-box", lineHeight:"1.6", transition:"all 0.2s", background:"#fafafa" }} />
      </div>

      <div style={{ marginBottom:"14px" }}>
        <label style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"12px", fontWeight:700, color:"#374151", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>
          <Tag size={12} color="#7c3aed" /> Priority
        </label>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
          {PRIORITIES.map(p => (
            <div key={p.value} onClick={() => setPriority(p.value)}
              style={{ padding:"8px 10px", borderRadius:"10px", border:`2px solid ${priority===p.value?p.color:"#e5e7eb"}`, background:priority===p.value?p.bg:"white", cursor:"pointer", transition:"all 0.18s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"2px" }}>
                <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:p.color, flexShrink:0 }} />
                <span style={{ fontSize:"12px", fontWeight:700, color:priority===p.value?p.color:"#374151" }}>{p.label}</span>
              </div>
              <div style={{ fontSize:"10px", color:"#9ca3af", lineHeight:"1.4", paddingLeft:"14px" }}>{p.desc}</div>
            </div>
          ))}
        </div>
        {selPri && (
          <div style={{ marginTop:"6px", padding:"6px 10px", borderRadius:"8px", background:selPri.bg, border:`1px solid ${selPri.color}30`, fontSize:"11px", color:selPri.color, fontWeight:600, display:"flex", alignItems:"center", gap:"5px" }}>
            <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:selPri.color }} />
            SLA: {selPri.value==="critical"?"1 hour":selPri.value==="high"?"4 hours":selPri.value==="medium"?"24 hours":"72 hours"}
          </div>
        )}
      </div>

      {/* File attachments */}
      <div style={{ marginBottom:"18px" }}>
        <label style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"12px", fontWeight:700, color:"#374151", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>
          <Paperclip size={12} color="#7c3aed" /> Attachments <span style={{ fontWeight:400, color:"#9ca3af", textTransform:"none", letterSpacing:"normal" }}>(max 5, 10 MB each)</span>
        </label>
        <div className="drop-zone" onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
          <Paperclip size={18} color="#c4b5fd" style={{ margin:"0 auto 6px" }} />
          <div style={{ fontSize:"13px", color:"#6b7280", fontWeight:500 }}>Drop files here or click to browse</div>
          <div style={{ fontSize:"11px", color:"#9ca3af", marginTop:"3px" }}>JPG, PNG, PDF, TXT, LOG, CSV, ZIP</div>
        </div>
        <input ref={fileInputRef} type="file" multiple accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.log,.csv,.json,.zip" style={{ display:"none" }} onChange={(e) => handleFiles(e.target.files)} />
        {files.length > 0 && (
          <div style={{ marginTop:"10px", display:"flex", flexDirection:"column", gap:"6px" }}>
            {files.map((f, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:"8px", padding:"8px 10px", borderRadius:"8px", background:"#f5f3ff", border:"1px solid #ede9fe" }}>
                <File size={14} color="#7c3aed" style={{ flexShrink:0 }} />
                <span style={{ flex:1, fontSize:"12px", color:"#374151", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</span>
                <span style={{ fontSize:"11px", color:"#9ca3af", flexShrink:0 }}>{formatBytes(f.size)}</span>
                <button type="button" onClick={() => setFiles(prev => prev.filter((_,j) => j!==i))} style={{ background:"none", border:"none", cursor:"pointer", color:"#9ca3af", display:"flex", padding:"0" }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="if-submit" type="submit" disabled={loading}
        style={{ width:"100%", padding:"12px", borderRadius:"12px", border:"none", background:loading?"#9ca3af":"linear-gradient(135deg,#4f46e5,#7c3aed)", color:"white", fontSize:"14px", fontWeight:700, cursor:loading?"not-allowed":"pointer", boxShadow:"0 4px 16px rgba(79,70,229,0.35)", transition:"all 0.25s ease", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", opacity:loading?0.75:1 }}>
        {loading ? (
          <><div style={{ width:"16px", height:"16px", border:"2px solid rgba(255,255,255,0.3)", borderTop:"2px solid white", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} /> Submitting…</>
        ) : (
          <><Send size={15} /> Submit Incident</>
        )}
      </button>
    </form>
  );
}
