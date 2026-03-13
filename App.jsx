import { useState, useMemo, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE CLIENT ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://sksqrbflfntexujqdwzc.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrc3FyYmZsZm50ZXh1anFkd3pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTU0NDcsImV4cCI6MjA4ODczMTQ0N30.kKJ9ZeF8D_rCMA1MR2cGR4IxNCuntu1xNYR1kv0EaSI";
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── QR CODE ──────────────────────────────────────────────────────────────────
function generateQRMatrix(data) {
  const size = 21;
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));
  const finder = (r, c) => { for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) { if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) if (r + i < size && c + j < size) matrix[r + i][c + j] = 1; } };
  finder(0, 0); finder(0, 14); finder(14, 0);
  for (let i = 8; i < 13; i++) { matrix[6][i] = i % 2 === 0 ? 1 : 0; matrix[i][6] = i % 2 === 0 ? 1 : 0; }
  let hash = 5381;
  for (let i = 0; i < data.length; i++) hash = ((hash << 5) + hash + data.charCodeAt(i)) | 0;
  const bits = []; let h = Math.abs(hash) + data.length * 1337;
  for (let i = 0; i < 220; i++) { bits.push(h & 1); h = ((h >>> 1) ^ (0xEDB88320 * (i % 7 === 0 ? 1 : 0) + data.charCodeAt(i % data.length) * 17)) | 0; h = Math.abs(h); }
  const forbidden = new Set();
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) forbidden.add(`${r},${c}`);
  for (let r = 0; r < 8; r++) for (let c = 13; c < 21; c++) forbidden.add(`${r},${c}`);
  for (let r = 13; r < 21; r++) for (let c = 0; c < 8; c++) forbidden.add(`${r},${c}`);
  for (let i = 6; i <= 6; i++) for (let j = 6; j < 15; j++) forbidden.add(`${i},${j}`);
  for (let i = 6; i < 15; i++) forbidden.add(`${i},6`);
  let bi = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (!forbidden.has(`${r},${c}`) && bi < bits.length) matrix[r][c] = bits[bi++];
  return matrix;
}
const QRCode = ({ value, size = 80 }) => {
  const matrix = useMemo(() => generateQRMatrix(value), [value]);
  const cells = matrix.length; const cell = size / cells;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ borderRadius: 3, display: "block", flexShrink: 0 }}>
      <rect width={size} height={size} fill="#fff" rx={3} />
      {matrix.map((row, r) => row.map((on, c) => on ? <rect key={`${r}-${c}`} x={c * cell + 0.3} y={r * cell + 0.3} width={cell - 0.3} height={cell - 0.3} fill="#1e3a5f" rx={0.2} /> : null))}
    </svg>
  );
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const STONE_TYPES = ["Marble", "Granite", "Slate", "Quartzite", "Limestone", "Onyx"];
const FINISHES = ["Polished", "Honed", "Brushed", "Sandblasted", "Natural", "Leathered"];
const VARIETIES = ["Italian", "Indian", "Spanish", "Turkish", "Brazilian", "Chinese"];
const BLOCKS = ["A", "B", "C", "D", "E", "F"];
const today = new Date().toISOString().split("T")[0];
const getStatus = (qty, thresh) => qty === 0 ? "Out of Stock" : qty <= thresh ? "Low Stock" : "In Stock";
const stc = s => s === "In Stock" ? "#16a34a" : s === "Low Stock" ? "#d97706" : "#dc2626";
const stb = s => s === "In Stock" ? "#dcfce7" : s === "Low Stock" ? "#fef3c7" : "#fee2e2";
const fmtINR = n => `₹${Number(n).toLocaleString("en-IN")}`;
const fmtL = n => `₹${(n / 100000).toFixed(2)}L`;

// ─── LOADING SCREEN ───────────────────────────────────────────────────────────
const Loader = ({ msg = "Loading..." }) => (
  <div style={{ minHeight: "100vh", background: "#0f2240", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
    <div style={{ width: 48, height: 48, background: "#fff", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
      <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
        <rect x="1" y="1" width="8" height="8" rx="1" fill="#1e3a5f" /><rect x="11" y="1" width="8" height="8" rx="1" fill="#1e3a5f" />
        <rect x="1" y="11" width="8" height="8" rx="1" fill="#1e3a5f" /><rect x="11" y="11" width="8" height="8" rx="1" fill="#3b82f6" />
      </svg>
    </div>
    <div style={{ color: "#fff", fontWeight: 700, fontSize: 18, letterSpacing: 2, marginBottom: 8 }}>STONETRACK</div>
    <div style={{ color: "#64748b", fontSize: 13 }}>{msg}</div>
    <div style={{ marginTop: 24, width: 40, height: 4, background: "#1e3a5f", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ width: "100%", height: "100%", background: "#3b82f6", borderRadius: 2, animation: "loading 1.2s ease-in-out infinite" }} />
    </div>
    <style>{`@keyframes loading{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>
  </div>
);

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
const AuthScreen = ({ onBack }) => {
  const [mode, setMode] = useState("login"); // login | signup
  const [form, setForm] = useState({ email: "", password: "", businessName: "", ownerName: "", phone: "", city: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError("Enter email and password"); return; }
    setLoading(true); setError("");
    const { data, error: err } = await sb.auth.signInWithPassword({ email: form.email, password: form.password });
    if (err) { setError(err.message); setLoading(false); return; }
    // If logged in but no business yet, create one
    if (data.user) {
      const { data: biz } = await sb.from("businesses").select("id").eq("owner_id", data.user.id).single();
      if (!biz) {
        await sb.from("businesses").insert({
          owner_id: data.user.id,
          business_name: form.businessName || "My Marble Business",
          owner_name: form.ownerName || "",
          phone: form.phone || "",
          city: form.city || ""
        });
      }
    }
    setLoading(false);
  };

  const handleSignup = async () => {
    if (!form.email || !form.password || !form.businessName || !form.ownerName) { setError("Fill all required fields"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError("");
    // Try login first in case user already exists
    const { data: loginData } = await sb.auth.signInWithPassword({ email: form.email, password: form.password });
    if (loginData?.user) {
      const { data: biz } = await sb.from("businesses").select("id").eq("owner_id", loginData.user.id).single();
      if (!biz) {
        await sb.from("businesses").insert({
          owner_id: loginData.user.id, business_name: form.businessName,
          owner_name: form.ownerName, phone: form.phone, city: form.city
        });
      }
      setLoading(false); return;
    }
    const { data, error: err } = await sb.auth.signUp({ email: form.email, password: form.password });
    if (err) { setError(err.message); setLoading(false); return; }
    if (data.user) {
      await sb.from("businesses").insert({
        owner_id: data.user.id, business_name: form.businessName,
        owner_name: form.ownerName, phone: form.phone, city: form.city
      });
    }
    setLoading(false);
  };

  const inputStyle = { width: "100%", padding: "11px 13px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 15, fontFamily: "'DM Sans',sans-serif", outline: "none", background: "#f8faff" };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5, display: "block" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f2240 0%, #1e3a5f 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}`}</style>

      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ width: 52, height: 52, background: "#fff", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <svg width="30" height="30" viewBox="0 0 20 20" fill="none">
            <rect x="1" y="1" width="8" height="8" rx="1" fill="#1e3a5f" /><rect x="11" y="1" width="8" height="8" rx="1" fill="#1e3a5f" />
            <rect x="1" y="11" width="8" height="8" rx="1" fill="#1e3a5f" /><rect x="11" y="11" width="8" height="8" rx="1" fill="#3b82f6" />
          </svg>
        </div>
        <div style={{ color: "#fff", fontWeight: 900, fontSize: 24, letterSpacing: 3 }}>STONETRACK</div>
        <div style={{ color: "#93c5fd", fontSize: 12, letterSpacing: 1.5, marginTop: 4 }}>MARBLE & GRANITE MANAGEMENT</div>
      </div>

      <div style={{ background: "#fff", borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 380, boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
        {/* Toggle */}
        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {["login", "signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }}
              style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: mode === m ? "#1e3a5f" : "transparent", color: mode === m ? "#fff" : "#64748b", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s" }}>
              {m === "login" ? "Login" : "Sign Up"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && <>
            <div><label style={labelStyle}>Business Name <span style={{ color: "#dc2626" }}>*</span></label>
              <input style={inputStyle} placeholder="e.g. Sharma Marble Works" value={form.businessName} onChange={e => setForm(p => ({ ...p, businessName: e.target.value }))} /></div>
            <div><label style={labelStyle}>Your Name <span style={{ color: "#dc2626" }}>*</span></label>
              <input style={inputStyle} placeholder="e.g. Rajesh Sharma" value={form.ownerName} onChange={e => setForm(p => ({ ...p, ownerName: e.target.value }))} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>Phone</label>
                <input style={inputStyle} placeholder="9876543210" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><label style={labelStyle}>City</label>
                <input style={inputStyle} placeholder="Mangaluru" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
            </div>
          </>}
          <div><label style={labelStyle}>Email <span style={{ color: "#dc2626" }}>*</span></label>
            <input style={inputStyle} type="email" placeholder="you@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
          <div><label style={labelStyle}>Password <span style={{ color: "#dc2626" }}>*</span></label>
            <input style={inputStyle} type="password" placeholder={mode === "signup" ? "Min 6 characters" : "Your password"} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /></div>
        </div>

        {error && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "10px 13px", fontSize: 13, marginTop: 14, fontWeight: 600 }}>⚠ {error}</div>}

        <button onClick={mode === "login" ? handleLogin : handleSignup} disabled={loading}
          style={{ width: "100%", marginTop: 20, background: loading ? "#94a3b8" : "#1e3a5f", color: "#fff", border: "none", borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'DM Sans',sans-serif" }}>
          {loading ? "Please wait..." : mode === "login" ? "Login to StoneTrack" : "Create My Account"}
        </button>

        {mode === "signup" && <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
          By signing up you agree to our terms. Your data is private and secure. No other dealer can see your inventory.
        </div>}
      </div>

      <div style={{ color: "#475569", fontSize: 12, marginTop: 20, textAlign: "center" }}>
        Used by marble & granite dealers across India 🇮🇳
      </div>
    </div>
  );
};

// ─── UI HELPER COMPONENTS (defined at top level to prevent re-render cursor bug) ─
const Inp = ({ label, ...p }) => (
  <div>
    {label && <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, letterSpacing: 0.3 }}>{label}</div>}
    <input style={{ background: "#fff", border: "1.5px solid #e2e8f0", color: "#0f172a", padding: "9px 12px", borderRadius: 7, width: "100%", fontSize: 15, fontFamily: "'DM Sans',sans-serif", outline: "none" }}
      onFocus={e => e.target.style.borderColor = "#3b82f6"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} {...p} />
  </div>
);
const Sel = ({ label, options, ...p }) => (
  <div>
    {label && <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>{label}</div>}
    <select style={{ background: "#fff", border: "1.5px solid #e2e8f0", color: "#0f172a", padding: "9px 12px", borderRadius: 7, width: "100%", fontSize: 15, fontFamily: "'DM Sans',sans-serif", outline: "none" }} {...p}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </div>
);
const Btn = ({ ch, v = "p", sm, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{ background: disabled ? "#e2e8f0" : v === "p" ? "#1e3a5f" : v === "d" ? "#dc2626" : v === "g2" ? "#059669" : "#fff", border: v === "g" ? "1.5px solid #e2e8f0" : "none", color: disabled ? "#94a3b8" : v === "g" ? "#334155" : "#fff", padding: sm ? "6px 13px" : "10px 22px", borderRadius: 7, fontFamily: "'DM Sans',sans-serif", fontSize: sm ? 12 : 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>{ch}</button>
);
const Card = ({ ch, style }) => (
  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 20, boxShadow: "0 1px 5px rgba(30,58,95,0.05)", ...style }}>{ch}</div>
);
const StatCard = ({ label, value, sub, color, icon }) => (
  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderTop: `3px solid ${color}`, borderRadius: 10, padding: 18, boxShadow: "0 1px 5px rgba(30,58,95,0.05)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.8 }}>{label.toUpperCase()}</div>
      <span style={{ fontSize: 18 }}>{icon}</span>
    </div>
    <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 5 }}>{sub}</div>}
  </div>
);
const Mdl = ({ title, sub, onClose, wide, ch }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(15,36,68,0.4)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{ background: "#fff", borderRadius: 13, padding: 28, width: "100%", maxWidth: wide ? 680 : 500, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(15,36,68,0.2)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div><div style={{ fontWeight: 800, fontSize: 16, color: "#1e3a5f" }}>{title}</div>{sub && <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{sub}</div>}</div>
        <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 6, width: 30, height: 30, cursor: "pointer", fontSize: 15, color: "#64748b" }}>✕</button>
      </div>
      <div style={{ height: 1, background: "#f1f5f9", marginBottom: 18 }} />
      {ch}
    </div>
  </div>
);
const HR = () => <div style={{ height: 1, background: "#f1f5f9", margin: "18px 0" }} />;


const QRLabel = ({ slab, onClose }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(15,36,68,0.55)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{ background: "#fff", borderRadius: "16px 16px 0 0", padding: "24px 20px 32px", maxWidth: 480, width: "100%", boxShadow: "0 -8px 40px rgba(0,0,0,0.2)" }}>
      <div style={{ width: 40, height: 4, background: "#e2e8f0", borderRadius: 2, margin: "0 auto 16px" }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: "#1e3a5f" }}>Print QR Label</div>
        <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 6, width: 30, height: 30, cursor: "pointer", fontSize: 14, color: "#64748b" }}>✕</button>
      </div>
      <div style={{ border: "2.5px solid #1e3a5f", borderRadius: 10, padding: 20, background: "#f8faff", textAlign: "center" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: 3, marginBottom: 6 }}>STONETRACK</div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><QRCode value={slab.barcode} size={130} /></div>
        <div style={{ fontWeight: 900, fontSize: 17, color: "#1e3a5f", marginBottom: 2 }}>{slab.name}</div>
        <div style={{ fontSize: 12, color: "#475569", marginBottom: 10 }}>{slab.variety} · {slab.type} · {slab.finish}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <span style={{ background: "#1e3a5f", color: "#fff", borderRadius: 5, padding: "4px 12px", fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>{slab.barcode}</span>
          <span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 5, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>Block {slab.block}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button onClick={() => window.print()} style={{ flex: 1, background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 8, padding: 13, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>🖨 Print Label</button>
        <button onClick={onClose} style={{ flex: 1, background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, padding: 13, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Close</button>
      </div>
    </div>
  </div>
);

// ─── INVOICE MODAL ────────────────────────────────────────────────────────────
const InvoiceView = ({ sale, onClose }) => {
  const amount = sale.sqft_sold * sale.price_per_sqft;
  const gst = amount * 0.18;
  const total = amount + gst;
  const paid = sale.paid_amount || 0;
  const due = total - paid;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,36,68,0.55)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: "16px 16px 0 0", padding: "24px 20px 32px", maxWidth: 520, width: "100%", boxShadow: "0 -8px 40px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, background: "#e2e8f0", borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div><div style={{ fontWeight: 900, fontSize: 18, color: "#1e3a5f" }}>TAX INVOICE</div><div style={{ fontSize: 12, color: "#64748b" }}>{sale.invoice_no} · {sale.date}</div></div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 6, width: 30, height: 30, cursor: "pointer", fontSize: 15, color: "#64748b" }}>✕</button>
        </div>
        <div style={{ height: 1, background: "#f1f5f9", marginBottom: 16 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: 1, marginBottom: 4 }}>BILL TO</div>
            <div style={{ fontWeight: 700, color: "#1e3a5f" }}>{sale.customer}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{sale.phone || "—"}</div>
            {sale.gst_no && <div style={{ fontSize: 11, color: "#64748b" }}>GST: {sale.gst_no}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ background: due <= 0 ? "#dcfce7" : "#fef3c7", color: due <= 0 ? "#16a34a" : "#d97706", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 700, display: "inline-block" }}>
              {due <= 0 ? "✓ PAID" : `⏳ DUE: ₹${Math.round(due).toLocaleString("en-IN")}`}
            </div>
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
          <thead><tr style={{ background: "#f8faff" }}>{["ITEM", "SQ.FT", "RATE", "AMOUNT"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", borderBottom: "1px solid #e2e8f0" }}>{h}</th>)}</tr></thead>
          <tbody><tr>
            <td style={{ padding: "10px", fontWeight: 600, color: "#1e3a5f" }}>{sale.slab_name}</td>
            <td style={{ padding: "10px", color: "#2563eb", fontWeight: 700 }}>{sale.sqft_sold}</td>
            <td style={{ padding: "10px" }}>₹{sale.price_per_sqft}/sqft</td>
            <td style={{ padding: "10px", fontWeight: 700 }}>₹{Math.round(amount).toLocaleString("en-IN")}</td>
          </tr></tbody>
        </table>
        <div style={{ background: "#f8faff", borderRadius: 8, padding: 14 }}>
          {[["Subtotal", `₹${Math.round(amount).toLocaleString("en-IN")}`, "#334155"], ["GST (18%)", `₹${Math.round(gst).toLocaleString("en-IN")}`, "#64748b"], ["Total", `₹${Math.round(total).toLocaleString("en-IN")}`, "#1e3a5f"], ["Paid", `₹${paid.toLocaleString("en-IN")}`, "#16a34a"], ["Balance Due", `₹${Math.max(0, Math.round(due)).toLocaleString("en-IN")}`, due > 0 ? "#dc2626" : "#16a34a"]].map(([l, v, c]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: l !== "Balance Due" ? "1px solid #e2e8f0" : "none" }}>
              <span style={{ fontSize: 13, color: "#64748b" }}>{l}</span>
              <span style={{ fontWeight: l === "Total" || l === "Balance Due" ? 800 : 600, color: c, fontSize: l === "Total" ? 15 : 13 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button onClick={() => window.print()} style={{ flex: 1, background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 8, padding: 13, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>🖨 Print Invoice</button>
          <button onClick={onClose} style={{ flex: 1, background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, padding: 13, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ─── STAFF PIN LOGIN ──────────────────────────────────────────────────────────
const StaffPinLogin = ({ onSuccess }) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bizName, setBizName] = useState("");

  const handlePin = async (p) => {
    const next = pin + p;
    setPin(next);
    if (next.length === 4) {
      setLoading(true); setError("");
      // Find business with this staff PIN
      const { data } = await sb.from("businesses").select("*").eq("staff_pin", next).single();
      if (data) {
        setBizName(data.business_name);
        setTimeout(() => { onSuccess(data); setLoading(false); }, 500);
      } else {
        setError("Wrong PIN. Try again.");
        setPin(""); setLoading(false);
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f2240", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", padding: 20 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=DM+Mono:wght@500&display=swap');*{box-sizing:border-box}@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
      <div style={{ width: 44, height: 44, background: "#fff", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <svg width="26" height="26" viewBox="0 0 20 20" fill="none"><rect x="1" y="1" width="8" height="8" rx="1" fill="#1e3a5f"/><rect x="11" y="1" width="8" height="8" rx="1" fill="#1e3a5f"/><rect x="1" y="11" width="8" height="8" rx="1" fill="#1e3a5f"/><rect x="11" y="11" width="8" height="8" rx="1" fill="#3b82f6"/></svg>
      </div>
      <div style={{ color: "#fff", fontWeight: 800, fontSize: 20, letterSpacing: 2, marginBottom: 4 }}>STONETRACK</div>
      <div style={{ color: "#64748b", fontSize: 12, marginBottom: 32 }}>STAFF ACCESS</div>
      <div style={{ background: "#1a2f4a", borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 300 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: "#93c5fd", fontWeight: 600, marginBottom: 16 }}>Enter Staff PIN</div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", animation: error ? "shake 0.4s ease" : "none" }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: pin.length > i ? "#3b82f6" : "#2d4a6a", border: "2px solid #3b82f650", transition: "all 0.15s" }} />
            ))}
          </div>
          {error && <div style={{ color: "#f87171", fontSize: 12, marginTop: 10, fontWeight: 600 }}>{error}</div>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {["1","2","3","4","5","6","7","8","9","","0","DEL"].map(k => (
            <button key={k} onClick={() => { if (!k) return; if (k === "DEL") { setPin(p => p.slice(0,-1)); setError(""); } else if (pin.length < 4) handlePin(k); }}
              style={{ background: k === "DEL" ? "#2d4a6a" : k === "" ? "transparent" : "#243d5c", border: k === "" ? "none" : "1px solid #2d4a6a", color: k === "DEL" ? "#94a3b8" : "#fff", borderRadius: 12, padding: "16px 0", fontSize: k === "DEL" ? 12 : 22, fontWeight: 700, cursor: k === "" ? "default" : "pointer", fontFamily: "'DM Mono',monospace", minHeight: 56 }}>{k}</button>
          ))}
        </div>
      </div>
      <div style={{ color: "#334155", fontSize: 11, marginTop: 20 }}>Ask your manager for the Staff PIN</div>
    </div>
  );
};

// ─── STAFF APP ────────────────────────────────────────────────────────────────
function StaffApp({ business, onExit }) {
  const [slabs, setSlabs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState(null);
  const [printTarget, setPrintTarget] = useState(null);
  const [reserveTarget, setReserveTarget] = useState(null);
  const [reserveName, setReserveName] = useState("");
  const [dispatchTarget, setDispatchTarget] = useState(null);

  const notify = (msg, type = "success") => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };

  useEffect(() => {
    sb.from("slabs").select("*").eq("business_id", business.id).order("name").then(({ data }) => { setSlabs(data || []); setLoading(false); });
  }, [business.id]);

  const filtered = slabs.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.barcode || "").toLowerCase().includes(search.toLowerCase())
  );

  const markDispatched = async (slab) => {
    const newQty = Math.max(0, slab.qty - 1);
    const newStatus = getStatus(newQty, slab.threshold);
    await sb.from("slabs").update({ qty: newQty, status: newStatus, reserved_for: null }).eq("id", slab.id);
    setSlabs(p => p.map(s => s.id === slab.id ? { ...s, qty: newQty, status: newStatus, reserved_for: null } : s));
    setDispatchTarget(null);
    notify(`✓ ${slab.name} marked as dispatched`);
  };

  const reserveSlab = async () => {
    if (!reserveName.trim()) return;
    await sb.from("slabs").update({ reserved_for: reserveName }).eq("id", reserveTarget.id);
    setSlabs(p => p.map(s => s.id === reserveTarget.id ? { ...s, reserved_for: reserveName } : s));
    setReserveTarget(null); setReserveName("");
    notify(`Reserved for ${reserveName}`);
  };

  if (loading) return <Loader msg="Loading inventory..." />;

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: "#f0f6ff", minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>

      {notif && <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 999, background: notif.type === "error" ? "#fef2f2" : "#f0fdf4", border: `1px solid ${notif.type === "error" ? "#fca5a5" : "#86efac"}`, color: notif.type === "error" ? "#dc2626" : "#16a34a", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", whiteSpace: "nowrap" }}>{notif.msg}</div>}

      {/* Header */}
      <header style={{ background: "#1e3a5f", padding: "12px 16px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 16px rgba(15,36,68,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="1" y="1" width="8" height="8" rx="1" fill="#1e3a5f"/><rect x="11" y="1" width="8" height="8" rx="1" fill="#1e3a5f"/><rect x="1" y="11" width="8" height="8" rx="1" fill="#1e3a5f"/><rect x="11" y="11" width="8" height="8" rx="1" fill="#3b82f6"/></svg>
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: 1 }}>STONETRACK</div>
              <div style={{ color: "#93c5fd", fontSize: 9, letterSpacing: 1 }}>{business.business_name} · STAFF</div>
            </div>
          </div>
          <button onClick={onExit} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🔒 Exit</button>
        </div>
        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name or barcode..."
          style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "none", fontSize: 15, fontFamily: "'DM Sans',sans-serif", outline: "none", background: "rgba(255,255,255,0.12)", color: "#fff" }} />
      </header>

      {/* Stats bar */}
      <div style={{ background: "#1e3a5f", padding: "8px 16px 12px", display: "flex", gap: 16 }}>
        {[["Total", slabs.length, "#93c5fd"], ["In Stock", slabs.filter(s => s.status === "In Stock").length, "#86efac"], ["Low", slabs.filter(s => s.status === "Low Stock").length, "#fcd34d"], ["Out", slabs.filter(s => s.status === "Out of Stock").length, "#fca5a5"]].map(([l, v, c]) => (
          <div key={l} style={{ textAlign: "center" }}>
            <div style={{ color: c, fontWeight: 800, fontSize: 18 }}>{v}</div>
            <div style={{ color: "#64748b", fontSize: 10, fontWeight: 600 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Slab Cards */}
      <div style={{ padding: "14px 14px 90px" }}>
        {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No slabs found</div>}
        {filtered.map(s => (
          <div key={s.id} style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 10, boxShadow: "0 1px 8px rgba(30,58,95,0.08)", borderLeft: `4px solid ${stc(s.status)}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1e3a5f" }}>{s.name}</div>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#94a3b8", background: "#f0f6ff", padding: "2px 6px", borderRadius: 4, display: "inline-block", marginTop: 2 }}>{s.barcode}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 900, fontSize: 28, color: stc(s.status), lineHeight: 1 }}>{s.qty}</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>slabs</div>
              </div>
            </div>

            {/* Info row */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              <span style={{ background: "#f0f6ff", color: "#1e3a5f", borderRadius: 6, padding: "3px 8px", fontSize: 12, fontWeight: 600 }}>📍 Block {s.block} · R{s.row_no} · S{s.slot_no}</span>
              <span style={{ background: "#f0f6ff", color: "#475569", borderRadius: 6, padding: "3px 8px", fontSize: 12 }}>{s.type} · {s.finish}</span>
              <span style={{ background: stb(s.status), color: stc(s.status), borderRadius: 6, padding: "3px 8px", fontSize: 12, fontWeight: 700 }}>{s.status}</span>
              {s.reserved_for && <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: 6, padding: "3px 8px", fontSize: 12, fontWeight: 700 }}>📌 Reserved: {s.reserved_for}</span>}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setDispatchTarget(s)} disabled={s.qty === 0}
                style={{ flex: 1, background: s.qty === 0 ? "#e2e8f0" : "#059669", color: s.qty === 0 ? "#94a3b8" : "#fff", border: "none", borderRadius: 8, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: s.qty === 0 ? "not-allowed" : "pointer", minHeight: 42 }}>
                ✓ Dispatch
              </button>
              <button onClick={() => { setReserveTarget(s); setReserveName(s.reserved_for || ""); }}
                style={{ flex: 1, background: s.reserved_for ? "#fef3c7" : "#f1f5f9", color: s.reserved_for ? "#92400e" : "#475569", border: "none", borderRadius: 8, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", minHeight: 42 }}>
                📌 {s.reserved_for ? "Change" : "Reserve"}
              </button>
              <button onClick={() => setPrintTarget(s)}
                style={{ background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", minHeight: 42 }}>
                🖨 QR
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dispatch Confirm Modal */}
      {dispatchTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,36,68,0.5)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "16px 16px 0 0", padding: "24px 20px 32px", width: "100%", maxWidth: 480 }}>
            <div style={{ width: 40, height: 4, background: "#e2e8f0", borderRadius: 2, margin: "0 auto 16px" }} />
            <div style={{ fontWeight: 800, fontSize: 16, color: "#1e3a5f", marginBottom: 6 }}>Confirm Dispatch</div>
            <div style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>Mark 1 slab of <strong>{dispatchTarget.name}</strong> as dispatched? Stock will reduce from {dispatchTarget.qty} to {dispatchTarget.qty - 1}.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDispatchTarget(null)} style={{ flex: 1, background: "#f1f5f9", border: "none", borderRadius: 8, padding: 13, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => markDispatched(dispatchTarget)} style={{ flex: 1, background: "#059669", color: "#fff", border: "none", borderRadius: 8, padding: 13, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>✓ Confirm Dispatch</button>
            </div>
          </div>
        </div>
      )}

      {/* Reserve Modal */}
      {reserveTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,36,68,0.5)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "16px 16px 0 0", padding: "24px 20px 32px", width: "100%", maxWidth: 480 }}>
            <div style={{ width: 40, height: 4, background: "#e2e8f0", borderRadius: 2, margin: "0 auto 16px" }} />
            <div style={{ fontWeight: 800, fontSize: 16, color: "#1e3a5f", marginBottom: 16 }}>Reserve Slab</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Customer Name</div>
            <input value={reserveName} onChange={e => setReserveName(e.target.value)} placeholder="Enter customer name..."
              style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 16, fontFamily: "'DM Sans',sans-serif", outline: "none", marginBottom: 16 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setReserveTarget(null)} style={{ flex: 1, background: "#f1f5f9", border: "none", borderRadius: 8, padding: 13, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={reserveSlab} style={{ flex: 1, background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 8, padding: 13, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Save Reservation</button>
            </div>
          </div>
        </div>
      )}

      {printTarget && <QRLabel slab={printTarget} onClose={() => setPrintTarget(null)} />}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function StoneTrack() {
  const [session, setSession] = useState(null);
  const [business, setBusiness] = useState(null);
  const [appLoading, setAppLoading] = useState(true);
  const [loginMode, setLoginMode] = useState("choose"); // choose | owner | staff
  const [staffBusiness, setStaffBusiness] = useState(null);

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => { setSession(session); if (!session) setAppLoading(false); });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => { setSession(session); if (!session) { setBusiness(null); setAppLoading(false); } });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadBusiness();
  }, [session]);

  const loadBusiness = async () => {
    const { data } = await sb.from("businesses").select("*").eq("owner_id", session.user.id).single();
    setBusiness(data);
    setAppLoading(false);
  };

  // Staff logged in via PIN
  if (staffBusiness) return <StaffApp business={staffBusiness} onExit={() => setStaffBusiness(null)} />;

  if (appLoading) return <Loader msg="Loading StoneTrack..." />;

  // Not logged in — show choose screen
  if (!session) {
    if (loginMode === "staff") return <StaffPinLogin onSuccess={biz => setStaffBusiness(biz)} />;
    if (loginMode === "owner") return <AuthScreen onBack={() => setLoginMode("choose")} />;

    // Choose screen
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f2240 0%, #1e3a5f 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px", fontFamily: "'DM Sans',sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');*{box-sizing:border-box}`}</style>
        <div style={{ width: 56, height: 56, background: "#fff", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <svg width="32" height="32" viewBox="0 0 20 20" fill="none"><rect x="1" y="1" width="8" height="8" rx="1" fill="#1e3a5f"/><rect x="11" y="1" width="8" height="8" rx="1" fill="#1e3a5f"/><rect x="1" y="11" width="8" height="8" rx="1" fill="#1e3a5f"/><rect x="11" y="11" width="8" height="8" rx="1" fill="#3b82f6"/></svg>
        </div>
        <div style={{ color: "#fff", fontWeight: 900, fontSize: 26, letterSpacing: 3, marginBottom: 4 }}>STONETRACK</div>
        <div style={{ color: "#93c5fd", fontSize: 12, letterSpacing: 1.5, marginBottom: 48 }}>MARBLE & GRANITE MANAGEMENT</div>

        <div style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 14 }}>
          <button onClick={() => setLoginMode("owner")}
            style={{ background: "#fff", border: "none", borderRadius: 16, padding: "22px 24px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, background: "#f0f6ff", border: "2px solid #dbeafe", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#1e3a5f" }}>Owner Login</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Full access — inventory, sales, reports</div>
            </div>
            <svg style={{ marginLeft: "auto" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>

          <button onClick={() => setLoginMode("staff")}
            style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: 16, padding: "22px 24px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.15)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>Staff Login</div>
              <div style={{ fontSize: 12, color: "#93c5fd", marginTop: 2 }}>Enter your 4-digit staff PIN</div>
            </div>
            <svg style={{ marginLeft: "auto" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    );
  }

  if (!business) return <Loader msg="Setting up your account..." />;
  return <OwnerApp session={session} business={business} onRefreshBusiness={loadBusiness} />;
}

// ─── OWNER APP ────────────────────────────────────────────────────────────────
function OwnerApp({ session, business, onRefreshBusiness }) {
  const [slabs, setSlabs] = useState([]);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [fType, setFType] = useState("All");
  const [fStatus, setFStatus] = useState("All");
  const [fBlock, setFBlock] = useState("All");
  const [notif, setNotif] = useState(null);
  const [staffPinOpen, setStaffPinOpen] = useState(false);
  const [newStaffPin, setNewStaffPin] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeStep, setWelcomeStep] = useState(0);

  // modals
  const [addSlabOpen, setAddSlabOpen] = useState(false);
  const [editSlabData, setEditSlabData] = useState(null);
  const [saleTarget, setSaleTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [printTarget, setPrintTarget] = useState(null);
  const [reserveTarget, setReserveTarget] = useState(null);
  const [addCustOpen, setAddCustOpen] = useState(false);
  const [viewCust, setViewCust] = useState(null);
  const [invoiceView, setInvoiceView] = useState(null);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [damageTarget, setDamageTarget] = useState(null);

  // forms
  const [ns, setNs] = useState({ name: "", type: "Marble", variety: "Indian", finish: "Polished", length: "", width: "", sqft: "", slabs: "", pricePerSqft: "", costPerSqft: "", block: "A", row: 1, slot: 1, threshold: 3, supplier: "" });
  const [sf, setSf] = useState({ sqftSold: "", customer: "", phone: "", wastage: "5", gstNo: "", paymentMode: "Cash", paidAmount: "" });
  const [rf, setRf] = useState({ customer: "", phone: "", days: "7" });
  const [nc, setNc] = useState({ name: "", phone: "", email: "", type: "Contractor", gstNo: "", creditLimit: "", notes: "" });
  const [payForm, setPayForm] = useState({ amount: "", mode: "Cash", note: "" });
  const [damageForm, setDamageForm] = useState({ qty: "1", reason: "" });

  const notify = (msg, type = "success") => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3200); };

  // ── LOAD ALL DATA ──
  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data: sl }, { data: sa }, { data: cu }] = await Promise.all([
      sb.from("slabs").select("*").eq("business_id", business.id).order("created_at"),
      sb.from("sales").select("*").eq("business_id", business.id).order("created_at", { ascending: false }),
      sb.from("customers").select("*").eq("business_id", business.id).order("name"),
    ]);
    setSlabs(sl || []);
    setSales(sa || []);
    setCustomers(cu || []);
    if ((sl || []).length === 0) setShowWelcome(true);
    setLoading(false);
  }, [business.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── ADD SLAB ──
  const addSlab = async () => {
    if (!ns.name || !ns.slabs || !ns.sqft || !ns.pricePerSqft) { notify("Fill required fields", "error"); return; }
    const slabCount = +ns.slabs;
    const sqftPerSlab = +ns.sqft;
    const totalQty = slabCount * sqftPerSlab;
    const threshold = +ns.threshold;
    const barcode = `ST-${String(slabs.length + 1).padStart(3, "0")}`;
    const { data, error } = await sb.from("slabs").insert({
      business_id: business.id, name: ns.name, type: ns.type, variety: ns.variety, finish: ns.finish,
      length: +ns.length, width: +ns.width, sqft: sqftPerSlab, qty: totalQty, price_per_sqft: +ns.pricePerSqft,
      cost_per_sqft: +ns.costPerSqft || 0, block: ns.block, row_no: +ns.row, slot_no: +ns.slot,
      threshold, supplier: ns.supplier, barcode, status: getStatus(totalQty, threshold)
    }).select().single();
    if (error) { notify(error.message, "error"); return; }
    setSlabs(p => [...p, data]);
    setAddSlabOpen(false);
    setNs({ name: "", type: "Marble", variety: "Indian", finish: "Polished", length: "", width: "", sqft: "", slabs: "", pricePerSqft: "", costPerSqft: "", block: "A", row: 1, slot: 1, threshold: 3, supplier: "" });
    notify(`${data.name} added! ${slabCount} slabs × ${sqftPerSlab} sqft = ${totalQty} sqft total`);
  };

  // ── RECORD SALE ──
  const doSale = async () => {
    if (!sf.sqftSold || +sf.sqftSold <= 0) { notify("Enter valid sq.ft", "error"); return; }
    const slab = slabs.find(s => s.id === saleTarget.id);
    const sqftSold = +sf.sqftSold;
    if (sqftSold > slab.qty) { notify("Not enough sq.ft in stock!", "error"); return; }
    const nq = slab.qty - sqftSold;
    const newStatus = getStatus(nq, slab.threshold);
    const inv = `INV-${String(sales.length + 1).padStart(3, "0")}`;
    const [{ error: slabErr }, { data: newSale, error: saleErr }] = await Promise.all([
      sb.from("slabs").update({ qty: nq, status: newStatus }).eq("id", slab.id),
      sb.from("sales").insert({
        business_id: business.id, slab_id: slab.id, slab_name: slab.name, date: today,
        sqft_sold: sqftSold, slabs_used: 1, price_per_sqft: slab.price_per_sqft,
        cost_per_sqft: slab.cost_per_sqft, wastage: +sf.wastage || 0,
        customer: sf.customer || "Walk-in", phone: sf.phone, gst_no: sf.gstNo,
        invoice_no: inv, delivery_status: "Pending", paid_amount: +sf.paidAmount || 0, payment_mode: sf.paymentMode
      }).select().single()
    ]);
    if (slabErr || saleErr) { notify("Error recording sale", "error"); return; }
    setSlabs(p => p.map(s => s.id === slab.id ? { ...s, qty: nq, status: newStatus } : s));
    setSales(p => [newSale, ...p]);
    setSaleTarget(null); setSf({ sqftSold: "", customer: "", phone: "", wastage: "5", gstNo: "", paymentMode: "Cash", paidAmount: "" });
    notify(`Sale done! Invoice: ${inv}`);
  };

  // ── RECORD PAYMENT ──
  const recordPayment = async () => {
    if (!payForm.amount || +payForm.amount <= 0) { notify("Enter valid amount", "error"); return; }
    const newPaid = (paymentTarget.paid_amount || 0) + +payForm.amount;
    const { error } = await sb.from("sales").update({ paid_amount: newPaid, payment_mode: payForm.mode }).eq("id", paymentTarget.id);
    if (error) { notify(error.message, "error"); return; }
    setSales(p => p.map(s => s.id === paymentTarget.id ? { ...s, paid_amount: newPaid, payment_mode: payForm.mode } : s));
    setPaymentTarget(null); setPayForm({ amount: "", mode: "Cash", note: "" });
    notify("Payment recorded!");
  };

  // ── RECORD DAMAGE ──
  const recordDamage = async () => {
    if (!damageForm.qty || +damageForm.qty <= 0) { notify("Enter qty", "error"); return; }
    const newQty = Math.max(0, damageTarget.qty - +damageForm.qty);
    const newStatus = getStatus(newQty, damageTarget.threshold);
    const { error } = await sb.from("slabs").update({ qty: newQty, status: newStatus }).eq("id", damageTarget.id);
    if (error) { notify(error.message, "error"); return; }
    setSlabs(p => p.map(s => s.id === damageTarget.id ? { ...s, qty: newQty, status: newStatus } : s));
    setDamageTarget(null); setDamageForm({ qty: "1", reason: "" });
    notify("Damage recorded. Stock updated.");
  };

  // ── DELETE SLAB ──
  const deleteSlab = async (id) => {
    await sb.from("slabs").delete().eq("id", id);
    setSlabs(p => p.filter(s => s.id !== id));
    notify("Slab removed");
  };

  // ── SAVE EDIT SLAB ──
  const saveEditSlab = async () => {
    const status = getStatus(editSlabData.qty, editSlabData.threshold);
    const { error } = await sb.from("slabs").update({
      name: editSlabData.name, type: editSlabData.type, variety: editSlabData.variety,
      finish: editSlabData.finish, length: editSlabData.length, width: editSlabData.width,
      qty: editSlabData.qty, price_per_sqft: editSlabData.price_per_sqft,
      cost_per_sqft: editSlabData.cost_per_sqft, block: editSlabData.block,
      row_no: editSlabData.row_no, slot_no: editSlabData.slot_no,
      threshold: editSlabData.threshold, supplier: editSlabData.supplier, status
    }).eq("id", editSlabData.id);
    if (error) { notify(error.message, "error"); return; }
    setSlabs(p => p.map(s => s.id === editSlabData.id ? { ...editSlabData, status } : s));
    setEditSlabData(null); notify("Updated!");
  };

  // ── RESERVE SLAB ──
  const reserveSlab = async () => {
    if (!rf.customer) { notify("Enter name", "error"); return; }
    await sb.from("slabs").update({ reserved_for: rf.customer }).eq("id", reserveTarget.id);
    setSlabs(p => p.map(s => s.id === reserveTarget.id ? { ...s, reserved_for: rf.customer } : s));
    setReserveTarget(null); setRf({ customer: "", phone: "", days: "7" });
    notify(`Reserved for ${rf.customer}`);
  };

  // ── ADD CUSTOMER ──
  const addCustomer = async () => {
    if (!nc.name) { notify("Enter name", "error"); return; }
    const { data, error } = await sb.from("customers").insert({ business_id: business.id, name: nc.name, phone: nc.phone, email: nc.email, type: nc.type, gst_no: nc.gstNo, credit_limit: +nc.creditLimit || 0, notes: nc.notes }).select().single();
    if (error) { notify(error.message, "error"); return; }
    setCustomers(p => [...p, data]);
    setAddCustOpen(false);
    setNc({ name: "", phone: "", email: "", type: "Contractor", gstNo: "", creditLimit: "", notes: "" });
    notify("Account created!");
  };

  // ── STATS ──
  const stats = useMemo(() => {
    const tv = slabs.reduce((s, i) => s + i.qty * i.price_per_sqft, 0);
    const tc = slabs.reduce((s, i) => s + i.qty * i.cost_per_sqft, 0);
    const tr = sales.reduce((s, i) => s + i.sqft_sold * i.price_per_sqft, 0);
    const tp = sales.reduce((s, i) => s + i.sqft_sold * (i.price_per_sqft - i.cost_per_sqft), 0);
    const totalDue = sales.reduce((s, i) => { const t = i.sqft_sold * i.price_per_sqft * 1.18; return s + Math.max(0, t - (i.paid_amount || 0)); }, 0);
    const totalSqft = slabs.reduce((s, i) => s + i.qty, 0);
    return { totalSlabs: totalSqft, varieties: slabs.length, tv, tc, tr, tp, low: slabs.filter(i => i.status === "Low Stock").length, out: slabs.filter(i => i.status === "Out of Stock").length, totalDue };
  }, [slabs, sales]);

  const filtered = useMemo(() => slabs.filter(s =>
    (s.name.toLowerCase().includes(search.toLowerCase()) || (s.barcode || "").toLowerCase().includes(search.toLowerCase())) &&
    (fType === "All" || s.type === fType) && (fStatus === "All" || s.status === fStatus) && (fBlock === "All" || s.block === fBlock)
  ), [slabs, search, fType, fStatus, fBlock]);



  const TABS = [
    { k: "dashboard", l: "Dashboard", i: "▦" }, { k: "inventory", l: "Inventory", i: "◈" },
    { k: "yard", l: "Yard Map", i: "⊞" }, { k: "qrcodes", l: "QR Codes", i: "⬛" },
    { k: "sales", l: "Sales & Billing", i: "₹" }, { k: "payments", l: "Payments", i: "💳" },
    { k: "cutting", l: "Profit Planner", i: "✂" }, { k: "customers", l: "Accounts", i: "👤" },
    { k: "reports", l: "Reports", i: "📊" }, { k: "ai", l: "AI Insights", i: "🧠" },
  ];

  if (loading) return <Loader msg="Loading your inventory..." />;

  return (
    <div style={{ fontFamily: "'DM Sans','Inter',-apple-system,sans-serif", background: "#f0f6ff", minHeight: "100vh", color: "#0f172a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
        input,select{font-size:16px!important}
        table{width:100%;border-collapse:collapse}
        th{padding:9px 12px;text-align:left;font-size:10px;font-weight:700;letter-spacing:0.8px;color:#94a3b8;background:#f8faff;border-bottom:1px solid #e2e8f0}
        td{padding:10px 12px;border-bottom:1px solid #f8faff;font-size:13px;vertical-align:middle;color:#334155}
        tr:hover td{background:#f8faff}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp 0.3s ease}
        .g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
        .g4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px}
        .g5{display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;gap:12px}
        .hide-mobile{display:flex}
        .mobile-bottom-nav{display:none}
        @media(max-width:1024px){.g5{grid-template-columns:1fr 1fr 1fr!important}.g4{grid-template-columns:1fr 1fr!important}}
        @media(max-width:768px){
          .g3,.g4,.g5{grid-template-columns:1fr 1fr!important}
          .hide-mobile{display:none!important}
          .mobile-bottom-nav{display:flex!important;position:fixed;bottom:0;left:0;right:0;z-index:200;background:#1e3a5f;border-top:1px solid rgba(255,255,255,0.1);padding:6px 0 calc(8px + env(safe-area-inset-bottom));justify-content:space-around;align-items:center}
          th{padding:7px 8px;font-size:9px}
          td{padding:8px;font-size:12px}
        }
        @media(max-width:600px){.g2,.g3,.g4,.g5{grid-template-columns:1fr!important}}
      `}</style>

      {notif && <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 999, background: notif.type === "error" ? "#fef2f2" : "#f0fdf4", border: `1px solid ${notif.type === "error" ? "#fca5a5" : "#86efac"}`, color: notif.type === "error" ? "#dc2626" : "#16a34a", padding: "11px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", animation: "fadeUp 0.25s ease", whiteSpace: "nowrap", maxWidth: "90vw" }}>
        {notif.type === "success" ? "✓ " : "✕ "}{notif.msg}
      </div>}

      {/* HEADER */}
      <header style={{ background: "#1e3a5f", padding: "0 16px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 16px rgba(15,36,68,0.3)" }}>
        <div style={{ maxWidth: 1500, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, background: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="1" y="1" width="8" height="8" rx="1" fill="#1e3a5f" /><rect x="11" y="1" width="8" height="8" rx="1" fill="#1e3a5f" /><rect x="1" y="11" width="8" height="8" rx="1" fill="#1e3a5f" /><rect x="11" y="11" width="8" height="8" rx="1" fill="#3b82f6" /></svg>
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: 2, lineHeight: 1.1 }}>STONETRACK</div>
                <div style={{ color: "#93c5fd", fontSize: 9, letterSpacing: 1.5 }}>{business.business_name.toUpperCase()}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {stats.totalDue > 0 && <div onClick={() => setTab("payments")} style={{ background: "#fef3c7", color: "#92400e", borderRadius: 6, padding: "4px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>💳 {fmtINR(Math.round(stats.totalDue))}</div>}
              {(stats.low + stats.out) > 0 && <div onClick={() => setTab("inventory")} style={{ background: "#fee2e2", color: "#991b1b", borderRadius: 6, padding: "4px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>⚠ {stats.low + stats.out}</div>}
              <button onClick={() => setStaffPinOpen(true)} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", minHeight: 34, display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Staff PIN
              </button>
              <button onClick={() => sb.auth.signOut()} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", minHeight: 34 }}>🔒 Logout</button>
            </div>
          </div>
          <div className="hide-mobile" style={{ overflowX: "auto", gap: 0 }}>
            {TABS.map(t => (
              <button key={t.k} onClick={() => setTab(t.k)} style={{ background: "none", border: "none", borderBottom: tab === t.k ? "2.5px solid #fff" : "2.5px solid transparent", color: tab === t.k ? "#fff" : "#93c5fd", padding: "10px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s", display: "inline-flex", alignItems: "center", gap: 4 }}>
                {t.i} {t.l}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAV */}
      <div className="mobile-bottom-nav">
        {[{ k: "dashboard", l: "Home", i: "▦" }, { k: "inventory", l: "Stock", i: "◈" }, { k: "sales", l: "Sales", i: "₹" }, { k: "payments", l: "Pay", i: "💳" }, { k: "customers", l: "Accounts", i: "👤" }, { k: "more", l: "More", i: "⋯" }].map(t => (
          <button key={t.k} onClick={() => { if (t.k === "more") { setShowMoreMenu(p => !p); } else { setTab(t.k); setShowMoreMenu(false); } }}
            style={{ background: "none", border: "none", color: tab === t.k ? "#fff" : "#64a0d4", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer", padding: "4px 8px", minWidth: 48, position: "relative" }}>
            <div style={{ fontSize: 18, lineHeight: 1 }}>{t.i}</div>
            <div style={{ fontSize: 9, fontWeight: 600 }}>{t.l}</div>
            {tab === t.k && t.k !== "more" && <div style={{ position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)", width: 24, height: 3, background: "#3b82f6", borderRadius: 2 }} />}
          </button>
        ))}
      </div>

      {showMoreMenu && <>
        <div style={{ position: "fixed", bottom: 68, left: 0, right: 0, zIndex: 199, background: "#1e3a5f", borderTop: "1px solid rgba(255,255,255,0.15)", padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[{ k: "yard", l: "Yard Map", i: "⊞" }, { k: "qrcodes", l: "QR Codes", i: "⬛" }, { k: "cutting", l: "Profit", i: "✂" }, { k: "reports", l: "Reports", i: "📊" }, { k: "ai", l: "AI Insights", i: "🧠" }].map(t => (
            <button key={t.k} onClick={() => { setTab(t.k); setShowMoreMenu(false); }}
              style={{ background: tab === t.k ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", borderRadius: 10, padding: "12px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 20 }}>{t.i}</span>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{t.l}</span>
            </button>
          ))}
        </div>
        <div style={{ position: "fixed", inset: 0, zIndex: 198 }} onClick={() => setShowMoreMenu(false)} />
      </>}

      <main style={{ maxWidth: 1500, margin: "0 auto", padding: "16px 14px 90px" }}>

        {/* DASHBOARD */}
        {tab === "dashboard" && <div className="fu">
          <div style={{ fontWeight: 800, fontSize: 20, color: "#1e3a5f", marginBottom: 2 }}>Business Overview</div>
          <div style={{ color: "#64748b", fontSize: 13, marginBottom: 18 }}>{today} · {business.business_name}</div>

          {/* Empty state banner for new users */}
          {slabs.length === 0 && (
            <div style={{ background: "linear-gradient(135deg, #eff6ff, #f0fdf4)", border: "1.5px dashed #93c5fd", borderRadius: 14, padding: "24px 20px", marginBottom: 20, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>👋</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#1e3a5f", marginBottom: 6 }}>Your inventory is empty!</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16, lineHeight: 1.6 }}>Add your first slab to start tracking stock, generating QR codes, and recording sales.</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => setAddSlabOpen(true)} style={{ background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>📦 Add First Slab</button>
                <button onClick={() => setShowWelcome(true)} style={{ background: "#fff", color: "#1e3a5f", border: "1.5px solid #dbeafe", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>📋 Setup Guide</button>
              </div>
            </div>
          )}
          <div className="g5" style={{ marginBottom: 16 }}>
            <StatCard label="Total Sq.Ft" value={stats.totalSlabs} sub={`${stats.varieties} varieties`} color="#1e3a5f" icon="⬜" />
            <StatCard label="Inventory Value" value={fmtL(stats.tv)} sub="Sq.Ft × Selling price" color="#2563a8" icon="◈" />
            <StatCard label="Total Revenue" value={fmtL(stats.tr)} sub={`${sales.length} invoices`} color="#16a34a" icon="₹" />
            <StatCard label="Total Profit" value={fmtL(stats.tp)} sub={`${stats.tr > 0 ? ((stats.tp / stats.tr) * 100).toFixed(1) : 0}% margin`} color="#7c3aed" icon="%" />
            <StatCard label="Dues Pending" value={fmtINR(Math.round(stats.totalDue))} sub="Incl. GST" color={stats.totalDue > 0 ? "#dc2626" : "#16a34a"} icon="💳" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, marginBottom: 16 }}>
            <Card ch={<>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1e3a5f", marginBottom: 14 }}>Quick Actions</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[["+ Add Slab", () => setAddSlabOpen(true), "#1e3a5f"], ["QR Codes", () => setTab("qrcodes"), "#0369a1"], ["New Sale", () => setTab("inventory"), "#059669"], ["Reports", () => setTab("reports"), "#7c3aed"]].map(([l, fn, c]) => (
                  <button key={l} onClick={fn} style={{ background: c + "12", border: `1.5px solid ${c}30`, color: c, padding: 14, borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", minHeight: 46 }}>{l}</button>
                ))}
              </div>
            </>} />
            <Card ch={<>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1e3a5f", marginBottom: 12 }}>Stock Alerts</div>
              {slabs.filter(s => s.status !== "In Stock").length === 0
                ? <div style={{ color: "#16a34a", textAlign: "center", padding: 20, fontSize: 13 }}>✓ All stock levels healthy</div>
                : slabs.filter(s => s.status !== "In Stock").slice(0, 5).map(s => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7, background: stb(s.status), borderLeft: `3px solid ${stc(s.status)}`, borderRadius: 6, padding: "8px 10px" }}>
                    <div><div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div><div style={{ fontSize: 11, color: "#64748b" }}>{s.barcode}</div></div>
                    <span style={{ fontWeight: 800, color: stc(s.status) }}>{s.qty}</span>
                  </div>
                ))}
            </>} />
          </div>
          <Card ch={<>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1e3a5f", marginBottom: 12 }}>Recent Sales</div>
            <div style={{ overflowX: "auto" }}><table><thead><tr><th>DATE</th><th>ITEM</th><th>CUSTOMER</th><th>SQFT</th><th>TOTAL+GST</th><th>PROFIT</th><th>STATUS</th></tr></thead>
              <tbody>{sales.slice(0, 5).map(s => (<tr key={s.id}><td style={{ color: "#64748b", fontSize: 12 }}>{s.date}</td><td style={{ fontWeight: 600, color: "#1e3a5f" }}>{s.slab_name}</td><td>{s.customer}</td><td style={{ color: "#2563eb", fontWeight: 700 }}>{s.sqft_sold}</td><td style={{ color: "#16a34a", fontWeight: 700 }}>{fmtINR(Math.round(s.sqft_sold * s.price_per_sqft * 1.18))}</td><td style={{ color: "#7c3aed" }}>{fmtINR(s.sqft_sold * (s.price_per_sqft - s.cost_per_sqft))}</td><td><span style={{ background: stb(s.delivery_status === "Delivered" ? "In Stock" : "Low Stock"), color: stc(s.delivery_status === "Delivered" ? "In Stock" : "Low Stock"), borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{s.delivery_status}</span></td></tr>))}</tbody>
            </table></div>
          </>} />
        </div>}

        {/* INVENTORY */}
        {tab === "inventory" && <div className="fu">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div><div style={{ fontWeight: 800, fontSize: 20, color: "#1e3a5f" }}>Slab Inventory</div><div style={{ color: "#64748b", fontSize: 13 }}>{filtered.length} / {slabs.length} slabs</div></div>
            <Btn ch="+ Add Slab" onClick={() => setAddSlabOpen(true)} />
          </div>
          <Card style={{ marginBottom: 12, padding: 12 }} ch={<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input style={{ flex: 1, minWidth: 160, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none", background: "#f8faff", minHeight: 42 }} placeholder="🔍 Name or barcode..." value={search} onChange={e => setSearch(e.target.value)} />
            {[["All", ...STONE_TYPES], ["All", "In Stock", "Low Stock", "Out of Stock"], ["All", ...BLOCKS.map(b => `Block ${b}`)]].map((opts, i) => (
              <select key={i} value={[fType, fStatus, fBlock][i]} onChange={e => [setFType, setFStatus, setFBlock][i](e.target.value.replace("Block ", ""))} style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", background: "#fff", minHeight: 42 }}>
                {opts.map(o => <option key={o}>{o}</option>)}
              </select>
            ))}
          </div>} />
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            {slabs.length === 0 ? (
              <Card ch={<div style={{ textAlign: "center", padding: "48px 20px" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                <div style={{ fontWeight: 700, fontSize: 18, color: "#1e3a5f", marginBottom: 8 }}>No slabs yet</div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Add your marble and granite inventory to get started</div>
                <button onClick={() => setAddSlabOpen(true)} style={{ background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>+ Add Your First Slab</button>
              </div>} />
            ) : (
            <Card style={{ padding: 0, minWidth: 900 }} ch={<table>
              <thead><tr><th>BARCODE</th><th>NAME</th><th>TYPE</th><th>SIZE (ft)</th><th>SLABS</th><th>SQ.FT</th><th>BLOCK</th><th>SELL ₹</th><th>COST ₹</th><th>MARGIN</th><th>STATUS</th><th>RESERVED</th><th>ACTIONS</th></tr></thead>
              <tbody>{filtered.map(s => {
                const margin = s.price_per_sqft > 0 ? (((s.price_per_sqft - s.cost_per_sqft) / s.price_per_sqft) * 100).toFixed(0) : 0;
                const slabCount = s.sqft > 0 ? Math.floor(s.qty / s.sqft) : "—";
                return (<tr key={s.id}>
                  <td><span style={{ fontFamily: "monospace", fontSize: 11, background: "#f0f6ff", color: "#1e3a5f", padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>{s.barcode}</span></td>
                  <td style={{ fontWeight: 700, color: "#1e3a5f" }}>{s.name}</td>
                  <td><span style={{ background: s.type === "Marble" ? "#dbeafe" : s.type === "Granite" ? "#fce7f3" : "#f0fdf4", color: s.type === "Marble" ? "#1d4ed8" : s.type === "Granite" ? "#9d174d" : "#166534", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{s.type}</span></td>
                  <td style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>{s.length && s.width ? `${s.length}×${s.width}` : "—"}</td>
                  <td style={{ fontWeight: 700, color: "#1e3a5f" }}>{slabCount}</td>
                  <td style={{ fontWeight: 800, fontSize: 15, color: s.qty === 0 ? "#dc2626" : "#2563eb" }}>{s.qty} <span style={{ fontSize: 10, fontWeight: 400, color: "#94a3b8" }}>sqft</span></td>
                  <td style={{ color: "#64748b" }}>{s.block}</td>
                  <td style={{ color: "#16a34a", fontWeight: 600 }}>{fmtINR(s.price_per_sqft)}</td>
                  <td style={{ color: "#dc2626", fontSize: 12 }}>{fmtINR(s.cost_per_sqft)}</td>
                  <td><span style={{ color: +margin > 30 ? "#16a34a" : +margin > 15 ? "#d97706" : "#dc2626", fontWeight: 700 }}>{margin}%</span></td>
                  <td><span style={{ background: stb(s.status), color: stc(s.status), borderRadius: 5, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}>{s.status}</span></td>
                  <td style={{ fontSize: 11, color: s.reserved_for ? "#d97706" : "#cbd5e1" }}>{s.reserved_for || "—"}</td>
                  <td><div style={{ display: "flex", gap: 4 }}>
                    <Btn sm ch="View" v="g" onClick={() => setDetailTarget(s)} />
                    <Btn sm ch="Sell" onClick={() => setSaleTarget(s)} />
                    <Btn sm ch="QR" v="g" onClick={() => setPrintTarget(s)} />
                    <Btn sm ch="Edit" v="g" onClick={() => setEditSlabData({ ...s })} />
                    <Btn sm ch="Dmg" v="d" onClick={() => setDamageTarget(s)} />
                    <Btn sm ch="🗑" v="d" onClick={async () => { if (window.confirm(`Delete "${s.name}"? This cannot be undone.`)) { await sb.from("slabs").delete().eq("id", s.id); setSlabs(p => p.filter(x => x.id !== s.id)); notify("Slab deleted"); } }} />
                  </div></td>
                </tr>);
              })}</tbody>
            </table>} />
            )}
          </div>
        </div>}

        {/* YARD MAP */}
        {tab === "yard" && <div className="fu">
          <div style={{ fontWeight: 800, fontSize: 20, color: "#1e3a5f", marginBottom: 4 }}>Yard Layout Map</div>
          <div style={{ color: "#64748b", fontSize: 13, marginBottom: 18 }}>Tap a block to see stored slabs</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 18 }}>
            {BLOCKS.map(block => {
              const bs = slabs.filter(s => s.block === block);
              const hasAlert = bs.some(s => s.status !== "In Stock");
              return (
                <div key={block} onClick={() => setYardBlock(yardBlock === block ? null : block)} style={{ background: yardBlock === block ? "#f0f6ff" : "#fff", border: `2px solid ${yardBlock === block ? "#1e3a5f" : hasAlert ? "#d97706" : "#e2e8f0"}`, borderRadius: 10, padding: 16, cursor: "pointer", transition: "all 0.2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontWeight: 800, fontSize: 20, color: "#1e3a5f" }}>Block {block}</div>
                    {hasAlert && <span>🟡</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{bs.length} types · {bs.reduce((s, i) => s + i.qty, 0)} slabs</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {bs.map(s => <div key={s.id} title={s.name} style={{ width: 12, height: 12, borderRadius: 3, background: stc(s.status) }} />)}
                    {bs.length === 0 && <span style={{ fontSize: 11, color: "#cbd5e1" }}>Empty</span>}
                  </div>
                </div>
              );
            })}
          </div>
          {yardBlock && <Card ch={<>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1e3a5f", marginBottom: 14 }}>Block {yardBlock}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
              {slabs.filter(s => s.block === yardBlock).map(s => (
                <div key={s.id} style={{ background: stb(s.status), borderTop: `3px solid ${stc(s.status)}`, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>{s.barcode}</div>
                  <div style={{ fontWeight: 700, color: "#1e3a5f", marginBottom: 2 }}>{s.name}</div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: stc(s.status) }}>{s.qty} <span style={{ fontSize: 10, fontWeight: 400, color: "#94a3b8" }}>slabs</span></div>
                  {s.reserved_for && <div style={{ fontSize: 10, color: "#d97706", fontWeight: 600, marginTop: 4 }}>📌 {s.reserved_for}</div>}
                </div>
              ))}
            </div>
          </>} />}
        </div>}

        {/* QR CODES */}
        {tab === "qrcodes" && <div className="fu">
          <div style={{ fontWeight: 800, fontSize: 20, color: "#1e3a5f", marginBottom: 14 }}>QR Code Management</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
            {slabs.map(s => (
              <Card key={s.id} style={{ textAlign: "center", borderTop: `3px solid ${stc(s.status)}`, padding: 14 }} ch={<>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><QRCode value={s.barcode || "ST-000"} size={90} /></div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1e3a5f", marginBottom: 2 }}>{s.name}</div>
                <div style={{ fontFamily: "monospace", fontSize: 11, background: "#f0f6ff", color: "#1e3a5f", padding: "2px 6px", borderRadius: 4, display: "inline-block", fontWeight: 700, marginBottom: 8 }}>{s.barcode}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ background: stb(s.status), color: stc(s.status), borderRadius: 5, padding: "2px 7px", fontSize: 11, fontWeight: 700 }}>{s.status}</span>
                  <span style={{ fontWeight: 800, color: "#1e3a5f" }}>{s.qty}</span>
                </div>
                <button onClick={() => setPrintTarget(s)} style={{ width: "100%", background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 7, padding: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", minHeight: 38 }}>🖨 Print</button>
              </>} />
            ))}
          </div>
        </div>}

        {/* SALES */}
        {tab === "sales" && <div className="fu">
          <div style={{ fontWeight: 800, fontSize: 20, color: "#1e3a5f", marginBottom: 16 }}>Sales & Billing</div>
          <div className="g4" style={{ marginBottom: 16 }}>
            <StatCard label="Revenue (ex GST)" value={fmtL(stats.tr)} color="#16a34a" icon="₹" />
            <StatCard label="Revenue (inc GST)" value={fmtL(stats.tr * 1.18)} color="#0369a1" icon="🧾" />
            <StatCard label="Total Profit" value={fmtL(stats.tp)} color="#7c3aed" icon="%" />
            <StatCard label="Margin" value={`${stats.tr > 0 ? ((stats.tp / stats.tr) * 100).toFixed(1) : 0}%`} color="#1e3a5f" icon="📈" />
          </div>
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <Card style={{ padding: 0, minWidth: 900 }} ch={<table>
              <thead><tr><th>INVOICE</th><th>DATE</th><th>ITEM</th><th>CUSTOMER</th><th>SQFT</th><th>TOTAL</th><th>PAID</th><th>DUE</th><th>PROFIT</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
              <tbody>{sales.map(s => {
                const total = Math.round(s.sqft_sold * s.price_per_sqft * 1.18);
                const paid = s.paid_amount || 0;
                const due = total - paid;
                return (<tr key={s.id}>
                  <td><span style={{ fontFamily: "monospace", fontSize: 11, background: "#f0f6ff", color: "#1e3a5f", padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>{s.invoice_no}</span></td>
                  <td style={{ color: "#64748b", fontSize: 12 }}>{s.date}</td>
                  <td style={{ fontWeight: 600, color: "#1e3a5f" }}>{s.slab_name}</td>
                  <td>{s.customer}</td>
                  <td style={{ color: "#2563eb", fontWeight: 700 }}>{s.sqft_sold}</td>
                  <td style={{ fontWeight: 700 }}>{fmtINR(total)}</td>
                  <td style={{ color: "#16a34a", fontWeight: 700 }}>{fmtINR(paid)}</td>
                  <td style={{ color: due > 0 ? "#dc2626" : "#16a34a", fontWeight: 700 }}>{due > 0 ? fmtINR(due) : "✓"}</td>
                  <td style={{ color: "#7c3aed" }}>{fmtINR(s.sqft_sold * (s.price_per_sqft - s.cost_per_sqft))}</td>
                  <td><span style={{ background: stb(s.delivery_status === "Delivered" ? "In Stock" : "Low Stock"), color: stc(s.delivery_status === "Delivered" ? "In Stock" : "Low Stock"), borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{s.delivery_status}</span></td>
                  <td><div style={{ display: "flex", gap: 4 }}>
                    <Btn sm ch="Invoice" v="g" onClick={() => setInvoiceView(s)} />
                    {due > 0 && <Btn sm ch="Pay" v="g2" onClick={() => { setPaymentTarget(s); setPayForm({ amount: String(due), mode: "Cash", note: "" }); }} />}
                  </div></td>
                </tr>);
              })}</tbody>
            </table>} />
          </div>
        </div>}

        {/* PAYMENTS */}
        {tab === "payments" && <div className="fu">
          <div style={{ fontWeight: 800, fontSize: 20, color: "#1e3a5f", marginBottom: 16 }}>Payment Tracker</div>
          <div className="g4" style={{ marginBottom: 16 }}>
            {(() => {
              const ti = sales.reduce((s, i) => s + Math.round(i.sqft_sold * i.price_per_sqft * 1.18), 0);
              const tp = sales.reduce((s, i) => s + (i.paid_amount || 0), 0);
              const fp = sales.filter(s => (s.paid_amount || 0) >= Math.round(s.sqft_sold * s.price_per_sqft * 1.18)).length;
              return <>
                <StatCard label="Total Invoiced" value={fmtL(ti)} color="#1e3a5f" icon="🧾" />
                <StatCard label="Collected" value={fmtL(tp)} color="#16a34a" icon="✓" />
                <StatCard label="Pending" value={fmtINR(Math.round(ti - tp))} color={ti - tp > 0 ? "#dc2626" : "#16a34a"} icon="⏳" />
                <StatCard label="Fully Paid" value={`${fp}/${sales.length}`} sub="invoices" color="#7c3aed" icon="📋" />
              </>;
            })()}
          </div>
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <Card style={{ padding: 0, minWidth: 700 }} ch={<table>
              <thead><tr><th>INVOICE</th><th>CUSTOMER</th><th>TOTAL</th><th>PAID</th><th>DUE</th><th>PROGRESS</th><th>ACTION</th></tr></thead>
              <tbody>{sales.map(s => {
                const total = Math.round(s.sqft_sold * s.price_per_sqft * 1.18);
                const paid = s.paid_amount || 0;
                const due = total - paid;
                const pct = Math.min(100, Math.round((paid / total) * 100));
                return (<tr key={s.id}>
                  <td><span style={{ fontFamily: "monospace", fontSize: 11, background: "#f0f6ff", color: "#1e3a5f", padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>{s.invoice_no}</span></td>
                  <td style={{ fontWeight: 600 }}>{s.customer}</td>
                  <td style={{ fontWeight: 700 }}>{fmtINR(total)}</td>
                  <td style={{ color: "#16a34a", fontWeight: 700 }}>{fmtINR(paid)}</td>
                  <td style={{ color: due > 0 ? "#dc2626" : "#16a34a", fontWeight: 700 }}>{due > 0 ? fmtINR(due) : "✓ Nil"}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 80 }}>
                      <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 3 }}><div style={{ height: 6, width: `${pct}%`, background: pct === 100 ? "#16a34a" : "#3b82f6", borderRadius: 3 }} /></div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? "#16a34a" : "#64748b" }}>{pct}%</span>
                    </div>
                  </td>
                  <td>{due > 0 && <Btn sm ch="Collect" v="g2" onClick={() => { setPaymentTarget(s); setPayForm({ amount: String(due), mode: "Cash", note: "" }); }} />}</td>
                </tr>);
              })}</tbody>
            </table>} />
          </div>
        </div>}

        {/* PROFIT PLANNER */}
        {tab === "cutting" && <div className="fu">
          <div style={{ fontWeight: 800, fontSize: 20, color: "#1e3a5f", marginBottom: 16 }}>Cutting & Profit Planner</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
            <Card ch={<>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1e3a5f", marginBottom: 12 }}>Profit per Slab</div>
              <div style={{ overflowX: "auto" }}><table>
                <thead><tr><th>SLAB</th><th>SELL</th><th>COST</th><th>MARGIN</th><th>%</th></tr></thead>
                <tbody>{[...slabs].sort((a, b) => (b.price_per_sqft - b.cost_per_sqft) - (a.price_per_sqft - a.cost_per_sqft)).map(s => {
                  const m = s.price_per_sqft - s.cost_per_sqft;
                  const p = s.price_per_sqft > 0 ? ((m / s.price_per_sqft) * 100).toFixed(1) : 0;
                  return (<tr key={s.id}><td style={{ fontWeight: 600, color: "#1e3a5f" }}>{s.name}</td><td style={{ color: "#16a34a" }}>{fmtINR(s.price_per_sqft)}</td><td style={{ color: "#dc2626" }}>{fmtINR(s.cost_per_sqft)}</td><td style={{ color: "#7c3aed", fontWeight: 700 }}>{fmtINR(m)}</td><td><span style={{ color: +p > 30 ? "#16a34a" : +p > 15 ? "#d97706" : "#dc2626", fontWeight: 700 }}>{p}%</span></td></tr>);
                })}</tbody>
              </table></div>
            </>} />
            <Card ch={<>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1e3a5f", marginBottom: 12 }}>Margin Breakdown</div>
              {slabs.map(s => {
                const p = s.price_per_sqft > 0 ? ((s.price_per_sqft - s.cost_per_sqft) / s.price_per_sqft * 100).toFixed(0) : 0;
                return (<div key={s.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{s.name}</span>
                    <span style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700 }}>{p}%</span>
                  </div>
                  <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3 }}><div style={{ height: 6, width: `${Math.min(+p, 100)}%`, background: +p > 30 ? "#16a34a" : +p > 15 ? "#d97706" : "#dc2626", borderRadius: 3 }} /></div>
                </div>);
              })}
            </>} />
          </div>
        </div>}

        {/* ACCOUNTS */}
        {tab === "customers" && <div className="fu">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: "#1e3a5f" }}>Accounts</div>
            <Btn ch="+ Add Account" onClick={() => setAddCustOpen(true)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 14 }}>
            {customers.map(c => {
              const cs = sales.filter(s => s.customer === c.name);
              const rev = cs.reduce((s, i) => s + i.sqft_sold * i.price_per_sqft, 0);
              const due = cs.reduce((s, i) => s + Math.max(0, Math.round(i.sqft_sold * i.price_per_sqft * 1.18) - (i.paid_amount || 0)), 0);
              return (<Card key={c.id} ch={<>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <div><div style={{ fontWeight: 700, fontSize: 15, color: "#1e3a5f" }}>{c.name}</div><span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{c.type}</span></div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#16a34a" }}>{fmtL(rev)}</div>
                    {due > 0 && <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 700 }}>Due: {fmtINR(due)}</div>}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>📞 {c.phone}</div>
                {c.notes && <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic", marginBottom: 4 }}>"{c.notes}"</div>}
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>🛒 {cs.length} orders</div>
                <HR />
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn sm ch="History" v="g" onClick={() => setViewCust(c)} />
                  <Btn sm ch="WhatsApp" v="g" onClick={() => notify(`WhatsApp — coming in v2`)} />
                </div>
              </>} />);
            })}
          </div>
        </div>}

        {/* REPORTS */}
        {tab === "reports" && <div className="fu">
          <div style={{ fontWeight: 800, fontSize: 20, color: "#1e3a5f", marginBottom: 18 }}>Business Reports</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
            <Card ch={<>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1e3a5f", marginBottom: 12 }}>P&L Summary</div>
              {[["Inventory Value (Sell)", fmtINR(stats.tv), "#0369a1"], ["Inventory Cost", fmtINR(stats.tc), "#dc2626"], ["Unrealised Profit", fmtINR(stats.tv - stats.tc), "#7c3aed"], ["Revenue (ex GST)", fmtINR(stats.tr), "#16a34a"], ["GST Collected", fmtINR(Math.round(stats.tr * 0.18)), "#0369a1"], ["Revenue (inc GST)", fmtINR(Math.round(stats.tr * 1.18)), "#1e3a5f"], ["Total Profit", fmtINR(stats.tp), "#16a34a"], ["Margin", `${stats.tr > 0 ? ((stats.tp / stats.tr) * 100).toFixed(1) : 0}%`, "#d97706"], ["Dues Pending", fmtINR(Math.round(stats.totalDue)), stats.totalDue > 0 ? "#dc2626" : "#16a34a"]].map(([l, v, c]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f8faff" }}>
                  <span style={{ color: "#64748b", fontSize: 13 }}>{l}</span>
                  <span style={{ fontWeight: 700, color: c }}>{v}</span>
                </div>
              ))}
            </>} />
            <Card ch={<>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1e3a5f", marginBottom: 12 }}>Top Selling Slabs</div>
              <div style={{ overflowX: "auto" }}><table><thead><tr><th>#</th><th>SLAB</th><th>SQFT SOLD</th><th>REVENUE</th></tr></thead>
                <tbody>{slabs.map(s => ({ ...s, rev: sales.filter(sl => sl.slab_id === s.id).reduce((t, sl) => t + sl.sqft_sold * sl.price_per_sqft, 0), sqftT: sales.filter(sl => sl.slab_id === s.id).reduce((t, sl) => t + sl.sqft_sold, 0) })).sort((a, b) => b.rev - a.rev).slice(0, 6).map((s, i) => (
                  <tr key={s.id}><td style={{ fontWeight: 700, color: i < 3 ? "#d97706" : "#94a3b8" }}>{i + 1}</td><td style={{ fontWeight: 600, color: "#1e3a5f" }}>{s.name}</td><td style={{ color: "#2563eb" }}>{s.sqftT}</td><td style={{ color: "#16a34a", fontWeight: 700 }}>{fmtINR(s.rev)}</td></tr>
                ))}</tbody>
              </table></div>
            </>} />
          </div>
        </div>}

        {/* AI INSIGHTS */}
        {tab === "ai" && <div className="fu">
          <div style={{ fontWeight: 800, fontSize: 20, color: "#1e3a5f", marginBottom: 4 }}>AI Insights</div>
          <div style={{ color: "#64748b", fontSize: 13, marginBottom: 18 }}>Based on your sales patterns and stock levels</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
            {[
              { i: "🔮", t: "Demand Forecast", d: `${slabs.find(s => s.status === "Low Stock")?.name || "Some slabs"} may run out soon. Consider restocking before peak season.`, c: "#0369a1" },
              { i: "📉", t: "Slow Moving", d: `${slabs.filter(s => s.qty > s.threshold * 3).length} slabs have high stock. Consider offering discounts to move them.`, c: "#d97706" },
              { i: "💰", t: "Best Margin", d: `${[...slabs].sort((a, b) => (b.price_per_sqft - b.cost_per_sqft) / b.price_per_sqft - (a.price_per_sqft - a.cost_per_sqft) / a.price_per_sqft)[0]?.name || "—"} has your highest margin. Push this variety to customers.`, c: "#16a34a" },
              { i: "🧾", t: "Payment Alert", d: `You have ${fmtINR(Math.round(stats.totalDue))} in pending collections. Follow up with customers today.`, c: "#7c3aed" },
              { i: "📊", t: "Revenue Trend", d: `${sales.length} invoices recorded. Total revenue ${fmtL(stats.tr)}. Keep adding sales to track trends.`, c: "#059669" },
              { i: "⚠️", t: "Out of Stock", d: `${stats.out} varieties are completely out of stock. These are lost sales opportunities.`, c: "#dc2626" },
            ].map((ins, i) => (
              <Card key={i} style={{ borderLeft: `4px solid ${ins.c}` }} ch={<>
                <div style={{ fontSize: 26, marginBottom: 8 }}>{ins.i}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1e3a5f", marginBottom: 6 }}>{ins.t}</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{ins.d}</div>
              </>} />
            ))}
          </div>
        </div>}

      </main>

      {/* ── MODALS ── */}
      {addSlabOpen && <Mdl title="Add New Slab" onClose={() => setAddSlabOpen(false)} wide ch={<>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="g2"><Inp label="Slab Name *" placeholder="e.g. Carrara White" value={ns.name} onChange={e => setNs(p => ({ ...p, name: e.target.value }))} /><Sel label="Type" options={STONE_TYPES} value={ns.type} onChange={e => setNs(p => ({ ...p, type: e.target.value }))} /></div>
          <div className="g2"><Sel label="Variety" options={VARIETIES} value={ns.variety} onChange={e => setNs(p => ({ ...p, variety: e.target.value }))} /><Sel label="Finish" options={FINISHES} value={ns.finish} onChange={e => setNs(p => ({ ...p, finish: e.target.value }))} /></div>
          <div className="g2"><Inp label="Length (ft)" type="number" placeholder="e.g. 8" value={ns.length} onChange={e => setNs(p => ({ ...p, length: e.target.value }))} /><Inp label="Width (ft)" type="number" placeholder="e.g. 4" value={ns.width} onChange={e => setNs(p => ({ ...p, width: e.target.value }))} /></div>
          <div className="g2">
            <Inp label="No. of Slabs *" type="number" placeholder="e.g. 10" value={ns.slabs} onChange={e => setNs(p => ({ ...p, slabs: e.target.value }))} />
            <Inp label="Sq.Ft per Slab *" type="number" placeholder="e.g. 32" value={ns.sqft} onChange={e => setNs(p => ({ ...p, sqft: e.target.value }))} />
          </div>
          {ns.slabs && ns.sqft && +ns.slabs > 0 && +ns.sqft > 0 && (
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#16a34a", fontWeight: 700 }}>
              📦 Total Stock = {+ns.slabs} slabs × {+ns.sqft} sqft = <span style={{ fontSize: 16 }}>{+ns.slabs * +ns.sqft} sqft</span>
            </div>
          )}
          <div className="g3"><Inp label="Selling ₹/Sqft *" type="number" placeholder="e.g. 280" value={ns.pricePerSqft} onChange={e => setNs(p => ({ ...p, pricePerSqft: e.target.value }))} /><Inp label="Cost ₹/Sqft" type="number" placeholder="e.g. 180" value={ns.costPerSqft} onChange={e => setNs(p => ({ ...p, costPerSqft: e.target.value }))} /><Inp label="Low Stock Alert (sqft)" type="number" value={ns.threshold} onChange={e => setNs(p => ({ ...p, threshold: e.target.value }))} /></div>
          <div className="g3"><Sel label="Block" options={BLOCKS} value={ns.block} onChange={e => setNs(p => ({ ...p, block: e.target.value }))} /><Inp label="Row" type="number" value={ns.row} onChange={e => setNs(p => ({ ...p, row: e.target.value }))} /><Inp label="Slot" type="number" value={ns.slot} onChange={e => setNs(p => ({ ...p, slot: e.target.value }))} /></div>
          <Inp label="Supplier" value={ns.supplier} onChange={e => setNs(p => ({ ...p, supplier: e.target.value }))} />
        </div>
        <HR />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn ch="Cancel" v="g" onClick={() => setAddSlabOpen(false)} /><Btn ch="Add to Inventory" onClick={addSlab} /></div>
      </>} />}

      {editSlabData && <Mdl title="Edit Slab" sub={editSlabData.name} onClose={() => setEditSlabData(null)} wide ch={<>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="g2"><Inp label="Slab Name" value={editSlabData.name} onChange={e => setEditSlabData(p => ({ ...p, name: e.target.value }))} /><Sel label="Type" options={STONE_TYPES} value={editSlabData.type} onChange={e => setEditSlabData(p => ({ ...p, type: e.target.value }))} /></div>
          <div className="g2"><Sel label="Variety" options={VARIETIES} value={editSlabData.variety} onChange={e => setEditSlabData(p => ({ ...p, variety: e.target.value }))} /><Sel label="Finish" options={FINISHES} value={editSlabData.finish} onChange={e => setEditSlabData(p => ({ ...p, finish: e.target.value }))} /></div>
          <div className="g2"><Inp label="Length (ft)" type="number" value={editSlabData.length} onChange={e => setEditSlabData(p => ({ ...p, length: +e.target.value }))} /><Inp label="Width (ft)" type="number" value={editSlabData.width} onChange={e => setEditSlabData(p => ({ ...p, width: +e.target.value }))} /></div>
          <div className="g3"><Inp label="Sq.Ft Quantity" type="number" value={editSlabData.qty} onChange={e => setEditSlabData(p => ({ ...p, qty: +e.target.value }))} /><Inp label="Selling ₹/Sqft" type="number" value={editSlabData.price_per_sqft} onChange={e => setEditSlabData(p => ({ ...p, price_per_sqft: +e.target.value }))} /><Inp label="Cost ₹/Sqft" type="number" value={editSlabData.cost_per_sqft} onChange={e => setEditSlabData(p => ({ ...p, cost_per_sqft: +e.target.value }))} /></div>
          <div className="g3"><Sel label="Block" options={BLOCKS} value={editSlabData.block} onChange={e => setEditSlabData(p => ({ ...p, block: e.target.value }))} /><Inp label="Row" type="number" value={editSlabData.row_no} onChange={e => setEditSlabData(p => ({ ...p, row_no: +e.target.value }))} /><Inp label="Slot" type="number" value={editSlabData.slot_no} onChange={e => setEditSlabData(p => ({ ...p, slot_no: +e.target.value }))} /></div>
          <div className="g2"><Inp label="Low Stock Alert Below (Sq.Ft)" type="number" value={editSlabData.threshold} onChange={e => setEditSlabData(p => ({ ...p, threshold: +e.target.value }))} /><Inp label="Supplier" value={editSlabData.supplier || ""} onChange={e => setEditSlabData(p => ({ ...p, supplier: e.target.value }))} /></div>
        </div>
        <HR />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn ch="Cancel" v="g" onClick={() => setEditSlabData(null)} /><Btn ch="Save Changes" onClick={saveEditSlab} /></div>
      </>} />}

      {saleTarget && <Mdl title="Record Sale" sub={`${saleTarget.name} · ₹${saleTarget.price_per_sqft}/sqft · ${saleTarget.qty} sqft available`} onClose={() => setSaleTarget(null)} wide ch={<>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="g2"><Inp label="Customer Name" placeholder="Name or company" value={sf.customer} onChange={e => setSf(p => ({ ...p, customer: e.target.value }))} /><Inp label="Phone" value={sf.phone} onChange={e => setSf(p => ({ ...p, phone: e.target.value }))} /></div>
          <div className="g2"><Inp label="Customer GST No." value={sf.gstNo} onChange={e => setSf(p => ({ ...p, gstNo: e.target.value }))} /><Sel label="Payment Mode" options={["Cash", "Bank Transfer", "Cheque", "UPI", "Credit"]} value={sf.paymentMode} onChange={e => setSf(p => ({ ...p, paymentMode: e.target.value }))} /></div>
          <div className="g3"><Inp label="Sq.Ft Required *" type="number" value={sf.sqftSold} onChange={e => setSf(p => ({ ...p, sqftSold: e.target.value }))} /><Inp label="Wastage %" type="number" value={sf.wastage} onChange={e => setSf(p => ({ ...p, wastage: e.target.value }))} /><Inp label="Amount Paid Now ₹" type="number" value={sf.paidAmount} onChange={e => setSf(p => ({ ...p, paidAmount: e.target.value }))} /></div>
        </div>
        {sf.sqftSold && +sf.sqftSold > 0 && (() => {
          const sqftSold = +sf.sqftSold;
          const amt = sqftSold * saleTarget.price_per_sqft;
          const gst = amt * 0.18; const total = amt + gst;
          const pft = sqftSold * (saleTarget.price_per_sqft - saleTarget.cost_per_sqft);
          return (<div style={{ background: "#f8faff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, marginTop: 12 }}>
            {[["Amount (ex GST)", fmtINR(Math.round(amt)), "#1e3a5f"], ["GST 18%", fmtINR(Math.round(gst)), "#64748b"], ["Total", fmtINR(Math.round(total)), "#16a34a"], ["Your Profit", fmtINR(Math.round(pft)), "#7c3aed"], ["Margin", `${((pft / amt) * 100).toFixed(1)}%`, "#d97706"]].map(([l, v, c]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ color: "#64748b", fontSize: 13 }}>{l}</span><span style={{ fontWeight: 700, color: c }}>{v}</span>
              </div>
            ))}
            {sqftSold > saleTarget.qty && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 8, fontWeight: 600 }}>⚠ Only {saleTarget.qty} sq.ft available!</div>}
          </div>);
        })()}
        <HR />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn ch="Cancel" v="g" onClick={() => setSaleTarget(null)} /><Btn ch="Confirm Sale" onClick={doSale} /></div>
      </>} />}

      {reserveTarget && <Mdl title="Reserve Slab" sub={reserveTarget.name} onClose={() => setReserveTarget(null)} ch={<>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Inp label="Customer Name *" value={rf.customer} onChange={e => setRf(p => ({ ...p, customer: e.target.value }))} />
          <Inp label="Phone" value={rf.phone} onChange={e => setRf(p => ({ ...p, phone: e.target.value }))} />
        </div>
        <HR />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn ch="Cancel" v="g" onClick={() => setReserveTarget(null)} /><Btn ch="Reserve" onClick={reserveSlab} /></div>
      </>} />}

      {detailTarget && <Mdl title="Slab Details" sub={detailTarget.barcode} onClose={() => setDetailTarget(null)} wide ch={<>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            {[["Name", detailTarget.name], ["Type", detailTarget.type], ["Variety", detailTarget.variety], ["Finish", detailTarget.finish], ["Size", detailTarget.length && detailTarget.width ? `${detailTarget.length} × ${detailTarget.width} ft` : "—"], ["Sq.Ft in Stock", `${detailTarget.qty} sqft`], ["Location", `Block ${detailTarget.block} · R${detailTarget.row_no} · S${detailTarget.slot_no}`], ["Selling Price", fmtINR(detailTarget.price_per_sqft) + "/sqft"], ["Cost Price", fmtINR(detailTarget.cost_per_sqft) + "/sqft"], ["Profit/Sqft", fmtINR(detailTarget.price_per_sqft - detailTarget.cost_per_sqft)], ["Supplier", detailTarget.supplier || "—"], ["Reserved", detailTarget.reserved_for || "None"]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f8faff" }}>
                <span style={{ color: "#64748b", fontSize: 13 }}>{l}</span>
                <span style={{ fontWeight: 600, fontSize: 13, color: "#1e3a5f" }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <QRCode value={detailTarget.barcode || "ST-000"} size={110} />
            <span style={{ background: stb(detailTarget.status), color: stc(detailTarget.status), borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>{detailTarget.status}</span>
          </div>
        </div>
        <HR />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn sm ch="Record Sale" onClick={() => { setSaleTarget(detailTarget); setDetailTarget(null); }} />
          <Btn sm ch="Print QR" v="g" onClick={() => { setPrintTarget(detailTarget); setDetailTarget(null); }} />
          <Btn sm ch="Reserve" v="g" onClick={() => { setReserveTarget(detailTarget); setDetailTarget(null); }} />
          <Btn sm ch="Damage" v="d" onClick={() => { setDamageTarget(detailTarget); setDetailTarget(null); }} />
        </div>
      </>} />}

      {paymentTarget && <Mdl title="Record Payment" sub={`${paymentTarget.invoice_no} · ${paymentTarget.customer}`} onClose={() => setPaymentTarget(null)} ch={<>
        <div style={{ background: "#f8faff", borderRadius: 8, padding: 12, marginBottom: 16 }}>
          {[["Total (incl GST)", fmtINR(Math.round(paymentTarget.sqft_sold * paymentTarget.price_per_sqft * 1.18))], ["Already Paid", fmtINR(paymentTarget.paid_amount || 0)], ["Balance Due", fmtINR(Math.max(0, Math.round(paymentTarget.sqft_sold * paymentTarget.price_per_sqft * 1.18) - (paymentTarget.paid_amount || 0)))]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ color: "#64748b", fontSize: 13 }}>{l}</span><span style={{ fontWeight: 700, color: "#1e3a5f" }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="g2"><Inp label="Amount Received ₹ *" type="number" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} /><Sel label="Payment Mode" options={["Cash", "Bank Transfer", "Cheque", "UPI"]} value={payForm.mode} onChange={e => setPayForm(p => ({ ...p, mode: e.target.value }))} /></div>
        </div>
        <HR />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn ch="Cancel" v="g" onClick={() => setPaymentTarget(null)} /><Btn ch="Record Payment" v="g2" onClick={recordPayment} /></div>
      </>} />}

      {damageTarget && <Mdl title="Record Damage" sub={damageTarget.name} onClose={() => setDamageTarget(null)} ch={<>
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 13, color: "#991b1b" }}>⚠ This will permanently reduce your stock count</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Inp label="Number of Damaged Slabs *" type="number" min="1" value={damageForm.qty} onChange={e => setDamageForm(p => ({ ...p, qty: e.target.value }))} />
          <Inp label="Reason (optional)" placeholder="e.g. Cracked during transport" value={damageForm.reason} onChange={e => setDamageForm(p => ({ ...p, reason: e.target.value }))} />
        </div>
        <HR />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn ch="Cancel" v="g" onClick={() => setDamageTarget(null)} /><Btn ch="Confirm Damage" v="d" onClick={recordDamage} /></div>
      </>} />}

      {addCustOpen && <Mdl title="Add Account" onClose={() => setAddCustOpen(false)} ch={<>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="g2"><Inp label="Name *" value={nc.name} onChange={e => setNc(p => ({ ...p, name: e.target.value }))} /><Inp label="Phone" value={nc.phone} onChange={e => setNc(p => ({ ...p, phone: e.target.value }))} /></div>
          <div className="g2"><Inp label="Email" value={nc.email} onChange={e => setNc(p => ({ ...p, email: e.target.value }))} /><Sel label="Type" options={["Contractor", "Builder", "Interior Designer", "Retailer", "Customer"]} value={nc.type} onChange={e => setNc(p => ({ ...p, type: e.target.value }))} /></div>
          <div className="g2"><Inp label="GST Number" value={nc.gstNo} onChange={e => setNc(p => ({ ...p, gstNo: e.target.value }))} /><Inp label="Credit Limit ₹" type="number" value={nc.creditLimit} onChange={e => setNc(p => ({ ...p, creditLimit: e.target.value }))} /></div>
          <Inp label="Notes" value={nc.notes} onChange={e => setNc(p => ({ ...p, notes: e.target.value }))} />
        </div>
        <HR />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn ch="Cancel" v="g" onClick={() => setAddCustOpen(false)} /><Btn ch="Create Account" onClick={addCustomer} /></div>
      </>} />}

      {viewCust && <Mdl title={viewCust.name} sub={viewCust.type} onClose={() => setViewCust(null)} wide ch={<>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1e3a5f", marginBottom: 10 }}>Purchase History</div>
        {sales.filter(s => s.customer === viewCust.name).length === 0
          ? <div style={{ color: "#94a3b8", textAlign: "center", padding: 20 }}>No purchases yet</div>
          : <div style={{ overflowX: "auto" }}><table><thead><tr><th>INVOICE</th><th>DATE</th><th>SLAB</th><th>SQFT</th><th>TOTAL</th><th>PAID</th><th>DUE</th></tr></thead>
            <tbody>{sales.filter(s => s.customer === viewCust.name).map(s => {
              const total = Math.round(s.sqft_sold * s.price_per_sqft * 1.18);
              const due = total - (s.paid_amount || 0);
              return (<tr key={s.id}>
                <td><span style={{ fontFamily: "monospace", fontSize: 11, background: "#f0f6ff", color: "#1e3a5f", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>{s.invoice_no}</span></td>
                <td style={{ fontSize: 12, color: "#64748b" }}>{s.date}</td>
                <td style={{ fontWeight: 600 }}>{s.slab_name}</td>
                <td style={{ color: "#2563eb" }}>{s.sqft_sold}</td>
                <td style={{ fontWeight: 700 }}>{fmtINR(total)}</td>
                <td style={{ color: "#16a34a" }}>{fmtINR(s.paid_amount || 0)}</td>
                <td style={{ color: due > 0 ? "#dc2626" : "#16a34a", fontWeight: 700 }}>{due > 0 ? fmtINR(due) : "✓ Paid"}</td>
              </tr>);
            })}</tbody>
          </table></div>}
      </>} />}

      {staffPinOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,36,68,0.45)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={e => e.target === e.currentTarget && setStaffPinOpen(false)}>
          <div style={{ background: "#fff", borderRadius: "16px 16px 0 0", padding: "24px 20px 32px", width: "100%", maxWidth: 520, boxShadow: "0 -8px 40px rgba(15,36,68,0.2)" }}>
            <div style={{ width: 40, height: 4, background: "#e2e8f0", borderRadius: 2, margin: "0 auto 16px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1e3a5f" }}>Set Staff PIN</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>Staff will use this 4-digit PIN to login</div>
              </div>
              <button onClick={() => setStaffPinOpen(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 15, color: "#64748b" }}>✕</button>
            </div>
            <div style={{ height: 1, background: "#f1f5f9", marginBottom: 18 }} />
            {business.staff_pin
              ? <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 13, color: "#16a34a", fontWeight: 600 }}>✓ Current PIN: <span style={{ fontFamily: "monospace", fontSize: 20, letterSpacing: 6 }}>{business.staff_pin}</span></div>
              : <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 13, color: "#92400e" }}>⚠ No Staff PIN set yet.</div>}
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>New 4-digit PIN</div>
            <input
              type="number"
              value={newStaffPin}
              onChange={e => setNewStaffPin(e.target.value.slice(0, 4))}
              placeholder="e.g. 5678"
              maxLength={4}
              style={{ width: "100%", padding: "14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 28, fontFamily: "monospace", letterSpacing: 10, outline: "none", textAlign: "center", marginBottom: 8 }}
            />
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 18 }}>Share this PIN with your staff only. Change it anytime.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStaffPinOpen(false)} style={{ flex: 1, background: "#f1f5f9", border: "none", borderRadius: 8, padding: 13, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={async () => {
                if (newStaffPin.length !== 4) { notify("Enter exactly 4 digits", "error"); return; }
                await sb.from("businesses").update({ staff_pin: newStaffPin }).eq("id", business.id);
                business.staff_pin = newStaffPin;
                setStaffPinOpen(false); setNewStaffPin("");
                notify(`✓ Staff PIN set to ${newStaffPin}`);
              }} style={{ flex: 1, background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 8, padding: 13, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Save PIN</button>
            </div>
          </div>
        </div>
      )}

      {/* ── WELCOME MODAL ── */}
      {showWelcome && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,36,68,0.6)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480, boxShadow: "0 24px 60px rgba(0,0,0,0.3)", overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(135deg, #0f2240, #1e3a5f)", padding: "28px 28px 24px", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, background: "#fff", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <svg width="28" height="28" viewBox="0 0 20 20" fill="none"><rect x="1" y="1" width="8" height="8" rx="1" fill="#1e3a5f"/><rect x="11" y="1" width="8" height="8" rx="1" fill="#1e3a5f"/><rect x="1" y="11" width="8" height="8" rx="1" fill="#1e3a5f"/><rect x="11" y="11" width="8" height="8" rx="1" fill="#3b82f6"/></svg>
              </div>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 22, marginBottom: 6 }}>Welcome to StoneTrack! 🎉</div>
              <div style={{ color: "#93c5fd", fontSize: 13 }}>Let's get your inventory set up in 3 easy steps</div>
            </div>
            <div style={{ padding: "24px 28px" }}>
              {[
                { icon: "📦", title: "Add your first slab", desc: "Enter your marble or granite stock — name, quantity, price and location in your yard", action: "Add Slab Now", fn: () => { setShowWelcome(false); setAddSlabOpen(true); } },
                { icon: "🗺️", title: "Set up your yard blocks", desc: "Organise your yard into blocks A–F so staff can find any slab instantly by location", action: "Go to Yard Map", fn: () => { setShowWelcome(false); setTab("yard"); } },
                { icon: "🔒", title: "Set a Staff PIN", desc: "Give your staff a 4-digit PIN to check stock on their phone — without seeing prices or financials", action: "Set PIN", fn: () => { setShowWelcome(false); setStaffPinOpen(true); } },
                { icon: "👥", title: "Add a customer account", desc: "Track contractor and builder purchases, payments and outstanding dues all in one place", action: "Add Customer", fn: () => { setShowWelcome(false); setTab("customers"); setAddCustOpen(true); } },
              ].map((step, i) => (
                <div key={i} onClick={() => setWelcomeStep(i)}
                  style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16, cursor: "pointer", background: welcomeStep === i ? "#f0f6ff" : "transparent", borderRadius: 12, padding: "12px", border: welcomeStep === i ? "1.5px solid #dbeafe" : "1.5px solid transparent", transition: "all 0.2s" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: welcomeStep === i ? "#1e3a5f" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{step.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1e3a5f", marginBottom: 3 }}>{step.title}</div>
                    <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, marginBottom: welcomeStep === i ? 10 : 0 }}>{step.desc}</div>
                    {welcomeStep === i && <button onClick={e => { e.stopPropagation(); step.fn(); }} style={{ background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{step.action} →</button>}
                  </div>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", border: `2px solid ${welcomeStep === i ? "#1e3a5f" : "#e2e8f0"}`, background: welcomeStep === i ? "#1e3a5f" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, color: "#fff", fontWeight: 800, transition: "all 0.2s" }}>
                    {welcomeStep === i ? "→" : ""}
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                <button onClick={() => setShowWelcome(false)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer" }}>Skip for now</button>
                {welcomeStep < 3
                  ? <button onClick={() => setWelcomeStep(s => s + 1)} style={{ background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Next step →</button>
                  : <button onClick={() => setShowWelcome(false)} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Let's go! 🎉</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {printTarget && <QRLabel slab={printTarget} onClose={() => setPrintTarget(null)} />}
      {invoiceView && <InvoiceView sale={invoiceView} onClose={() => setInvoiceView(null)} />}
    </div>
  );
}
