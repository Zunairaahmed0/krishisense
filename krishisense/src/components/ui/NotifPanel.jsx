import { useState } from "react";
import { X, RefreshCw, Bell, FlaskConical, AlertOctagon, TrendingUp } from "lucide-react";
import { C } from "../../constants/theme";
import Spinner from "./Spinner";

const TYPE_COLOR = { weather: C.blue, farm: C.p3, market: C.amber, advisory: "#8B5CF6", scan: C.p2 };

const BACKEND = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/+$/, "");

export default function NotifPanel({ notifications, loading, onClose, onRefresh, fcmToken, onEnableNotifications }) {
  const [sending, setSending] = useState(null);

  const triggerDemo = async (type) => {
    const token = fcmToken || localStorage.getItem("ks_fcm_token");
    if (!token) {
      if (onEnableNotifications) onEnableNotifications();
      return;
    }
    setSending(type);
    try {
      await fetch(`${BACKEND}/api/alerts/demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fcmToken: token, alertType: type }),
      });
    } catch (e) {
      alert("Demo trigger failed — is the backend running?\n" + e.message);
    } finally {
      setSending(null);
    }
  };

  const hasToken = !!(fcmToken || localStorage.getItem("ks_fcm_token"));

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.42)",backdropFilter:"blur(4px)",zIndex:9000 }} />
      <div style={{ position:"fixed",top:0,right:"max(0px, calc(50vw - 240px))",bottom:0,width:310,maxWidth:480,background:C.bg,zIndex:9001,display:"flex",flexDirection:"column",boxShadow:"-8px 0 40px rgba(0,0,0,0.18)" }}>

        {/* Header */}
        <div style={{ padding:"50px 16px 14px",borderBottom:`1px solid ${C.brd}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:C.surface }}>
          <div>
            <div style={{ fontSize:17,fontWeight:800,color:C.txt }}>Notifications</div>
            <div style={{ fontSize:11,color:C.mut,marginTop:2 }}>{notifications.length} farm alert{notifications.length !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ display:"flex",gap:7 }}>
            <button onClick={onRefresh} disabled={loading}
              style={{ width:32,height:32,borderRadius:10,border:`1px solid ${C.brd}`,background:C.surface,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:loading?0.5:1 }}>
              {loading ? <Spinner size={13} /> : <RefreshCw size={13} color={C.mut} />}
            </button>
            <button onClick={onClose}
              style={{ width:32,height:32,borderRadius:10,border:`1px solid ${C.brd}`,background:C.surface,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <X size={13} color={C.mut} />
            </button>
          </div>
        </div>

        {/* Enable push notifications banner */}
        {!hasToken && (
          <div style={{ padding:"10px 12px", background:"#EFF6FF", borderBottom:`1px solid #BFDBFE`, display:"flex", alignItems:"center", gap:10 }}>
            <Bell size={16} color="#1D4ED8" style={{ flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#1E40AF" }}>Push notifications off</div>
              <div style={{ fontSize:10, color:"#3B82F6" }}>Enable to receive real farm alerts on your phone</div>
            </div>
            <button
              onClick={onEnableNotifications}
              style={{ padding:"5px 10px", borderRadius:8, border:"none", background:"#1D4ED8", color:"#fff", fontSize:10, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
              Enable
            </button>
          </div>
        )}

        {/* Demo trigger buttons */}
        <div style={{ padding:"10px 12px", display:"flex", gap:6, flexWrap:"wrap", borderBottom:`1px solid ${C.brd}`, background:C.surface }}>
          <div style={{ width:"100%", fontSize:9, fontWeight:700, color:C.mut, marginBottom:2, letterSpacing:0.5 }}>
            DEMO TRIGGERS {hasToken ? <span style={{ color:C.p3 }}>● LIVE</span> : <span style={{ color:C.red }}>● NO TOKEN</span>}
          </div>
          <button onClick={() => triggerDemo("early_blight")} disabled={sending === "early_blight"}
            style={{ padding:"5px 10px", borderRadius:8, border:`1px solid ${C.amber}`, background:"#FEF3C7", color:"#B45309", fontSize:10, fontWeight:700, cursor:"pointer", opacity: sending === "early_blight" ? 0.6 : 1 }}>
            {sending === "early_blight" ? "Sending…" : <><FlaskConical size={11} style={{ marginRight:4, verticalAlign:"middle" }} />Disease Alert</>}
          </button>
          <button onClick={() => triggerDemo("outbreak")} disabled={sending === "outbreak"}
            style={{ padding:"5px 10px", borderRadius:8, border:`1px solid ${C.red}`, background:"#FEE2E2", color:"#B91C1C", fontSize:10, fontWeight:700, cursor:"pointer", opacity: sending === "outbreak" ? 0.6 : 1 }}>
            {sending === "outbreak" ? "Sending…" : <><AlertOctagon size={11} style={{ marginRight:4, verticalAlign:"middle" }} />Outbreak</>}
          </button>
          <button onClick={() => triggerDemo("market")} disabled={sending === "market"}
            style={{ padding:"5px 10px", borderRadius:8, border:`1px solid ${C.p2}`, background:"#E8F5E9", color:C.p2, fontSize:10, fontWeight:700, cursor:"pointer", opacity: sending === "market" ? 0.6 : 1 }}>
            {sending === "market" ? "Sending…" : <><TrendingUp size={11} style={{ marginRight:4, verticalAlign:"middle" }} />Market</>}
          </button>
        </div>

        {/* List */}
        <div style={{ flex:1,overflowY:"auto",padding:"14px 12px" }}>
          {loading && notifications.length === 0 ? (
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"50px 0",gap:14 }}>
              <Spinner size={28} />
              <div style={{ fontSize:12,color:C.mut,fontWeight:600 }}>Generating AI farm alerts…</div>
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign:"center",padding:"50px 0",color:C.mut,fontSize:12 }}>No notifications yet</div>
          ) : (
            notifications.map((n, i) => (
              <div key={n.id || i}
                style={{ display:"flex",gap:12,padding:"13px 14px",borderRadius:14,
                  border:`1px solid ${n.urgent?"#FFCDD2":C.brd}`,
                  background:n.urgent?"#FFF5F5":C.surface,marginBottom:10 }}>
                <div style={{ width:40,height:40,borderRadius:12,flexShrink:0,
                  background:`${TYPE_COLOR[n.type]||C.p3}15`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>
                  {n.icon}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4,gap:6 }}>
                    <div style={{ fontSize:12,fontWeight:800,color:C.txt,flex:1 }}>{n.title}</div>
                    {n.urgent && (
                      <span style={{ fontSize:8,color:C.red,fontWeight:700,background:"#FEE2E2",borderRadius:4,padding:"2px 5px",flexShrink:0 }}>URGENT</span>
                    )}
                  </div>
                  <div style={{ fontSize:11,color:C.txt2,lineHeight:1.45 }}>{n.body}</div>
                  <div style={{ fontSize:9,color:C.mut,marginTop:5,fontWeight:600 }}>{n.time}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
