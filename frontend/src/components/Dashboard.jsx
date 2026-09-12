import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut, Search, SlidersHorizontal, AlertTriangle, Clock,
  CheckCircle2, TrendingUp, Plus, X, ChevronDown, MessageSquare,
  BarChart3, Zap, Shield, ArrowUpRight, Filter,
} from "lucide-react";
import useAuth from "./AuthContext";
import { useToast } from "./Toast";
import IncidentForm from "./IncidentForm";

const PRI = {
  critical: { color:"#ef4444", bg:"#fef2f2", glow:"rgba(239,68,68,0.35)", dot:"#ef4444", label:"Critical", border:"#ef4444" },
  high:     { color:"#f97316", bg:"#fff7ed", glow:"rgba(249,115,22,0.3)",  dot:"#f97316", label:"High",     border:"#f97316" },
  medium:   { color:"#eab308", bg:"#fefce8", glow:"rgba(234,179,8,0.3)",   dot:"#eab308", label:"Medium",   border:"#eab308" },
  low:      { color:"#22c55e", bg:"#f0fdf4", glow:"rgba(34,197,94,0.25)",  dot:"#22c55e", label:"Low",      border:"#22c55e" },
};
const STA = {
  open:        { color:"#d97706", bg:"#fffbeb", border:"#fde68a", label:"Open" },
  in_progress: { color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe", label:"In Progress" },
  resolved:    { color:"#16a34a", bg:"#f0fdf4", border:"#bbf7d0", label:"Resolved" },
};
const PRIORITY_LEVELS = { low:1, medium:2, high:3, critical:4 };

function formatDate(s) {
  const d = new Date(s);
  return d.toLocaleDateString("en-US",{month:"short",day:"numeric"}) + " · " +
    d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
}

function initials(email) {
  return email ? email.charAt(0).toUpperCase() : "?";
}

// Animated counter
function Counter({ value }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = value;
    if (from === value) return;
    const steps = 20;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplay(Math.round(from + (value - from) * (i / steps)));
      if (i >= steps) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
}

// Notes modal for resolving
function NotesModal({ onConfirm, onCancel }) {
  const [notes, setNotes] = useState("");
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(6px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <div style={{ background:"white", borderRadius:"24px", padding:"32px", maxWidth:"440px", width:"100%", boxShadow:"0 40px 100px rgba(0,0,0,0.3)", animation:"slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px" }}>
          <div style={{ width:"40px", height:"40px", borderRadius:"12px", background:"linear-gradient(135deg,#22c55e,#16a34a)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <CheckCircle2 size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize:"17px", fontWeight:700, color:"#111827" }}>Mark as Resolved</div>
            <div style={{ fontSize:"13px", color:"#6b7280" }}>Add resolution notes (optional)</div>
          </div>
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe what was done to resolve this incident…" rows={4}
          style={{ width:"100%", padding:"12px 14px", borderRadius:"12px", border:"1.5px solid #e5e7eb", fontSize:"14px", fontFamily:"inherit", resize:"vertical", boxSizing:"border-box", outline:"none" }} />
        <div style={{ display:"flex", gap:"10px", marginTop:"16px" }}>
          <button onClick={onCancel} style={{ flex:1, padding:"11px", borderRadius:"12px", border:"1.5px solid #e5e7eb", background:"white", color:"#374151", fontSize:"14px", fontWeight:600, cursor:"pointer" }}>Cancel</button>
          <button onClick={() => onConfirm(notes)} style={{ flex:2, padding:"11px", borderRadius:"12px", border:"none", background:"linear-gradient(135deg,#22c55e,#16a34a)", color:"white", fontSize:"14px", fontWeight:700, cursor:"pointer", boxShadow:"0 4px 16px rgba(34,197,94,0.35)" }}>
            ✓ Confirm Resolve
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { token, user, role, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [showForm, setShowForm] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [resolvingIncident, setResolvingIncident] = useState(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/incidents", { headers:{ Authorization:`Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      setIncidents(await res.json());
    } catch (err) { toast(err.message, "error"); }
    finally { setLoading(false); }
  }, [token, toast]);

  useEffect(() => { if (!token) { navigate("/login"); return; } fetchIncidents(); }, [token, fetchIncidents, navigate]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleUpdate = async (id, updates) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/incidents/${id}`, {
        method:"PATCH",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Update failed");
      toast(updates.status === "resolved" ? "Incident resolved! 🎉" : "Incident updated successfully", "success");
      fetchIncidents();
    } catch (err) { toast(err.message, "error"); }
    finally { setUpdatingId(null); }
  };

  const handleResolveConfirm = (notes) => {
    if (!resolvingIncident) return;
    handleUpdate(resolvingIncident, { status:"resolved", notes });
    setResolvingIncident(null);
  };

  const getUpgradablePriorities = (p) => {
    const cur = PRIORITY_LEVELS[p] || 0;
    return Object.entries(PRIORITY_LEVELS).filter(([,l]) => l >= cur).map(([n]) => n);
  };

  const totalCount     = incidents.length;
  const openCount      = incidents.filter(i => i.status==="open").length;
  const inProgCount    = incidents.filter(i => i.status==="in_progress").length;
  const resolvedCount  = incidents.filter(i => i.status==="resolved").length;
  const criticalCount  = incidents.filter(i => i.priority==="critical" && i.status!=="resolved").length;

  let displayed = [...incidents];
  if (filter !== "all") displayed = displayed.filter(i => i.status === filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    displayed = displayed.filter(i => i.title.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
  }
  const sortOptions = { newest:"Newest First", oldest:"Oldest First", priority_high:"Priority: High → Low", priority_low:"Priority: Low → High" };
  displayed.sort((a, b) => {
    if (sort === "newest")       return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === "oldest")       return new Date(a.createdAt) - new Date(b.createdAt);
    if (sort === "priority_high") return PRIORITY_LEVELS[b.priority] - PRIORITY_LEVELS[a.priority];
    if (sort === "priority_low")  return PRIORITY_LEVELS[a.priority] - PRIORITY_LEVELS[b.priority];
    return 0;
  });

  const STATS = [
    { label:"Total",       value:totalCount,    color:"#4f46e5", gradient:"linear-gradient(135deg,#4f46e5,#7c3aed)", icon:<BarChart3 size={20}/>,  shadow:"rgba(79,70,229,0.3)" },
    { label:"Open",        value:openCount,     color:"#f97316", gradient:"linear-gradient(135deg,#f97316,#ef4444)", icon:<AlertTriangle size={20}/>, shadow:"rgba(249,115,22,0.3)" },
    { label:"In Progress", value:inProgCount,   color:"#3b82f6", gradient:"linear-gradient(135deg,#3b82f6,#6366f1)", icon:<Clock size={20}/>,        shadow:"rgba(59,130,246,0.3)" },
    { label:"Resolved",    value:resolvedCount, color:"#22c55e", gradient:"linear-gradient(135deg,#22c55e,#10b981)", icon:<CheckCircle2 size={20}/>,  shadow:"rgba(34,197,94,0.3)" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#f0f0ff", fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse-dot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.7} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{background-position:-1000px 0} 100%{background-position:1000px 0} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .stat-card { transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1); cursor:default; }
        .stat-card:hover { transform:translateY(-10px) scale(1.02); }
        .incident-card { transition:all 0.25s cubic-bezier(0.4,0,0.2,1); }
        .incident-card:hover { transform:translateY(-4px) translateX(3px); }
        .action-btn { transition:all 0.2s ease; }
        .action-btn:hover { transform:translateY(-2px); filter:brightness(1.1); }
        .filter-pill { transition:all 0.2s ease; cursor:pointer; }
        .filter-pill:hover { transform:scale(1.04); }
        .sort-item:hover { background:#f5f3ff !important; color:#4f46e5 !important; }
        @media(max-width:900px) { .dash-grid{grid-template-columns:1fr !important} .stats-row{grid-template-columns:repeat(2,1fr) !important} .dash-header-center{display:none !important} }
        @media(max-width:540px) { .stats-row{grid-template-columns:1fr 1fr !important} .header-actions{gap:8px !important} }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ background:"linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e3a8a 100%)", padding:"0 24px", position:"sticky", top:0, zIndex:100, boxShadow:"0 4px 32px rgba(0,0,0,0.25)" }}>
        {/* Subtle animated shimmer on header */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.03),transparent)", backgroundSize:"1000px 100%", animation:"shimmer 8s linear infinite", pointerEvents:"none" }} />
        <div style={{ maxWidth:"1400px", margin:"0 auto", display:"flex", alignItems:"center", gap:"16px", height:"68px", position:"relative" }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:"10px", flexShrink:0 }}>
            <div style={{ width:"38px", height:"38px", borderRadius:"12px", background:"linear-gradient(135deg,#7c3aed,#a855f7)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px rgba(124,58,237,0.4)", animation:"float 4s ease-in-out infinite", flexShrink:0 }}>
              <Shield size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize:"16px", fontWeight:800, color:"white", letterSpacing:"-0.3px" }}>Incident Manager</div>
              <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.45)", lineHeight:"1" }}>v2.0 · {role === "RESOLVER" ? "All incidents" : "My incidents"}</div>
            </div>
          </div>

          {/* Search bar */}
          <div className="dash-header-center" style={{ flex:1, maxWidth:"380px", margin:"0 auto" }}>
            <div style={{ position:"relative" }}>
              <Search size={15} style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.4)" }} />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search incidents…"
                style={{ width:"100%", padding:"9px 14px 9px 36px", borderRadius:"12px", border:"1.5px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.1)", color:"white", fontSize:"13px", boxSizing:"border-box", fontFamily:"inherit", outline:"none" }}
              />
              {search && <button onClick={() => setSearch("")} style={{ position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,0.5)", cursor:"pointer", display:"flex" }}><X size={14}/></button>}
            </div>
          </div>

          {/* Right: user + logout */}
          <div className="header-actions" style={{ display:"flex", alignItems:"center", gap:"12px", marginLeft:"auto", flexShrink:0 }}>
            {criticalCount > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", padding:"5px 10px", borderRadius:"999px" }}>
                <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#ef4444", animation:"pulse-dot 1.2s ease-in-out infinite" }} />
                <span style={{ fontSize:"12px", color:"#fca5a5", fontWeight:700 }}>{criticalCount} Critical</span>
              </div>
            )}
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{ width:"34px", height:"34px", borderRadius:"10px", background:"linear-gradient(135deg,#7c3aed,#4f46e5)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:700, fontSize:"14px", flexShrink:0 }}>
                {initials(user?.email)}
              </div>
              <div style={{ display:"none" }}>
                <div style={{ fontSize:"13px", fontWeight:600, color:"white" }}>{user?.email}</div>
                <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.45)", textTransform:"capitalize" }}>{role?.toLowerCase()}</div>
              </div>
            </div>
            <span style={{ fontSize:"11px", padding:"4px 10px", borderRadius:"999px", background:"rgba(167,139,250,0.2)", color:"#c4b5fd", fontWeight:700, border:"1px solid rgba(167,139,250,0.25)", textTransform:"capitalize" }}>
              {role?.toLowerCase()}
            </span>
            <button onClick={handleLogout} style={{ display:"flex", alignItems:"center", gap:"6px", padding:"7px 12px", borderRadius:"10px", border:"1px solid rgba(239,68,68,0.35)", background:"rgba(239,68,68,0.12)", color:"#fca5a5", fontSize:"12px", fontWeight:600, cursor:"pointer", transition:"all 0.2s" }}>
              <LogOut size={14}/> Logout
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth:"1400px", margin:"0 auto", padding:"28px 20px" }}>

        {/* ── STATS ROW ── */}
        <div className="stats-row" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"16px", marginBottom:"28px" }}>
          {STATS.map((s, i) => (
            <div key={s.label} className="stat-card" style={{ background:"white", borderRadius:"20px", padding:"22px 20px", boxShadow:`0 8px 40px ${s.shadow}`, border:"1px solid rgba(0,0,0,0.04)", position:"relative", overflow:"hidden", animation:`slideUp 0.5s ease-out ${i*0.08}s both` }}>
              {/* Gradient top border */}
              <div style={{ position:"absolute", top:0, left:0, right:0, height:"4px", background:s.gradient, borderRadius:"20px 20px 0 0" }} />
              {/* Background accent */}
              <div style={{ position:"absolute", bottom:"-20px", right:"-20px", width:"80px", height:"80px", borderRadius:"50%", background:s.gradient, opacity:0.08 }} />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"14px" }}>
                <div style={{ fontSize:"13px", color:"#6b7280", fontWeight:500 }}>{s.label}</div>
                <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:s.gradient, display:"flex", alignItems:"center", justifyContent:"center", color:"white", boxShadow:`0 4px 12px ${s.shadow}` }}>{s.icon}</div>
              </div>
              <div style={{ fontSize:"34px", fontWeight:800, color:"#111827", letterSpacing:"-1px" }}>
                <Counter value={s.value} />
              </div>
              {s.label !== "Total" && totalCount > 0 && (
                <div style={{ fontSize:"11px", color:"#9ca3af", marginTop:"4px" }}>
                  {Math.round((s.value / totalCount) * 100)}% of total
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── MAIN GRID ── */}
        <div className="dash-grid" style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:"20px", alignItems:"flex-start" }}>

          {/* LEFT: Incident list */}
          <div style={{ background:"white", borderRadius:"24px", boxShadow:"0 8px 40px rgba(79,70,229,0.08)", border:"1px solid rgba(79,70,229,0.08)", overflow:"hidden", animation:"slideUp 0.5s ease-out 0.2s both" }}>
            {/* Card header */}
            <div style={{ padding:"20px 22px 0", borderBottom:"1px solid #f3f4f6" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
                <div>
                  <div style={{ fontSize:"17px", fontWeight:800, color:"#111827" }}>
                    {role === "RESOLVER" ? "All Incidents" : "My Incidents"}
                  </div>
                  <div style={{ fontSize:"12px", color:"#9ca3af", marginTop:"2px" }}>
                    {displayed.length} {displayed.length === 1 ? "result" : "results"}
                    {search && <span> for "<strong>{search}</strong>"</span>}
                  </div>
                </div>
                <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                  {/* Sort */}
                  <div ref={sortRef} style={{ position:"relative" }}>
                    <button onClick={() => setShowSortMenu(!showSortMenu)} style={{ display:"flex", alignItems:"center", gap:"6px", padding:"7px 12px", borderRadius:"10px", border:"1.5px solid #e5e7eb", background:"white", color:"#374151", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>
                      <SlidersHorizontal size={13}/> Sort <ChevronDown size={12}/>
                    </button>
                    {showSortMenu && (
                      <div style={{ position:"absolute", right:0, top:"calc(100% + 6px)", background:"white", borderRadius:"14px", boxShadow:"0 16px 60px rgba(0,0,0,0.15)", border:"1px solid #e5e7eb", overflow:"hidden", minWidth:"190px", zIndex:200 }}>
                        {Object.entries(sortOptions).map(([k,v]) => (
                          <div key={k} className="sort-item" onClick={() => { setSort(k); setShowSortMenu(false); }}
                            style={{ padding:"11px 16px", fontSize:"13px", cursor:"pointer", fontWeight:sort===k?700:400, color:sort===k?"#4f46e5":"#374151", background:sort===k?"#f5f3ff":"white", display:"flex", alignItems:"center", gap:"8px" }}>
                            {sort===k && <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#4f46e5"}}/>}
                            {v}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* New incident button */}
                  {role === "REPORTER" && (
                    <button onClick={() => setShowForm(p => !p)} style={{ display:"flex", alignItems:"center", gap:"6px", padding:"8px 14px", borderRadius:"10px", border:"none", background:showForm?"#6b7280":"linear-gradient(135deg,#4f46e5,#7c3aed)", color:"white", fontSize:"12px", fontWeight:700, cursor:"pointer", boxShadow:showForm?"none":"0 4px 16px rgba(79,70,229,0.35)", transition:"all 0.2s" }}>
                      {showForm ? <><X size={13}/> Cancel</> : <><Plus size={13}/> New Incident</>}
                    </button>
                  )}
                </div>
              </div>

              {/* Filter pills */}
              <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", paddingBottom:"16px" }}>
                {[
                  { key:"all",         label:"All",         count:incidents.length },
                  { key:"open",        label:"Open",        count:openCount },
                  { key:"in_progress", label:"In Progress", count:inProgCount },
                  { key:"resolved",    label:"Resolved",    count:resolvedCount },
                ].map(({ key, label, count }) => (
                  <button key={key} className="filter-pill" onClick={() => setFilter(key)} style={{
                    padding:"5px 12px", borderRadius:"999px", border:"none",
                    background: filter===key ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "#f3f4f6",
                    color: filter===key ? "white" : "#6b7280",
                    fontSize:"12px", fontWeight:700, cursor:"pointer",
                    boxShadow: filter===key ? "0 4px 12px rgba(79,70,229,0.3)" : "none",
                  }}>
                    {label} <span style={{ opacity:0.7, fontWeight:500 }}>({count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Incident list body */}
            <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column", gap:"12px" }}>
              {loading ? (
                <div style={{ padding:"60px", textAlign:"center" }}>
                  <div style={{ width:"32px", height:"32px", border:"3px solid #ede9fe", borderTop:"3px solid #7c3aed", borderRadius:"50%", animation:"spin 0.7s linear infinite", margin:"0 auto 12px" }} />
                  <div style={{ fontSize:"14px", color:"#9ca3af" }}>Loading incidents…</div>
                </div>
              ) : displayed.length === 0 ? (
                <div style={{ padding:"60px 20px", textAlign:"center" }}>
                  <div style={{ fontSize:"48px", marginBottom:"12px" }}>{search ? "🔍" : filter==="all" ? "📋" : "✅"}</div>
                  <div style={{ fontSize:"16px", fontWeight:600, color:"#374151", marginBottom:"6px" }}>
                    {search ? "No results found" : filter==="all" && role==="REPORTER" ? "No incidents yet" : `No ${filter.replace("_"," ")} incidents`}
                  </div>
                  <div style={{ fontSize:"13px", color:"#9ca3af" }}>
                    {search ? "Try different keywords" : filter==="all" && role==="REPORTER" ? 'Click "+ New Incident" to report one' : "They\'ll appear here once created"}
                  </div>
                </div>
              ) : displayed.map((inc, idx) => {
                const p = PRI[inc.priority] || PRI.low;
                const s = STA[inc.status] || STA.open;
                const isUpdating = updatingId === inc.id;
                return (
                  <div key={inc.id} className="incident-card" style={{ borderRadius:"16px", border:"1px solid #e5e7eb", borderLeft:`4px solid ${p.border}`, background:"white", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.04)", opacity:isUpdating?0.6:1, animation:`slideUp 0.4s ease-out ${idx*0.04}s both` }}>
                    <div style={{ padding:"16px 18px" }}>
                      <div style={{ display:"flex", gap:"12px", alignItems:"flex-start" }}>
                        {/* Priority dot */}
                        <div style={{ paddingTop:"4px", flexShrink:0 }}>
                          <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:p.dot, boxShadow:`0 0 0 3px ${p.glow}`, ...(inc.priority==="critical" && {animation:"pulse-dot 1.5s ease-in-out infinite"}) }} />
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", gap:"10px", alignItems:"flex-start", flexWrap:"wrap" }}>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:"15px", fontWeight:700, color:"#111827", marginBottom:"4px", lineHeight:"1.3" }}>{inc.title}</div>
                              {inc.description && <div style={{ fontSize:"13px", color:"#6b7280", lineHeight:"1.6", marginBottom:"8px" }}>{inc.description}</div>}
                              <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", alignItems:"center", fontSize:"11px", color:"#9ca3af" }}>
                                <span style={{ display:"flex", alignItems:"center", gap:"3px" }}>
                                  <div style={{ width:"18px", height:"18px", borderRadius:"5px", background:"linear-gradient(135deg,#7c3aed,#4f46e5)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:"9px", fontWeight:700 }}>{initials(inc.reporter?.email)}</div>
                                  {inc.reporter?.email}
                                </span>
                                <span>·</span>
                                <span style={{ display:"flex", alignItems:"center", gap:"3px" }}><Clock size={10}/> {formatDate(inc.createdAt)}</span>
                                <span>·</span>
                                <span style={{ color:"#c4b5fd" }}>#{inc.id}</span>
                              </div>
                            </div>
                            <div style={{ display:"flex", flexDirection:"column", gap:"5px", alignItems:"flex-end", flexShrink:0 }}>
                              <span style={{ padding:"3px 10px", borderRadius:"999px", fontSize:"11px", fontWeight:700, background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>{s.label}</span>
                              <span style={{ padding:"3px 10px", borderRadius:"999px", fontSize:"11px", fontWeight:700, background:p.bg, color:p.color }}>{p.label}</span>
                            </div>
                          </div>

                          {/* Resolution notes display */}
                          {inc.notes && (
                            <div style={{ marginTop:"10px", padding:"10px 12px", borderRadius:"10px", background:"#f0fdf4", border:"1px solid #bbf7d0", fontSize:"12px", color:"#166534", display:"flex", gap:"6px" }}>
                              <MessageSquare size={13} style={{ marginTop:"1px", flexShrink:0 }} />
                              <span><strong>Resolution note:</strong> {inc.notes}</span>
                            </div>
                          )}

                          {/* Resolver controls */}
                          {role === "RESOLVER" && inc.status !== "resolved" && (
                            <div style={{ marginTop:"12px", paddingTop:"12px", borderTop:"1px solid #f3f4f6", display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>
                              {inc.status === "open" && (
                                <button className="action-btn" onClick={() => handleUpdate(inc.id, { status:"in_progress" })} disabled={isUpdating}
                                  style={{ display:"flex", alignItems:"center", gap:"5px", padding:"6px 14px", borderRadius:"10px", border:"none", background:"linear-gradient(135deg,#3b82f6,#6366f1)", color:"white", fontSize:"12px", fontWeight:700, cursor:"pointer", boxShadow:"0 3px 10px rgba(59,130,246,0.3)" }}>
                                  <Zap size={12}/> Start Work
                                </button>
                              )}
                              {inc.status === "in_progress" && (
                                <button className="action-btn" onClick={() => setResolvingIncident(inc.id)} disabled={isUpdating}
                                  style={{ display:"flex", alignItems:"center", gap:"5px", padding:"6px 14px", borderRadius:"10px", border:"none", background:"linear-gradient(135deg,#22c55e,#16a34a)", color:"white", fontSize:"12px", fontWeight:700, cursor:"pointer", boxShadow:"0 3px 10px rgba(34,197,94,0.3)" }}>
                                  <CheckCircle2 size={12}/> Mark Resolved
                                </button>
                              )}
                              <select value={inc.priority} disabled={isUpdating}
                                onChange={(e) => { if (e.target.value !== inc.priority) handleUpdate(inc.id, { priority:e.target.value }); }}
                                style={{ padding:"5px 8px", borderRadius:"8px", border:"1.5px solid #e5e7eb", fontSize:"11px", fontWeight:700, cursor:"pointer", background:"white", color:"#374151" }}>
                                {getUpgradablePriorities(inc.priority).map(p => (
                                  <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>
                                ))}
                              </select>
                              <span style={{ fontSize:"10px", color:"#c4b5fd", fontStyle:"italic", display:"flex", alignItems:"center", gap:"3px" }}>
                                <ArrowUpRight size={10}/> upgrade only
                              </span>
                            </div>
                          )}
                          {role === "RESOLVER" && inc.status === "resolved" && (
                            <div style={{ marginTop:"10px", display:"flex", alignItems:"center", gap:"5px", fontSize:"12px", color:"#16a34a", fontWeight:600 }}>
                              <CheckCircle2 size={13}/> Resolved
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div style={{ display:"flex", flexDirection:"column", gap:"16px", animation:"slideInRight 0.5s ease-out 0.25s both" }}>
            {role === "REPORTER" ? (
              <div style={{ background:"white", borderRadius:"24px", boxShadow:"0 8px 40px rgba(79,70,229,0.08)", border:"1px solid rgba(79,70,229,0.08)", overflow:"hidden" }}>
                {/* Header */}
                <div style={{ background:"linear-gradient(135deg,#4f46e5,#7c3aed)", padding:"20px 22px" }}>
                  <div style={{ fontSize:"16px", fontWeight:800, color:"white", marginBottom:"3px" }}>Report an Incident</div>
                  <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.65)" }}>Spotted an issue? Let the team know.</div>
                </div>
                <div style={{ padding:"20px 22px" }}>
                  {showForm ? (
                    <IncidentForm onSuccess={() => { fetchIncidents(); setShowForm(false); }} />
                  ) : (
                    <div style={{ textAlign:"center", padding:"24px 0" }}>
                      <div style={{ width:"60px", height:"60px", borderRadius:"18px", background:"linear-gradient(135deg,#ede9fe,#ddd6fe)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", fontSize:"28px" }}>📣</div>
                      <p style={{ fontSize:"13px", color:"#6b7280", marginBottom:"18px", lineHeight:"1.7" }}>Found something broken or concerning? File a report so the team can respond quickly.</p>
                      <button onClick={() => setShowForm(true)} style={{ display:"inline-flex", alignItems:"center", gap:"7px", padding:"11px 20px", borderRadius:"14px", border:"none", background:"linear-gradient(135deg,#4f46e5,#7c3aed)", color:"white", fontSize:"13px", fontWeight:700, cursor:"pointer", boxShadow:"0 4px 16px rgba(79,70,229,0.35)", transition:"all 0.2s" }}>
                        <Plus size={16}/> Create Incident Report
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ background:"white", borderRadius:"24px", boxShadow:"0 8px 40px rgba(79,70,229,0.08)", border:"1px solid rgba(79,70,229,0.08)", overflow:"hidden" }}>
                <div style={{ background:"linear-gradient(135deg,#1e1b4b,#312e81)", padding:"20px 22px" }}>
                  <div style={{ fontSize:"16px", fontWeight:800, color:"white", marginBottom:"3px" }}>Resolver Dashboard</div>
                  <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.55)" }}>Manage & resolve team incidents</div>
                </div>
                <div style={{ padding:"20px 22px" }}>
                  {/* Breakdown */}
                  {[
                    { label:"Open", value:openCount, color:"#f97316", width:`${totalCount?Math.round((openCount/totalCount)*100):0}%` },
                    { label:"In Progress", value:inProgCount, color:"#3b82f6", width:`${totalCount?Math.round((inProgCount/totalCount)*100):0}%` },
                    { label:"Resolved", value:resolvedCount, color:"#22c55e", width:`${totalCount?Math.round((resolvedCount/totalCount)*100):0}%` },
                  ].map(({ label, value, color, width }) => (
                    <div key={label} style={{ marginBottom:"14px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", marginBottom:"5px" }}>
                        <span style={{ color:"#374151", fontWeight:600 }}>{label}</span>
                        <span style={{ color, fontWeight:700 }}>{value}</span>
                      </div>
                      <div style={{ height:"6px", borderRadius:"3px", background:"#f3f4f6", overflow:"hidden" }}>
                        <div style={{ height:"100%", width, background:color, borderRadius:"3px", transition:"width 0.8s cubic-bezier(0.34,1.56,0.64,1)" }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop:"20px", padding:"12px", borderRadius:"12px", background:"#fffbeb", border:"1px solid #fde68a" }}>
                    <div style={{ fontSize:"12px", fontWeight:700, color:"#92400e", marginBottom:"4px", display:"flex", alignItems:"center", gap:"6px" }}>
                      <Filter size={12}/> Priority Rule
                    </div>
                    <div style={{ fontSize:"11px", color:"#78350f", lineHeight:"1.6" }}>
                      Priority can only be upgraded (Low → Critical). Downgrades are blocked at the API level.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tips card */}
            <div style={{ background:"linear-gradient(135deg,#4f46e5,#7c3aed)", borderRadius:"20px", padding:"20px", boxShadow:"0 8px 32px rgba(79,70,229,0.3)" }}>
              <div style={{ fontSize:"13px", fontWeight:700, color:"white", marginBottom:"12px", display:"flex", alignItems:"center", gap:"6px" }}>
                <TrendingUp size={14}/> Quick Tips
              </div>
              {[
                role==="REPORTER" ? "Critical incidents get immediate attention — use wisely." : "Start with \"Open\" filter to find unassigned incidents.",
                role==="REPORTER" ? "Provide detailed descriptions so resolvers can act fast." : "Add resolution notes when closing for future reference.",
              ].map((tip, i) => (
                <div key={i} style={{ display:"flex", gap:"8px", marginBottom:"8px", fontSize:"12px", color:"rgba(255,255,255,0.75)", lineHeight:"1.5" }}>
                  <span style={{ flexShrink:0, color:"#a78bfa" }}>→</span>
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notes modal */}
      {resolvingIncident && <NotesModal onConfirm={handleResolveConfirm} onCancel={() => setResolvingIncident(null)} />}
    </div>
  );
}
