import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Zap, BarChart2, Users, Eye, EyeOff, ArrowRight } from "lucide-react";
import useAuth from "./AuthContext";

const FEATURES = [
  { icon: <Shield size={18} />, title: "Secure by Design", desc: "JWT auth + bcrypt + rate limiting" },
  { icon: <Zap size={18} />, title: "Real-time Tracking", desc: "Live status updates across your team" },
  { icon: <BarChart2 size={18} />, title: "Priority Rules", desc: "Immutable escalation enforced at API level" },
  { icon: <Users size={18} />, title: "Role-based Access", desc: "Reporter & Resolver roles built-in" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Login failed"); }
      const d = await res.json();
      login(d.token, d.user.role, d.user);
      navigate("/dashboard");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const quickFill = (e, p) => { setEmail(e); setPassword(p); };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Segoe UI',system-ui,sans-serif", overflow: "hidden", position: "relative" }}>
      <style>{`
        @keyframes drift {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(60px,-40px) scale(1.15); }
          66% { transform: translate(-30px,50px) scale(0.9); }
        }
        @keyframes float3d {
          0%,100% { transform: perspective(600px) rotateX(25deg) rotateY(-15deg) rotateZ(3deg) translateY(0); }
          50% { transform: perspective(600px) rotateX(28deg) rotateY(-12deg) rotateZ(5deg) translateY(-18px); }
        }
        @keyframes floatB {
          0%,100% { transform: perspective(600px) rotateX(-20deg) rotateY(18deg) translateY(0); }
          50% { transform: perspective(600px) rotateX(-24deg) rotateY(22deg) translateY(-14px); }
        }
        @keyframes spinRing {
          from { transform: perspective(400px) rotateX(65deg) rotateZ(0deg); }
          to   { transform: perspective(400px) rotateX(65deg) rotateZ(360deg); }
        }
        @keyframes slideInRight {
          from { opacity:0; transform: translateX(30px); }
          to   { opacity:1; transform: translateX(0); }
        }
        @keyframes slideUp {
          from { opacity:0; transform: translateY(24px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%,100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(139,92,246,0); }
        }
        .login-input:focus { outline:none; border-color:#7c3aed !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.18) !important; }
        .login-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(124,58,237,0.5) !important; }
        .feature-card:hover { transform: translateX(4px); background: rgba(255,255,255,0.12) !important; }
        .quick-btn:hover { background: rgba(255,255,255,0.15) !important; transform: scale(1.02); }
        @media (max-width:768px) { .login-left { display:none !important; } .login-right { padding: 24px !important; } }
      `}</style>

      {/* ── Aurora background ── */}
      <div style={{ position:"fixed", inset:0, background:"linear-gradient(135deg,#0f0a1e 0%,#1a1040 40%,#0d1b3e 100%)", zIndex:0 }} />
      <div style={{ position:"fixed", width:"700px", height:"700px", borderRadius:"50%", background:"radial-gradient(circle,rgba(139,92,246,0.35),transparent 70%)", top:"-200px", left:"-150px", animation:"drift 18s ease-in-out infinite", zIndex:0, pointerEvents:"none" }} />
      <div style={{ position:"fixed", width:"500px", height:"500px", borderRadius:"50%", background:"radial-gradient(circle,rgba(59,130,246,0.3),transparent 70%)", top:"50%", right:"-100px", animation:"drift 14s ease-in-out infinite reverse", zIndex:0, pointerEvents:"none" }} />
      <div style={{ position:"fixed", width:"400px", height:"400px", borderRadius:"50%", background:"radial-gradient(circle,rgba(236,72,153,0.25),transparent 70%)", bottom:"-100px", left:"30%", animation:"drift 20s ease-in-out infinite 4s", zIndex:0, pointerEvents:"none" }} />
      <div style={{ position:"fixed", width:"300px", height:"300px", borderRadius:"50%", background:"radial-gradient(circle,rgba(20,184,166,0.2),transparent 70%)", top:"20%", left:"20%", animation:"drift 16s ease-in-out infinite 2s", zIndex:0, pointerEvents:"none" }} />

      {/* ── 3D floating shapes ── */}
      <div style={{ position:"fixed", width:"160px", height:"160px", borderRadius:"28px", background:"linear-gradient(135deg,rgba(139,92,246,0.2),rgba(59,130,246,0.2))", border:"1px solid rgba(255,255,255,0.12)", backdropFilter:"blur(20px)", boxShadow:"0 30px 80px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.15)", animation:"float3d 7s ease-in-out infinite", top:"12%", right:"8%", zIndex:1, pointerEvents:"none" }} />
      <div style={{ position:"fixed", width:"90px", height:"90px", borderRadius:"50%", background:"radial-gradient(circle at 30% 30%,rgba(236,72,153,0.5),rgba(139,92,246,0.3))", boxShadow:"0 0 40px rgba(236,72,153,0.3)", animation:"floatB 5s ease-in-out infinite", bottom:"25%", right:"15%", zIndex:1, pointerEvents:"none" }} />
      <div style={{ position:"fixed", width:"120px", height:"120px", borderRadius:"50%", border:"6px solid rgba(99,102,241,0.35)", boxShadow:"0 0 30px rgba(99,102,241,0.2)", animation:"spinRing 14s linear infinite", top:"55%", left:"5%", zIndex:1, pointerEvents:"none" }} />
      <div style={{ position:"fixed", width:"60px", height:"60px", borderRadius:"14px", background:"linear-gradient(135deg,rgba(20,184,166,0.3),rgba(59,130,246,0.3))", border:"1px solid rgba(255,255,255,0.15)", animation:"float3d 9s ease-in-out infinite 3s", bottom:"15%", left:"10%", zIndex:1, pointerEvents:"none" }} />

      {/* ── Main content ── */}
      <div style={{ position:"relative", zIndex:2, display:"flex", width:"100%", alignItems:"stretch" }}>

        {/* LEFT PANEL */}
        <div className="login-left" style={{ flex:"0 0 48%", display:"flex", flexDirection:"column", justifyContent:"center", padding:"60px 56px", animation:"slideUp 0.7s ease-out" }}>
          {/* Brand */}
          <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"16px" }}>
            <div style={{ width:"52px", height:"52px", borderRadius:"16px", background:"linear-gradient(135deg,#7c3aed,#a855f7)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 32px rgba(124,58,237,0.4)", fontSize:"26px" }}>🛡️</div>
            <div>
              <div style={{ fontSize:"26px", fontWeight:800, color:"white", letterSpacing:"-0.5px" }}>Incident Manager</div>
              <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.55)" }}>Enterprise incident tracking</div>
            </div>
          </div>

          <h2 style={{ fontSize:"42px", fontWeight:800, color:"white", lineHeight:"1.15", marginBottom:"12px", letterSpacing:"-1px" }}>
            Resolve incidents<br />
            <span style={{ background:"linear-gradient(135deg,#a78bfa,#38bdf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>faster than ever.</span>
          </h2>
          <p style={{ fontSize:"16px", color:"rgba(255,255,255,0.6)", marginBottom:"40px", lineHeight:"1.7" }}>
            A smart, role-based platform for reporting, tracking, and resolving incidents — with priority immutability baked in.
          </p>

          {/* 3D App preview card */}
          <div style={{ perspective:"1000px", marginBottom:"36px" }}>
            <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:"20px", border:"1px solid rgba(255,255,255,0.15)", backdropFilter:"blur(20px)", padding:"20px", transform:"rotateX(6deg) rotateY(-4deg)", boxShadow:"0 40px 100px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.08)", animation:"floatB 8s ease-in-out infinite" }}>
              {/* Mini stat row */}
              <div style={{ display:"flex", gap:"8px", marginBottom:"14px" }}>
                {[["Total","12","#a78bfa"],["Open","4","#f87171"],["In Progress","3","#60a5fa"],["Resolved","5","#4ade80"]].map(([l,v,c]) => (
                  <div key={l} style={{ flex:1, background:"rgba(255,255,255,0.08)", borderRadius:"10px", padding:"8px 6px", textAlign:"center" }}>
                    <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.5)", marginBottom:"3px" }}>{l}</div>
                    <div style={{ fontSize:"18px", fontWeight:700, color:c }}>{v}</div>
                  </div>
                ))}
              </div>
              {/* Mini incidents */}
              {[["DB latency spike","critical","open"],["Login CSS bug","high","in_progress"],["Email delay","medium","resolved"]].map(([t,p,s]) => {
                const pc = p==="critical"?"#f87171":p==="high"?"#fb923c":"#facc15";
                const sc = s==="open"?"#fbbf24":s==="in_progress"?"#60a5fa":"#4ade80";
                return (
                  <div key={t} style={{ display:"flex", alignItems:"center", gap:"8px", background:"rgba(255,255,255,0.05)", borderRadius:"8px", padding:"7px 10px", marginBottom:"6px", borderLeft:`3px solid ${pc}` }}>
                    <div style={{ flex:1, fontSize:"11px", color:"rgba(255,255,255,0.8)", fontWeight:500 }}>{t}</div>
                    <div style={{ fontSize:"9px", padding:"2px 6px", borderRadius:"999px", background:`${sc}22`, color:sc, fontWeight:700 }}>{s.replace("_"," ")}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feature list */}
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card" style={{ display:"flex", alignItems:"center", gap:"14px", padding:"12px 16px", borderRadius:"14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", backdropFilter:"blur(10px)", cursor:"default", transition:"all 0.2s ease" }}>
                <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:"linear-gradient(135deg,rgba(124,58,237,0.4),rgba(59,130,246,0.4))", display:"flex", alignItems:"center", justifyContent:"center", color:"#a78bfa", flexShrink:0 }}>{f.icon}</div>
                <div>
                  <div style={{ fontSize:"13px", fontWeight:700, color:"white" }}>{f.title}</div>
                  <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.5)" }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL — Form */}
        <div className="login-right" style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 48px", animation:"slideInRight 0.7s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <div style={{ width:"100%", maxWidth:"420px" }}>
            <div style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"28px", padding:"44px 40px", backdropFilter:"blur(40px)", boxShadow:"0 40px 120px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.08)" }}>

              <div style={{ textAlign:"center", marginBottom:"32px" }}>
                <div style={{ width:"56px", height:"56px", borderRadius:"18px", background:"linear-gradient(135deg,#7c3aed,#a855f7)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", boxShadow:"0 8px 32px rgba(124,58,237,0.5)", animation:"pulse-glow 3s ease infinite" }}>
                  <Shield size={26} color="white" />
                </div>
                <h2 style={{ fontSize:"26px", fontWeight:800, color:"white", marginBottom:"6px" }}>Welcome back</h2>
                <p style={{ fontSize:"14px", color:"rgba(255,255,255,0.5)" }}>Sign in to your account</p>
              </div>

              {error && (
                <div style={{ background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", color:"#fca5a5", padding:"12px 16px", borderRadius:"12px", marginBottom:"20px", fontSize:"14px", textAlign:"center" }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div style={{ marginBottom:"18px" }}>
                  <label style={{ display:"block", fontSize:"13px", fontWeight:600, color:"rgba(255,255,255,0.7)", marginBottom:"8px" }}>Email Address</label>
                  <input
                    className="login-input"
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    style={{ width:"100%", padding:"13px 16px", borderRadius:"12px", border:"1.5px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"white", fontSize:"14px", boxSizing:"border-box", fontFamily:"inherit", transition:"all 0.2s" }}
                  />
                </div>

                <div style={{ marginBottom:"24px" }}>
                  <label style={{ display:"block", fontSize:"13px", fontWeight:600, color:"rgba(255,255,255,0.7)", marginBottom:"8px" }}>Password</label>
                  <div style={{ position:"relative" }}>
                    <input
                      className="login-input"
                      type={showPw ? "text" : "password"} required value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      style={{ width:"100%", padding:"13px 44px 13px 16px", borderRadius:"12px", border:"1.5px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"white", fontSize:"14px", boxSizing:"border-box", fontFamily:"inherit", transition:"all 0.2s" }}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position:"absolute", right:"14px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.5)", display:"flex" }}>
                      {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <button
                  className="login-btn"
                  type="submit" disabled={loading}
                  style={{ width:"100%", padding:"14px", borderRadius:"14px", border:"none", background:"linear-gradient(135deg,#7c3aed,#4f46e5)", color:"white", fontSize:"15px", fontWeight:700, cursor:loading?"not-allowed":"pointer", boxShadow:"0 8px 28px rgba(124,58,237,0.4)", transition:"all 0.25s ease", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", opacity:loading?0.7:1 }}
                >
                  {loading ? "Signing in..." : <><span>Sign In</span><ArrowRight size={17} /></>}
                </button>
              </form>

              {/* Quick-fill test accounts */}
              <div style={{ marginTop:"24px", paddingTop:"20px", borderTop:"1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.35)", textAlign:"center", marginBottom:"10px", textTransform:"uppercase", letterSpacing:"0.08em" }}>Test accounts</div>
                <div style={{ display:"flex", gap:"8px" }}>
                  {[["Reporter","reporter@test.com"],["Resolver","resolver@test.com"]].map(([label,em]) => (
                    <button key={label} className="quick-btn" onClick={() => quickFill(em, "password")} style={{ flex:1, padding:"9px 10px", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.75)", fontSize:"12px", fontWeight:600, cursor:"pointer", transition:"all 0.2s" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop:"20px", textAlign:"center", fontSize:"13px", color:"rgba(255,255,255,0.45)" }}>
                No account?{" "}
                <Link to="/register" style={{ color:"#a78bfa", fontWeight:700, textDecoration:"none" }}>Create one →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
