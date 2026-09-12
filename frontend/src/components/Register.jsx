import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Eye, EyeOff, ArrowRight, UserCheck, Search } from "lucide-react";
import useAuth from "./AuthContext";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("REPORTER");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Registration failed"); }
      const d = await res.json();
      login(d.token, d.user.role, d.user);
      navigate("/dashboard");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const pwStrength = password.length === 0 ? null : password.length < 8 ? "weak" : password.length < 12 ? "good" : "strong";
  const strengthColor = { weak:"#ef4444", good:"#f59e0b", strong:"#22c55e" };
  const strengthWidth = { weak:"33%", good:"66%", strong:"100%" };

  const ROLES = [
    { value:"REPORTER", icon:<Search size={16}/>, title:"Reporter", desc:"Report and track your own incidents" },
    { value:"RESOLVER", icon:<UserCheck size={16}/>, title:"Resolver", desc:"Manage and resolve all incidents" },
  ];

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Segoe UI',system-ui,sans-serif", position:"relative", overflow:"hidden" }}>
      <style>{`
        @keyframes drift { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-40px) scale(1.15)} 66%{transform:translate(-30px,50px) scale(0.9)} }
        @keyframes float3d { 0%,100%{transform:perspective(600px) rotateX(25deg) rotateY(-15deg) translateY(0)} 50%{transform:perspective(600px) rotateX(28deg) rotateY(-12deg) translateY(-18px)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 0 0 rgba(139,92,246,0.4)} 50%{box-shadow:0 0 0 8px rgba(139,92,246,0)} }
        .reg-input:focus { outline:none; border-color:#7c3aed !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.18) !important; }
        .reg-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 12px 40px rgba(124,58,237,0.5) !important; }
        .role-card { cursor:pointer; transition:all 0.2s ease; }
        .role-card:hover { border-color:rgba(167,139,250,0.5) !important; }
      `}</style>

      {/* Aurora background */}
      <div style={{ position:"fixed", inset:0, background:"linear-gradient(135deg,#0f0a1e 0%,#1a1040 40%,#0d1b3e 100%)", zIndex:0 }} />
      <div style={{ position:"fixed", width:"600px", height:"600px", borderRadius:"50%", background:"radial-gradient(circle,rgba(139,92,246,0.35),transparent 70%)", top:"-200px", right:"-100px", animation:"drift 18s ease-in-out infinite", zIndex:0, pointerEvents:"none" }} />
      <div style={{ position:"fixed", width:"400px", height:"400px", borderRadius:"50%", background:"radial-gradient(circle,rgba(236,72,153,0.25),transparent 70%)", bottom:"-100px", left:"20%", animation:"drift 14s ease-in-out infinite reverse", zIndex:0, pointerEvents:"none" }} />
      <div style={{ position:"fixed", width:"160px", height:"160px", borderRadius:"28px", background:"linear-gradient(135deg,rgba(139,92,246,0.2),rgba(59,130,246,0.2))", border:"1px solid rgba(255,255,255,0.12)", backdropFilter:"blur(20px)", boxShadow:"0 30px 80px rgba(0,0,0,0.4)", animation:"float3d 7s ease-in-out infinite", top:"10%", left:"8%", zIndex:1, pointerEvents:"none" }} />
      <div style={{ position:"fixed", width:"80px", height:"80px", borderRadius:"50%", background:"radial-gradient(circle at 30% 30%,rgba(20,184,166,0.4),rgba(59,130,246,0.2))", boxShadow:"0 0 40px rgba(20,184,166,0.3)", animation:"float3d 6s ease-in-out infinite reverse", bottom:"20%", right:"10%", zIndex:1, pointerEvents:"none" }} />

      {/* Form card */}
      <div style={{ position:"relative", zIndex:2, width:"100%", maxWidth:"480px", padding:"20px", animation:"slideUp 0.7s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"28px", padding:"44px 40px", backdropFilter:"blur(40px)", boxShadow:"0 40px 120px rgba(0,0,0,0.5)" }}>

          <div style={{ textAlign:"center", marginBottom:"32px" }}>
            <div style={{ width:"56px", height:"56px", borderRadius:"18px", background:"linear-gradient(135deg,#7c3aed,#a855f7)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", boxShadow:"0 8px 32px rgba(124,58,237,0.5)", animation:"pulse-glow 3s ease infinite" }}>
              <Shield size={26} color="white" />
            </div>
            <h2 style={{ fontSize:"26px", fontWeight:800, color:"white", marginBottom:"6px" }}>Create account</h2>
            <p style={{ fontSize:"14px", color:"rgba(255,255,255,0.5)" }}>Join Incident Manager today</p>
          </div>

          {error && (
            <div style={{ background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", color:"#fca5a5", padding:"12px 16px", borderRadius:"12px", marginBottom:"20px", fontSize:"14px", textAlign:"center" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div style={{ marginBottom:"18px" }}>
              <label style={{ display:"block", fontSize:"13px", fontWeight:600, color:"rgba(255,255,255,0.7)", marginBottom:"8px" }}>Email Address</label>
              <input className="reg-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com"
                style={{ width:"100%", padding:"13px 16px", borderRadius:"12px", border:"1.5px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"white", fontSize:"14px", boxSizing:"border-box", fontFamily:"inherit", transition:"all 0.2s" }} />
            </div>

            <div style={{ marginBottom:"18px" }}>
              <label style={{ display:"block", fontSize:"13px", fontWeight:600, color:"rgba(255,255,255,0.7)", marginBottom:"8px" }}>Password</label>
              <div style={{ position:"relative" }}>
                <input className="reg-input" type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" minLength={8}
                  style={{ width:"100%", padding:"13px 44px 13px 16px", borderRadius:"12px", border:"1.5px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"white", fontSize:"14px", boxSizing:"border-box", fontFamily:"inherit", transition:"all 0.2s" }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position:"absolute", right:"14px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.5)", display:"flex" }}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {pwStrength && (
                <div style={{ marginTop:"8px" }}>
                  <div style={{ height:"3px", borderRadius:"2px", background:"rgba(255,255,255,0.1)", overflow:"hidden" }}>
                    <div style={{ height:"100%", width:strengthWidth[pwStrength], background:strengthColor[pwStrength], transition:"all 0.3s ease", borderRadius:"2px" }} />
                  </div>
                  <div style={{ fontSize:"11px", color:strengthColor[pwStrength], marginTop:"4px", fontWeight:600, textTransform:"capitalize" }}>{pwStrength} password</div>
                </div>
              )}
            </div>

            {/* Role selector */}
            <div style={{ marginBottom:"24px" }}>
              <label style={{ display:"block", fontSize:"13px", fontWeight:600, color:"rgba(255,255,255,0.7)", marginBottom:"10px" }}>Your Role</label>
              <div style={{ display:"flex", gap:"10px" }}>
                {ROLES.map((r) => (
                  <div key={r.value} className="role-card" onClick={() => setRole(r.value)}
                    style={{ flex:1, padding:"14px 12px", borderRadius:"14px", border:`2px solid ${role===r.value?"rgba(167,139,250,0.8)":"rgba(255,255,255,0.12)"}`, background:role===r.value?"rgba(124,58,237,0.2)":"rgba(255,255,255,0.05)", textAlign:"center" }}>
                    <div style={{ color:role===r.value?"#a78bfa":"rgba(255,255,255,0.5)", display:"flex", justifyContent:"center", marginBottom:"6px" }}>{r.icon}</div>
                    <div style={{ fontSize:"13px", fontWeight:700, color:"white", marginBottom:"3px" }}>{r.title}</div>
                    <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.45)", lineHeight:"1.4" }}>{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <button className="reg-btn" type="submit" disabled={loading}
              style={{ width:"100%", padding:"14px", borderRadius:"14px", border:"none", background:"linear-gradient(135deg,#7c3aed,#4f46e5)", color:"white", fontSize:"15px", fontWeight:700, cursor:loading?"not-allowed":"pointer", boxShadow:"0 8px 28px rgba(124,58,237,0.4)", transition:"all 0.25s ease", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", opacity:loading?0.7:1 }}>
              {loading ? "Creating account..." : <><span>Create Account</span><ArrowRight size={17} /></>}
            </button>
          </form>

          <div style={{ marginTop:"20px", textAlign:"center", fontSize:"13px", color:"rgba(255,255,255,0.45)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color:"#a78bfa", fontWeight:700, textDecoration:"none" }}>Sign in →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
