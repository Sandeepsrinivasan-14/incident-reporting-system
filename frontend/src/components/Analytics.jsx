import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  BarChart3, TrendingUp, Clock, AlertTriangle, CheckCircle2,
  ArrowLeft, Shield, Users, Zap, Target, Activity,
} from "lucide-react";
import useAuth from "./AuthContext";
import { useToast } from "./Toast";

function MiniBar({ value, max, color }) {
  return (
    <div style={{ height: "8px", borderRadius: "4px", background: "rgba(255,255,255,0.15)", overflow: "hidden", flex: 1 }}>
      <div style={{ height: "100%", width: `${max ? Math.round((value / max) * 100) : 0}%`, background: color, borderRadius: "4px", transition: "width 1s cubic-bezier(0.34,1.56,0.64,1)" }} />
    </div>
  );
}

// Simple SVG line chart
function LineChart({ data, color = "#7c3aed" }) {
  if (!data || data.length < 2) return <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", textAlign: "center", padding: "40px" }}>No data yet</div>;
  const max = Math.max(...data.map(d => d.count), 1);
  const W = 500, H = 120, PAD = 8;
  const pts = data.map((d, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: H - PAD - (d.count / max) * (H - PAD * 2),
    count: d.count,
    date: d.date,
  }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${path} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "120px" }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#areaGrad)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => p.count > 0 && (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} stroke="white" strokeWidth="1.5">
          <title>{p.date}: {p.count} incident{p.count !== 1 ? "s" : ""}</title>
        </circle>
      ))}
      {/* X-axis labels — every 7th */}
      {pts.filter((_, i) => i % 7 === 0).map((p, i) => (
        <text key={i} x={p.x} y={H - 1} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.35)">{p.date.slice(5)}</text>
      ))}
    </svg>
  );
}

// Donut chart
function Donut({ segments }) {
  const total = segments.reduce((s, g) => s + g.value, 0);
  if (total === 0) return <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", textAlign: "center", padding: "20px" }}>No data</div>;
  let offset = 0;
  const R = 38, CX = 52, CY = 52, stroke = 18;
  const circ = 2 * Math.PI * R;
  return (
    <svg viewBox="0 0 104 104" style={{ width: "104px", height: "104px", flexShrink: 0 }}>
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * circ;
        const el = (
          <circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={seg.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset * circ}
            transform={`rotate(-90 ${CX} ${CY})`} strokeLinecap="butt">
            <title>{seg.label}: {seg.value}</title>
          </circle>
        );
        offset += pct;
        return el;
      })}
      <text x={CX} y={CY + 5} textAnchor="middle" fontSize="18" fontWeight="800" fill="white">{total}</text>
    </svg>
  );
}

export default function Analytics() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetch("/api/analytics", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d.error)))
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { toast(e || "Failed to load analytics", "error"); setLoading(false); });
  }, [token, navigate, toast]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f0a1e,#1a1040,#0d1b3e)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <div style={{ textAlign: "center", color: "white" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid rgba(124,58,237,0.3)", borderTop: "3px solid #7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 16px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        Loading analytics…
      </div>
    </div>
  );

  const prioritySegments = [
    { label: "Critical", value: data?.byPriority?.critical || 0, color: "#ef4444" },
    { label: "High",     value: data?.byPriority?.high     || 0, color: "#f97316" },
    { label: "Medium",   value: data?.byPriority?.medium   || 0, color: "#eab308" },
    { label: "Low",      value: data?.byPriority?.low      || 0, color: "#22c55e" },
  ];
  const statusSegments = [
    { label: "Open",        value: data?.byStatus?.open        || 0, color: "#f97316" },
    { label: "In Progress", value: data?.byStatus?.in_progress || 0, color: "#3b82f6" },
    { label: "Resolved",    value: data?.byStatus?.resolved    || 0, color: "#22c55e" },
  ];

  const CARD = { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "20px", padding: "24px", backdropFilter: "blur(20px)" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f0a1e 0%,#1a1040 50%,#0d1b3e 100%)", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Header */}
      <header style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "0 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", gap: "16px", height: "64px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "11px", background: "linear-gradient(135deg,#7c3aed,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={18} color="white" />
          </div>
          <span style={{ fontSize: "16px", fontWeight: 800, color: "white" }}>Analytics</span>
          <Link to="/dashboard" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.6)", fontSize: "13px", textDecoration: "none", padding: "7px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)" }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "28px 20px" }}>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Total Incidents",   value: data?.totalIncidents || 0,         icon: <BarChart3 size={20}/>,    color: "#7c3aed", gradient: "linear-gradient(135deg,#7c3aed,#a855f7)" },
            { label: "Resolution Rate",   value: `${data?.resolutionRate || 0}%`,   icon: <CheckCircle2 size={20}/>, color: "#22c55e", gradient: "linear-gradient(135deg,#22c55e,#10b981)" },
            { label: "Avg. Resolution",   value: `${data?.mttr || 0}h`,            icon: <Clock size={20}/>,        color: "#3b82f6", gradient: "linear-gradient(135deg,#3b82f6,#6366f1)" },
            { label: "SLA Breached",      value: data?.slaBreached || 0,            icon: <AlertTriangle size={20}/>, color: "#ef4444", gradient: "linear-gradient(135deg,#ef4444,#dc2626)" },
            { label: "Resolved Total",    value: data?.resolvedCount || 0,          icon: <Target size={20}/>,       color: "#f59e0b", gradient: "linear-gradient(135deg,#f59e0b,#f97316)" },
          ].map((k, i) => (
            <div key={k.label} style={{ ...CARD, animation: `slideUp 0.4s ease-out ${i * 0.06}s both` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{k.label}</span>
                <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: k.gradient, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>{k.icon}</div>
              </div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "white", letterSpacing: "-1px" }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Line chart */}
        <div style={{ ...CARD, marginBottom: "24px", animation: "slideUp 0.4s ease-out 0.3s both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <Activity size={18} color="#a78bfa" />
            <span style={{ fontSize: "15px", fontWeight: 700, color: "white" }}>Incidents Created — Last 30 Days</span>
          </div>
          <LineChart data={data?.dailyCreated || []} color="#7c3aed" />
        </div>

        {/* Donut charts + top reporters */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "24px" }}>

          {/* By Priority */}
          <div style={{ ...CARD, animation: "slideUp 0.4s ease-out 0.35s both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              <Zap size={16} color="#a78bfa" />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>By Priority</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Donut segments={prioritySegments} />
              <div style={{ flex: 1 }}>
                {prioritySegments.map(s => (
                  <div key={s.label} style={{ marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{s.label}</span>
                      <span style={{ color: s.color, fontWeight: 700 }}>{s.value}</span>
                    </div>
                    <MiniBar value={s.value} max={data?.totalIncidents} color={s.color} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* By Status */}
          <div style={{ ...CARD, animation: "slideUp 0.4s ease-out 0.4s both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              <TrendingUp size={16} color="#a78bfa" />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>By Status</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Donut segments={statusSegments} />
              <div style={{ flex: 1 }}>
                {statusSegments.map(s => (
                  <div key={s.label} style={{ marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{s.label}</span>
                      <span style={{ color: s.color, fontWeight: 700 }}>{s.value}</span>
                    </div>
                    <MiniBar value={s.value} max={data?.totalIncidents} color={s.color} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top reporters */}
          <div style={{ ...CARD, animation: "slideUp 0.4s ease-out 0.45s both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              <Users size={16} color="#a78bfa" />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>Top Reporters</span>
            </div>
            {(data?.topReporters || []).length === 0 ? (
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", textAlign: "center", paddingTop: "20px" }}>No data yet</div>
            ) : (data?.topReporters || []).map((r, i) => (
              <div key={r.email} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div style={{ width: "26px", height: "26px", borderRadius: "8px", background: `linear-gradient(135deg,${["#7c3aed","#3b82f6","#22c55e","#f97316","#eab308"][i % 5]},${["#a855f7","#6366f1","#10b981","#ef4444","#f59e0b"][i % 5]})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>
                  {r.email.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.email}</div>
                  <div style={{ height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.1)", overflow: "hidden", marginTop: "4px" }}>
                    <div style={{ height: "100%", width: `${(r.count / (data?.topReporters[0]?.count || 1)) * 100}%`, background: ["#7c3aed","#3b82f6","#22c55e","#f97316","#eab308"][i % 5], borderRadius: "2px", transition: "width 1s ease" }} />
                  </div>
                </div>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "white" }}>{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SLA info */}
        <div style={{ ...CARD, animation: "slideUp 0.4s ease-out 0.5s both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Clock size={16} color="#a78bfa" />
            <span style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>SLA Reference</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
            {[{ p: "Critical", h: 1, c: "#ef4444" }, { p: "High", h: 4, c: "#f97316" }, { p: "Medium", h: 24, c: "#eab308" }, { p: "Low", h: 72, c: "#22c55e" }].map(s => (
              <div key={s.p} style={{ padding: "14px", borderRadius: "14px", background: `${s.c}15`, border: `1px solid ${s.c}35`, textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: 800, color: s.c }}>{s.h}h</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginTop: "4px", fontWeight: 600 }}>{s.p}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
