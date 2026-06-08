import { useState } from "react";
import { X, Volume2, VolumeX, LogOut, Pencil, Check, XCircle } from "lucide-react";
import { C } from "../../constants/theme";

const AVATARS = ["👨‍🌾", "👩‍🌾", "🌾", "🌱", "🧑‍🌾", "🌻"];

export default function MenuDrawer({ user, tab, setTab, lang, setLang, voiceOn, setVoiceOn, onClose, onLogout, onUpdateUser }) {
  const NAV = [
    { id: "home",    emoji: "🏠", label: "Home Dashboard" },
    { id: "land",    emoji: "🛰",  label: "LAND Analysis" },
    { id: "grow",    emoji: "🌿", label: "GROW — Crop Health" },
    { id: "sell",    emoji: "📈", label: "SELL — Market Prices" },
    { id: "schemes", emoji: "🏛️", label: "SCHEMES — Govt Benefits" },
    { id: "sustain", emoji: "💧", label: "SUSTAIN — Eco Farming" },
  ];

  const [editing,   setEditing]   = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [avatar,    setAvatar]    = useState(user?.avatar || "👨‍🌾");
  const [saving,    setSaving]    = useState(false);

  const currentName = user?.fullName || user?.name || user?.displayName || "Farmer";

  const openEdit = () => {
    setNameInput(currentName);
    setAvatar(user?.avatar || "👨‍🌾");
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setNameInput(""); };

  const saveEdit = async () => {
    if (!nameInput.trim()) return;
    setSaving(true);
    try {
      await onUpdateUser?.({ fullName: nameInput.trim(), avatar });
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(3px)",zIndex:9000 }} />
      <div style={{ position:"fixed",top:0,left:"max(0px, calc(50vw - 240px))",bottom:0,width:272,background:C.bg,zIndex:9001,display:"flex",flexDirection:"column",boxShadow:"8px 0 40px rgba(0,0,0,0.22)",overflowY:"auto" }}>

        {/* ── Header / Profile ─────────────────────────────────── */}
        <div style={{ background:`linear-gradient(135deg,${C.primary},${C.p2})`,padding:"48px 18px 22px",color:"white",flexShrink:0 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
            <div style={{ fontSize:17,fontWeight:900,letterSpacing:-0.5 }}>KrishiSense</div>
            <button onClick={onClose} style={{ width:30,height:30,borderRadius:8,border:"none",background:"rgba(255,255,255,0.2)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"white" }}>
              <X size={15} />
            </button>
          </div>

          {editing ? (
            /* ── Edit mode ─── */
            <div>
              {/* Avatar picker */}
              <div style={{ display:"flex",gap:8,marginBottom:14,flexWrap:"wrap" }}>
                {AVATARS.map(a => (
                  <button key={a} onClick={() => setAvatar(a)}
                    style={{ width:38,height:38,borderRadius:10,border:`2px solid ${avatar===a?"#fff":"rgba(255,255,255,0.25)"}`,background: avatar===a?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.1)",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s" }}>
                    {a}
                  </button>
                ))}
              </div>

              {/* Name input */}
              <input
                autoFocus
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                placeholder="Your name"
                style={{ width:"100%",boxSizing:"border-box",padding:"10px 12px",borderRadius:10,border:"2px solid rgba(255,255,255,0.5)",background:"rgba(255,255,255,0.15)",color:"#fff",fontSize:14,fontWeight:700,outline:"none",marginBottom:12 }}
              />

              {/* Save / Cancel */}
              <div style={{ display:"flex",gap:8 }}>
                <button onClick={saveEdit} disabled={saving || !nameInput.trim()}
                  style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px",borderRadius:10,border:"none",background:saving?"rgba(255,255,255,0.2)":"#fff",color:saving?"rgba(255,255,255,0.6)":C.primary,fontSize:12,fontWeight:800,cursor:saving?"not-allowed":"pointer" }}>
                  <Check size={14} /> {saving ? "Saving…" : "Save"}
                </button>
                <button onClick={cancelEdit}
                  style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px",borderRadius:10,border:"2px solid rgba(255,255,255,0.35)",background:"transparent",color:"white",fontSize:12,fontWeight:700,cursor:"pointer" }}>
                  <XCircle size={14} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            /* ── View mode ─── */
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:10 }}>
                <div style={{ width:52,height:52,borderRadius:14,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0 }}>
                  {user?.avatar || "👨‍🌾"}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:15,fontWeight:800,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{currentName}</div>
                  <div style={{ fontSize:11,opacity:0.75,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>
                    {user?.email || user?.phoneNumber || "KrishiSense Member"}
                  </div>
                </div>
                <button onClick={openEdit}
                  title="Edit profile"
                  style={{ width:30,height:30,borderRadius:8,border:"none",background:"rgba(255,255,255,0.18)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <Pencil size={14} color="white" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation ───────────────────────────────────────── */}
        <div style={{ padding:"16px 12px",flex:1 }}>
          <div style={{ fontSize:9,fontWeight:800,color:C.mut,letterSpacing:1,padding:"0 6px",marginBottom:8 }}>NAVIGATION</div>
          {NAV.map(n => (
            <button key={n.id} onClick={() => { setTab(n.id); onClose(); }}
              style={{ width:"100%",display:"flex",alignItems:"center",gap:12,padding:"11px 12px",borderRadius:12,
                border:"none",background:tab===n.id?C.tint:"transparent",color:tab===n.id?C.p2:C.txt,
                cursor:"pointer",marginBottom:3,textAlign:"left",fontSize:13,fontWeight:tab===n.id?800:600 }}>
              <span style={{ fontSize:18 }}>{n.emoji}</span>
              {n.label}
            </button>
          ))}

          <div style={{ height:1,background:C.brd,margin:"14px 0" }} />
          <div style={{ fontSize:9,fontWeight:800,color:C.mut,letterSpacing:1,padding:"0 6px",marginBottom:10 }}>SETTINGS</div>

          {/* Language */}
          <div style={{ padding:"12px",borderRadius:12,border:`1px solid ${C.brd}`,marginBottom:10 }}>
            <div style={{ fontSize:11,fontWeight:700,color:C.mut,marginBottom:8 }}>Language</div>
            <div style={{ display:"flex",gap:6 }}>
              {[["en","EN"],["hi","हि"],["mr","म"]].map(([code,label]) => (
                <button key={code} onClick={() => setLang(code)}
                  style={{ flex:1,padding:"7px 0",borderRadius:9,border:`1px solid ${lang===code?C.p3:C.brd}`,
                    background:lang===code?C.tint:C.surface,color:lang===code?C.p2:C.mut,
                    fontSize:12,fontWeight:700,cursor:"pointer" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice toggle */}
          <button onClick={() => setVoiceOn(v => !v)}
            style={{ width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px",borderRadius:12,
              border:`1px solid ${voiceOn?C.brdHi:C.brd}`,background:voiceOn?C.tint:C.surface,
              cursor:"pointer",marginBottom:12 }}>
            {voiceOn ? <Volume2 size={18} color={C.p2} /> : <VolumeX size={18} color={C.mut} />}
            <div style={{ flex:1,textAlign:"left" }}>
              <div style={{ fontSize:13,fontWeight:700,color:voiceOn?C.p2:C.mut }}>Voice Bot {voiceOn?"ON":"OFF"}</div>
              <div style={{ fontSize:10,color:C.mut,marginTop:1 }}>Tap to {voiceOn?"disable":"enable"} voice</div>
            </div>
          </button>

          {/* About */}
          <div style={{ padding:"12px",borderRadius:12,border:`1px solid ${C.brd}`,background:C.tint }}>
            <div style={{ fontSize:11,fontWeight:800,color:C.p2,marginBottom:5 }}>🌿 About KrishiSense</div>
            <div style={{ fontSize:10,color:C.mut,lineHeight:1.55 }}>AI-powered farming intelligence for Indian farmers. Real-time soil analysis, crop health monitoring, and live market intelligence.</div>
          </div>
        </div>

        {/* ── Logout ───────────────────────────────────────────── */}
        <div style={{ padding:"14px 16px 30px",borderTop:`1px solid ${C.brd}`,flexShrink:0 }}>
          <button onClick={onLogout}
            style={{ width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"13px",
              borderRadius:12,border:`1px solid #FFCDD2`,background:"#FFF5F5",color:C.red,fontSize:13,fontWeight:700,cursor:"pointer" }}>
            <LogOut size={16} /> Sign Out
          </button>
          <div style={{ fontSize:9,color:C.mut,textAlign:"center",marginTop:10 }}>KrishiSense v1.0 · AI Farming Intelligence</div>
        </div>
      </div>
    </>
  );
}
