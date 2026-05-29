import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, Loader2, Phone, Volume2, VolumeX, LogOut } from "lucide-react";
import { C } from "./constants/theme";
import Header from "./components/layout/Header";
import BottomNav from "./components/layout/BottomNav";
import AdvisorPanel from "./components/advisor/AdvisorPanel";
import HomeTab from "./tabs/HomeTab";
import LandTab from "./tabs/LandTab";
import GrowTab from "./tabs/GrowTab";
import SellTab from "./tabs/SellTab";
import SustainTab from "./tabs/SustainTab";
import AuthScreen from "./components/auth/AuthScreen";
import MenuDrawer from "./components/ui/MenuDrawer";
import NotifPanel from "./components/ui/NotifPanel";
import { api } from "./lib/api";
import { askAI } from "./lib/ai";
import { parseJSON } from "./lib/utils";
import "./index.css";

// ── Asset imports ──────────────────────────────────────────────────────────
// After downloading from Google Drive, place files in src/assets/ with these names:
import logoImg        from "./assets/logo.png";
import botImg         from "./assets/Bot.png";
import voiceBotImg    from "./assets/voice_bot.png";
import heroScanImg    from "./assets/landscan_hero_section.png";
import landAerialImg  from "./assets/land.png";
import onionsImg      from "./assets/onions.png";

import LocationModal from "./components/ui/LocationModal";

export default function App() {
  const [user,        setUser]        = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab,        setTab]        = useState("home");
  const [loc,        setLoc]        = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError,   setLocError]   = useState("");
  const [weather,    setWeather]    = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError,   setWeatherError]   = useState("");
  const [lang,       setLang]       = useState("en");
  const [voiceOn,    setVoiceOn]    = useState(false);
  const [advisor,    setAdvisor]    = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifGeneratedRef = useRef(false);
  
  // Location manual search and coordinates overrides
  const [isManualLoc, setIsManualLoc] = useState(false);
  const [locModalOpen, setLocModalOpen] = useState(false);
  const isManualLocRef = useRef(false);

  useEffect(() => {
    isManualLocRef.current = isManualLoc;
  }, [isManualLoc]);
  
  // Centralized scan history state for instant real-time sync across tabs
  const [scans,       setScans]       = useState([]);
  const [loadingScans, setLoadingScans] = useState(false);

  const fetchScans = useCallback(async () => {
    if (!user) return;
    setLoadingScans(true);
    try {
      const res = await api.getScans();
      setScans(res);
    } catch (err) {
      console.warn("Failed to load scans:", err);
    } finally {
      setLoadingScans(false);
    }
  }, [user]);

  const generateNotifications = useCallback(async () => {
    if (notifLoading) return;
    setNotifLoading(true);
    const daily = weather?.daily;
    const notifs = [];

    const rainProbs = (daily?.precipitation_probability_max || []).slice(0, 3);
    const maxRain = rainProbs.length ? Math.max(...rainProbs) : 0;
    if (maxRain > 60) {
      notifs.push({ id:"rain", icon:"🌧", title:"Rain Alert", body:`${maxRain}% rain chance in next 3 days. Skip irrigation to save water and cut costs.`, time:"Just now", type:"weather", urgent: maxRain > 80 });
    }
    const temps = (daily?.temperature_2m_max || []).slice(0, 3);
    const maxTemp = temps.length ? Math.max(...temps) : 0;
    if (maxTemp > 37) {
      notifs.push({ id:"heat", icon:"🌡️", title:"Heat Advisory", body:`High temperature up to ${maxTemp}°C expected. Irrigate crops early morning (5–7 AM) to reduce evaporation.`, time:"Today", type:"weather", urgent: true });
    }
    const todayRain = daily?.precipitation_probability_max?.[0] ?? 0;
    if (todayRain < 30 && weather) {
      notifs.push({ id:"irrigate", icon:"💧", title:"Irrigation Reminder", body:`Only ${todayRain}% rain chance today. Light morning irrigation recommended for healthy crops.`, time:"Today", type:"farm" });
    }
    const lastScan = scans?.find(s => s.type === "soil");
    if (lastScan?.data?.rec) {
      notifs.push({ id:"scan", icon:"🛰", title:"Crop Recommendation Ready", body:`Your soil recommends ${lastScan.data.rec.crop} with ${lastScan.data.rec.confidence}% suitability. View full land analysis.`, time:"Last scan", type:"scan" });
    } else if (loc) {
      notifs.push({ id:"scan-cta", icon:"🛰", title:"Scan Your Farm", body:"Tap the LAND tab to run a satellite soil scan and get personalized crop recommendations.", time:"Suggested", type:"advisory" });
    }
    notifs.push({ id:"market", icon:"📈", title:"Market Update", body:"Visit the SELL tab for live mandi prices and AI selling recommendations for your crops.", time:"Live", type:"market" });

    setNotifications(notifs);

    if (weather && loc) {
      try {
        const temp = weather?.current?.temperature_2m;
        const hum  = weather?.current?.relative_humidity_2m;
        const prompt = `Indian farmer in ${loc.name}, ${loc.state}. Weather: ${temp}°C, ${hum}% humidity, ${todayRain}% rain today.${lastScan?.data?.soil ? ` Soil pH ${lastScan.data.soil.ph}, N=${lastScan.data.soil.n}kg/ha, best crop: ${lastScan.data.rec?.crop || "unknown"}.` : ""} Give ONE critical actionable farm advisory for today (max 45 words). Return JSON only: {"icon":"🌱","title":"3-5 word title","body":"actionable advice","type":"advisory"}`;
        const raw = await askAI(prompt, "Return only valid JSON, no markdown.");
        const aiNotif = parseJSON(raw);
        if (aiNotif?.title && aiNotif?.body) {
          setNotifications(prev => [{ ...aiNotif, id:"ai", time:"AI Generated" }, ...prev]);
        }
      } catch {}
    }
    setNotifLoading(false);
    notifGeneratedRef.current = true;
  }, [weather, loc, scans, notifLoading]);

  useEffect(() => {
    if (weather && user && !notifGeneratedRef.current) {
      generateNotifications();
    }
  }, [weather, user, generateNotifications]);

  const lastWeatherRef = useRef(null);
  const lastGeoNameRef = useRef(null);

  const resolvePlace = useCallback(async (lat, lon) => {
    try {
      const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
        .then(r => r.json());
      const name  = geo?.address?.city || geo?.address?.town || geo?.address?.village || geo?.address?.county || "Your Farm";
      const state = geo?.address?.state || geo?.address?.region || "Current location";
      const country = geo?.address?.country || "";
      return { name, state, country };
    } catch {
      return { name: "Your Farm", state: "Current location" };
    }
  }, []);

  const loadWeather = useCallback(async (lat, lon) => {
    setWeatherLoading(true);
    setWeatherError("");
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,windspeed_10m,relative_humidity_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weathercode&timezone=auto&forecast_days=7`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather request failed");
      setWeather(await res.json());
    } catch {
      setWeather(null);
      setWeatherError("Unable to load live weather for your current location.");
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const handleSelectManualLocation = useCallback((locationData) => {
    const { name, state, country, lat, lon } = locationData;
    setIsManualLoc(true);
    setLoc({
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      accuracy: null,
      name,
      state: state || "",
      country: country || "",
      updatedAt: Date.now(),
      isManual: true
    });
    loadWeather(parseFloat(lat), parseFloat(lon));
  }, [loadWeather]);

  const handleResetToGPS = useCallback(() => {
    setIsManualLoc(false);
    if ("geolocation" in navigator) {
      setLocLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lon, accuracy } = pos.coords;
          setLocError("");
          setLocLoading(false);
          const place = await resolvePlace(lat, lon);
          setLoc({
            lat,
            lon,
            accuracy,
            name: place?.name || "Your Farm",
            state: place?.state || "Current location",
            country: place?.country || "",
            updatedAt: Date.now(),
          });
          loadWeather(lat, lon);
        },
        (err) => {
          setLocLoading(false);
          setLocError(err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Enable it to use live local weather."
            : "Unable to detect your current location.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [resolvePlace, loadWeather]);


  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocError("Location is not supported on this device.");
      return undefined;
    }

    setLocLoading(true);

    const watchId = navigator.geolocation.watchPosition(
      async pos => {
        if (isManualLocRef.current) return;
        const { latitude: lat, longitude: lon, accuracy } = pos.coords;
        const now = Date.now();

        setLocError("");
        setWeatherError("");
        setLocLoading(false);

        const lastName = lastGeoNameRef.current;
        const shouldRefreshName =
          !lastName ||
          Math.abs(lastName.lat - lat) > 0.01 ||
          Math.abs(lastName.lon - lon) > 0.01;

        let place = lastName?.place;
        if (shouldRefreshName) {
          place = await resolvePlace(lat, lon);
          lastGeoNameRef.current = { lat, lon, place };
        }

        setLoc({
          lat,
          lon,
          accuracy,
          name: place?.name || "Your Farm",
          state: place?.state || "Current location",
          country: place?.country || "",
          updatedAt: now,
        });

        const lastWeather = lastWeatherRef.current;
        const shouldRefreshWeather =
          !lastWeather ||
          now - lastWeather.time > 10 * 60 * 1000 ||
          Math.abs(lastWeather.lat - lat) > 0.01 ||
          Math.abs(lastWeather.lon - lon) > 0.01;

        if (shouldRefreshWeather) {
          lastWeatherRef.current = { lat, lon, time: now };
          loadWeather(lat, lon);
        }
      },
      err => {
        setLocLoading(false);
        setWeather(null);
        setLocError(err.code === err.PERMISSION_DENIED
          ? "Location permission denied. Enable it to use live local weather."
          : "Unable to detect your current location.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60 * 1000,
        timeout: 15000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [loadWeather, resolvePlace]);

  // Restore secure session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const profile = await api.getMe();
        if (profile) setUser(profile);
      } catch (err) {
        console.warn("Restoring session failed:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkSession();
  }, []);

  // Fetch / Sync scans in real-time when user login session changes
  useEffect(() => {
    if (user) {
      fetchScans();
    } else {
      setScans([]);
    }
  }, [user, fetchScans]);

  // Tab-specific headers
  const TAB_HEADERS = {
    home:    { logo: true },
    land:    { title: "LAND Analysis",           subtitle: "Smart Land & Soil Intelligence" },
    grow:    { title: "AI Crop Health Monitor",   subtitle: "Detect diseases early" },
    sell:    { title: "Smart Selling Insights",   subtitle: "AI-powered market intelligence" },
    sustain: { title: "SUSTAIN",                  subtitle: "Sustainable Farming • Save Resources" },
  };

  const hdr = TAB_HEADERS[tab] || {};

  // Render safe-loading screen during auth check
  if (authLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        width: "100%",
        maxWidth: 480,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: `linear-gradient(135deg, #f0f7f3 0%, #e8f3ec 50%, #f6f0e6 100%)`,
        gap: 16
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: `linear-gradient(135deg, ${C.p2}, ${C.p4})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 4px 14px ${C.gGlow}`,
          fontSize: 22,
          animation: "floatY 3s ease-in-out infinite"
        }}>
          🌿
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, letterSpacing: 0.5 }}>
          SECURE SYSTEM RESTORE…
        </div>
      </div>
    );
  }

  // Enforce secure registration/login overlay
  if (!user) {
    return (
      <div style={{
        minHeight: "100vh",
        width: "100%",
        maxWidth: 480,
        margin: "0 auto",
        boxShadow: "0 0 0 1px rgba(18,60,44,0.06), 0 24px 80px rgba(18,60,44,0.16)",
        position: "relative",
        background: C.bg
      }}>
        <AuthScreen onAuthSuccess={setUser} voiceOn={voiceOn} />
      </div>
    );
  }

  return (
    <div className="app-shell" style={{
      fontFamily:   "'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background:   C.bg,
      color:        C.txt,
      minHeight:    "100vh",
      width:        "100%",
      maxWidth:     480,
      margin:       "0 auto",
      position:     "relative",
      overflowX:    "hidden",
      boxShadow:    "0 0 0 1px rgba(18,60,44,0.06), 0 24px 80px rgba(18,60,44,0.16)",
    }}>
      {/* ── Header ── */}
      <Header
        title={hdr.title}
        subtitle={hdr.subtitle}
        logoSrc={hdr.logo ? logoImg : undefined}
        showBack={tab !== "home"}
        onBack={() => setTab("home")}
        notifications={notifications.length}
        onMenuClick={() => setMenuOpen(true)}
        onBellClick={() => {
          setNotifOpen(true);
          if (!notifGeneratedRef.current) generateNotifications();
        }}
        rightSlot={
          tab === "home" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                aria-label={voiceOn ? "Turn voice off" : "Turn voice on"}
                onClick={() => setVoiceOn(v => !v)}
                style={{ width: 30, height: 30, borderRadius: 10, border: `1px solid ${C.brd}`, background: voiceOn ? C.tint : C.surface, color: voiceOn ? C.p2 : C.mut, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {voiceOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
              <select
                aria-label="Language"
                value={lang}
                onChange={e => setLang(e.target.value)}
                style={{ width: 44, height: 30, borderRadius: 10, border: `1px solid ${C.brd}`, background: C.surface, color: C.p2, fontSize: 10, fontWeight: 800, outline: "none", cursor: "pointer" }}
              >
                <option value="en">EN</option>
                <option value="hi">HI</option>
                <option value="mr">MR</option>
              </select>
              <button
                aria-label="Notifications"
                onClick={() => { setNotifOpen(true); if (!notifGeneratedRef.current) generateNotifications(); }}
                style={{ position: "relative", width: 30, height: 30, borderRadius: 10, background: C.surface, border: `1px solid ${C.brd}`, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {locLoading ? <Loader2 size={15} color={C.p2} style={{ animation: "spin .9s linear infinite" }} /> : <Bell size={15} color={C.txt2} />}
                {notifications.length > 0 && <span style={{ position: "absolute", top: 0, right: 0, width: 15, height: 15, borderRadius: "50%", background: C.red, color: "white", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{notifications.length}</span>}
              </button>
              <button
                aria-label="Logout"
                title="Logout"
                onClick={async () => { await api.logout(); setUser(null); }}
                style={{ width: 30, height: 30, borderRadius: 10, border: `1px solid ${C.brd}`, background: C.surface, color: C.red, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : undefined
        }
      />

      {/* ── Page Content ── */}
      <div key={tab} className="page-enter" style={{ paddingBottom: 88 }}>
        {tab === "home" && (
          <HomeTab user={user} weather={weather} weatherLoading={weatherLoading} weatherError={weatherError} loc={loc} locError={locError} setTab={setTab}
            heroImg={heroScanImg} botImg={botImg} lang={lang} scans={scans} voiceOn={voiceOn} onLocationClick={() => setLocModalOpen(true)} />
        )}
        {tab === "land" && (
          <LandTab loc={loc} locError={locError} weather={weather}
            landAerialImg={landAerialImg} onionsImg={onionsImg} lang={lang} voiceOn={voiceOn}
            scans={scans} loadingScans={loadingScans} onScanSaved={fetchScans} onScanDeleted={fetchScans} 
            onLocationClick={() => setLocModalOpen(true)} />
        )}
        {tab === "grow" && (
          <GrowTab weather={weather} weatherLoading={weatherLoading} voiceOn={voiceOn} lang={lang} botImg={botImg}
            scans={scans} loadingScans={loadingScans} onScanSaved={fetchScans} onScanDeleted={fetchScans} />
        )}
        {tab === "sell" && (
          <SellTab loc={loc} voiceOn={voiceOn} lang={lang} onionsImg={onionsImg} />
        )}
        {tab === "sustain" && (
          <SustainTab weather={weather} weatherLoading={weatherLoading} weatherError={weatherError} loc={loc} locError={locError} botImg={botImg} voiceOn={voiceOn} lang={lang} />
        )}
      </div>

      {/* ── Bottom Nav ── */}
      <BottomNav tab={tab} setTab={setTab} />

      {/* ── AI Advisor FAB ── */}
      {tab !== "sustain" && (
        <button
          className="fab"
          onClick={() => setAdvisor(true)}
          style={{
            width:          54,
            height:         54,
            borderRadius:   "50%",
            background:     `linear-gradient(135deg, ${C.p2}, ${C.p4})`,
            border:         "none",
            cursor:         "pointer",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            boxShadow:      `0 4px 20px ${C.gGlow}, 0 2px 8px rgba(0,0,0,0.15)`,
          }}
        >
          {botImg
            ? <img src={botImg} alt="AI" style={{ width: 38, height: 38, objectFit: "contain" }} />
            : <Phone size={22} color="white" />}
        </button>
      )}

      {/* ── AI Advisor Panel ── */}
      {advisor && (
        <AdvisorPanel
          onClose={() => setAdvisor(false)}
          loc={loc}
          weather={weather}
          botImg={botImg}
          voiceBotImg={voiceBotImg}
          voiceOn={voiceOn}
        />
      )}

      {/* ── Location Modal Overlay ── */}
      {locModalOpen && (
        <LocationModal
          isOpen={locModalOpen}
          onClose={() => setLocModalOpen(false)}
          onSelectLocation={handleSelectManualLocation}
          onResetToGPS={handleResetToGPS}
          isManual={isManualLoc}
          currentLoc={loc}
          lang={lang}
        />
      )}

      {/* ── Menu Drawer ── */}
      {menuOpen && (
        <MenuDrawer
          user={user}
          tab={tab}
          setTab={setTab}
          lang={lang}
          setLang={setLang}
          voiceOn={voiceOn}
          setVoiceOn={setVoiceOn}
          onClose={() => setMenuOpen(false)}
          onLogout={async () => { await api.logout(); setUser(null); setMenuOpen(false); }}
          onUpdateUser={async (updates) => {
            await api.updateProfile(user.uid, updates);
            setUser(prev => ({ ...prev, ...updates }));
          }}
        />
      )}

      {/* ── Notification Panel ── */}
      {notifOpen && (
        <NotifPanel
          notifications={notifications}
          loading={notifLoading}
          onClose={() => setNotifOpen(false)}
          onRefresh={() => { notifGeneratedRef.current = false; generateNotifications(); }}
        />
      )}
    </div>
  );
}
