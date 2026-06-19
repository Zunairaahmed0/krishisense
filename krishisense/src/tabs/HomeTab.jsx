import { CheckCircle, AlertTriangle, Info, ChevronRight, Satellite, Microscope, TrendingUp, Landmark, MapPin, Bot, Volume2 } from "lucide-react";
import { C } from "../constants/theme";
import { wx, PRICES } from "../constants/data";
import Badge from "../components/ui/Badge";
import Sparkline from "../components/ui/Sparkline";
import { speak } from "../lib/speech";
import { api } from "../lib/api";
import Spinner from "../components/ui/Spinner";

// Pass heroImg (landscan_hero_section.png) and botImg from App
export default function HomeTab({
  user,
  weather,
  weatherLoading,
  weatherError,
  loc,
  locError,
  setTab,
  heroImg,
  botImg,
  lang,
  scans = [],
  voiceOn,
  onLocationClick,
}) {
  const getCropEmoji = (cropName) => {
    if (!cropName) return "🌱";
    const name = cropName.toLowerCase().trim();
    const emojiMap = {
      onion: "🧅",
      onions: "🧅",
      rice: "🌾",
      paddy: "🌾",
      wheat: "🌾",
      cotton: "☁️",
      tomato: "🍅",
      tomatoes: "🍅",
      potato: "🥔",
      potatoes: "🥔",
      sugarcane: "🎋",
      mustard: "🌼",
      maize: "🌽",
      corn: "🌽",
      chili: "🌶",
      chilli: "🌶",
      soybean: "🌱",
      groundnut: "🥜",
      peanuts: "🥜",
    };
    for (const key of Object.keys(emojiMap)) {
      if (name.includes(key)) return emojiMap[key];
    }
    return "🌱";
  };

  const cur = weather?.current;
  const daily = weather?.daily;
  const todayRain = daily?.precipitation_probability_max?.[0];
  const tomorrowRain = daily?.precipitation_probability_max?.[1];
  const currentHumidity = cur?.relative_humidity_2m;
  const currentTemp = cur?.temperature_2m;
  const currentRain = cur?.precipitation;
  const waterTitle =
    tomorrowRain == null
      ? weatherLoading
        ? "Loading forecast"
        : "Weather unavailable"
      : tomorrowRain > 50
        ? "Skip irrigation tomorrow"
        : tomorrowRain > 25
          ? "Light irrigation tomorrow"
          : "Irrigate as planned";
  const waterSub =
    tomorrowRain == null
      ? locError || weatherError || "Waiting for live local forecast"
      : `${tomorrowRain}% rain chance tomorrow`;
  const weatherTip =
    currentHumidity == null && currentTemp == null
      ? "Live local weather will appear after location permission is enabled."
      : currentHumidity >= 80
        ? "High humidity in your current area. Monitor crops for fungal disease risk."
        : currentTemp >= 38
          ? "High temperature in your current area. Irrigate early morning and protect seedlings."
          : (currentRain || 0) > 0.5
            ? "Rain is being detected at your current location. Pause irrigation and check drainage."
            : "Current local weather looks manageable. Keep monitoring the 7-day forecast.";

  const alerts = [];
  if ((cur?.precipitation || 0) > 0.5)
    alerts.push({
      type: "info",
      text: "Rain detected — skip irrigation today, save ~8,000 L",
    });
  if ((cur?.temperature_2m || 0) > 38)
    alerts.push({
      type: "warn",
      text: "Heat wave — irrigate at dawn, protect seedlings",
    });
  if ((daily?.precipitation_probability_max?.[2] || 0) > 65)
    alerts.push({
      type: "info",
      text: "Heavy rain in 2 days — harvest ready crops now",
    });
  if (locError) alerts.push({ type: "warn", text: locError });
  if (weatherError) alerts.push({ type: "warn", text: weatherError });
  if (weatherLoading)
    alerts.push({
      type: "info",
      text: "Loading live weather for your current location.",
    });
  if (!alerts.length)
    alerts.push({
      type: "ok",
      text: "Weather conditions favorable — great day for farm activity",
    });

  const onionPrices = PRICES.Onion.slice(-12).map((d) => d.p);

  // ── Real scan data ───────────────────────────────────────────────
  const lastSoilScan = [...(scans || [])].reverse().find(s => s.type === "soil");
  const rec = lastSoilScan?.data?.rec;


  // ── AI Insight Card config — priority-ordered weather rules ────────────
  const getInsightConfig = () => {
    const d      = weather?.daily;
    const c      = weather?.current;
    const temp   = c?.temperature_2m ?? null;
    const hum    = c?.relative_humidity_2m ?? null;
    const wind   = c?.windspeed_10m ?? 0;
    const rToday = d?.precipitation_probability_max?.[0] ?? 0;
    const rTomor = d?.precipitation_probability_max?.[1] ?? 0;
    const maxT   = d?.temperature_2m_max?.[0] ?? temp ?? 0;
    const minT   = d?.temperature_2m_min?.[0] ?? 99;
    const soilRec = [...(scans || [])].reverse().find(s => s.type === "soil")?.data?.rec;

    if (!weather) return {
      icon: "🔄", bg: "#F9FAFB", color: "#6B7280", badgeBg: "#F3F4F6",
      title: "Fetching your local weather",
      desc: "Allow location access for real-time AI-powered farm insights tailored to your area.",
      metric1: { icon: "📍", label: "Status",  value: "Detecting..." },
      metric2: { icon: "🌿", label: "Action",  value: "Enable GPS"   },
      navigateTo: "home",
    };
    if (minT < 4) return {
      icon: "❄️", bg: "#EFF6FF", color: "#1D4ED8", badgeBg: "#DBEAFE",
      title: "Frost Warning Tonight",
      desc: "Temperature dropping below 4°C. Cover seedlings and irrigate before sunset to release heat.",
      metric1: { icon: "🌡️", label: "Min Temp", value: `${minT}°C`          },
      metric2: { icon: "🌱", label: "At Risk",  value: "Tomato, Potato"      },
      navigateTo: "sustain",
    };
    if (maxT > 40) return {
      icon: "🌡️", bg: "#FFF7ED", color: "#C2410C", badgeBg: "#FED7AA",
      title: "Heat Wave Alert",
      desc: "Extreme heat expected. Irrigate before 7 AM to reduce evaporation and protect your crops.",
      metric1: { icon: "☀️", label: "Expected High", value: `${maxT}°C` },
      metric2: { icon: "💧", label: "Best Time",     value: "5–7 AM"    },
      navigateTo: "sustain",
    };
    const hasDisease = scans?.some(s => s.type === "leaf" && s.data?.status === "diseased");
    if (hum > 85 && temp > 24 && hasDisease) return {
      icon: "⚠️", bg: "#FEF2F2", color: "#DC2626", badgeBg: "#FEE2E2",
      title: "Disease Spread Risk",
      desc: "High humidity and warm temperature favour fungal disease spread. Check your crops now.",
      metric1: { icon: "💧", label: "Humidity",    value: `${hum}%`  },
      metric2: { icon: "🌡️", label: "Temperature", value: `${temp}°C` },
      navigateTo: "grow",
    };
    if (rTomor > 60) return {
      icon: "🌧️", bg: "#EFF6FF", color: "#1D4ED8", badgeBg: "#DBEAFE",
      title: "Rain expected tomorrow",
      desc: `${rTomor}% chance of rainfall. Skipping irrigation can save water and protect your crops.`,
      metric1: { icon: "💧", label: "Water You Can Save", value: `${Math.round(8000 + (rTomor - 60) * 200).toLocaleString("en-IN")} L` },
      metric2: { icon: "🌿", label: "Crops Affected",     value: soilRec?.crop || "Your crops" },
      navigateTo: "sustain",
    };
    if (rToday > 50) return {
      icon: "🌦️", bg: "#EFF6FF", color: "#0369A1", badgeBg: "#BAE6FD",
      title: "Rain likely today",
      desc: "Skip irrigation and ensure drainage channels are clear to prevent waterlogging.",
      metric1: { icon: "🌧️", label: "Rain Probability", value: `${rToday}%`  },
      metric2: { icon: "💧", label: "Est. Savings",      value: "~6,000 L"   },
      navigateTo: "sustain",
    };
    if (wind > 25) return {
      icon: "💨", bg: "#F0FDFA", color: "#0F766E", badgeBg: "#CCFBF1",
      title: "High Wind Advisory",
      desc: "Avoid pesticide or fertilizer spraying today. Wind drift will significantly reduce effectiveness.",
      metric1: { icon: "💨", label: "Wind Speed",     value: `${wind} km/h`   },
      metric2: { icon: "📅", label: "Resume Spraying", value: "Check tomorrow" },
      navigateTo: "sustain",
    };
    return {
      icon: "☀️", bg: "#F0FDF4", color: "#15803D", badgeBg: "#DCFCE7",
      title: "Good farming conditions",
      desc: "Weather is favorable today. Great time for sowing, spraying, or any field activities.",
      metric1: { icon: "🌡️", label: "Temperature", value: `${temp ?? "--"}°C` },
      metric2: { icon: "💧", label: "Humidity",    value: `${hum  ?? "--"}%`  },
      navigateTo: "land",
    };
  };
  const insight = getInsightConfig();

  // ── Farm Health Score computation ──────────────────────────────────
  const computeFarmHealthScore = () => {
    let soilScore = null;
    const ls = scans?.find(s => s.type === "soil");
    if (ls?.data?.soil) {
      const ph = parseFloat(ls.data.soil.ph);
      const n = parseInt(ls.data.soil.n);
      const soc = parseFloat(ls.data.soil.soc);
      const ndviC = ls.data.ndvi?.current ?? 0;
      const phScore = ph >= 6.0 && ph <= 7.5 ? 95 : ph >= 5.5 && ph <= 8.0 ? 70 : 45;
      const nScore = Math.min(100, (n / 220) * 100);
      const socScore = Math.min(100, (soc / 0.8) * 100);
      const ndviBonus = ndviC > 0.6 ? 8 : ndviC > 0.4 ? 4 : 0;
      soilScore = Math.min(98, Math.round(phScore * 0.30 + nScore * 0.35 + socScore * 0.25 + ndviBonus));
    }

    let weatherScore = null;
    if (weather) {
      let score = 80;
      const temp = weather.current.temperature_2m;
      const hum = weather.current.relative_humidity_2m;
      const wind = weather.current.windspeed_10m;
      const rainToday = weather.daily.precipitation_probability_max?.[0] ?? 0;
      if (temp > 40 || temp < 4) score -= 30;
      else if (temp > 36 || temp < 8) score -= 15;
      else if (temp >= 20 && temp <= 30) score += 8;
      if (hum > 90) score -= 12;
      else if (hum >= 50 && hum <= 70) score += 8;
      else if (hum < 30) score -= 8;
      if (wind > 30) score -= 10;
      else if (wind < 8) score += 5;
      if (rainToday > 70) score += 5;
      weatherScore = Math.min(100, Math.max(10, score));
    }

    let cropHealthScore = null;
    const leafScans = scans?.filter(s => s.type === "leaf") ?? [];
    if (leafScans.length > 0) {
      const last3 = leafScans.slice(-3);
      const healthyCount = last3.filter(s => s.data?.status === "healthy").length;
      const diseasedScans = last3.filter(s => s.data?.status === "diseased");
      if (healthyCount === last3.length) {
        cropHealthScore = 95;
      } else if (healthyCount === 0) {
        const avgSeverity = diseasedScans.reduce((acc, s) => acc + (s.data?.severity ?? 50), 0) / diseasedScans.length;
        cropHealthScore = Math.max(15, Math.round(100 - avgSeverity));
      } else {
        cropHealthScore = Math.round(60 + (healthyCount / last3.length) * 30);
      }
    }

    let marketScore = null;
    try {
      const cached = JSON.parse(localStorage.getItem("ks_last_market_v2") || "null");
      if (cached?.latestPrice) {
        let score = 65;
        const trend = parseFloat(cached.trendPercent) || 0;
        if (trend > 8) score += 20;
        else if (trend > 3) score += 12;
        else if (trend > 0) score += 5;
        else if (trend < -8) score -= 20;
        else if (trend < -3) score -= 10;
        if (cached.recommendation?.action === "HOLD") score += 8;
        marketScore = Math.min(100, Math.max(20, score));
      }
    } catch {}

    let waterScore = null;
    if (weather) {
      const rainProbs = weather.daily.precipitation_probability_max?.slice(0, 7) ?? [];
      const skipDays = rainProbs.filter(p => p > 50).length;
      const avgRain = rainProbs.reduce((a, b) => a + b, 0) / Math.max(1, rainProbs.length);
      waterScore = Math.min(100, Math.round(50 + skipDays * 7 + avgRain * 0.25));
    }

    const allScores = [soilScore, weatherScore, cropHealthScore, marketScore, waterScore].filter(s => s !== null);
    const overallScore = allScores.length === 0 ? null : Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);

    const SCORE_KEY = "ks_farm_health_score_prev";
    let delta = null;
    if (overallScore !== null) {
      const prev = parseInt(localStorage.getItem(SCORE_KEY));
      delta = isNaN(prev) ? null : overallScore - prev;
      localStorage.setItem(SCORE_KEY, String(overallScore));
    }

    const getLabelInfo = (s) => {
      if (s === null) return { label: "No Data Yet", color: C.mut, bg: "#F3F4F6" };
      if (s >= 85) return { label: "Excellent", color: "#15803D", bg: "#DCFCE7" };
      if (s >= 70) return { label: "Good", color: C.p3, bg: C.tint };
      if (s >= 55) return { label: "Fair", color: C.amber, bg: C.tintAmb };
      return { label: "Needs Attention", color: C.red, bg: "#FEE2E2" };
    };
    const labelInfo = getLabelInfo(overallScore);
    const descMap = {
      "Excellent": "Your farm is in great shape! Keep it up.",
      "Good": "Farm health is solid. A few areas to monitor.",
      "Fair": "Some areas need attention. Check alerts below.",
      "Needs Attention": "Take action on your farm today.",
      "No Data Yet": "Complete a scan to generate your farm score.",
    };
    return { soilScore, weatherScore, cropHealthScore, marketScore, waterScore, overallScore, delta, labelInfo, description: descMap[labelInfo.label] };
  };
  const hs = computeFarmHealthScore();
  const gaugeCirc  = 2 * Math.PI * 45;  // ≈ 282.74
  const gaugeColor = (s) => s === null ? "#E5E7EB" : s >= 81 ? "#16A34A" : s >= 61 ? "#22A05D" : s >= 41 ? "#F59E0B" : "#EF4444";
  const _scoreVal  = hs.overallScore ?? 0;
  const gaugeFill  = (_scoreVal / 100) * gaugeCirc;
  const gaugeEmpty = gaugeCirc - gaugeFill;
  const gaugeBadge = hs.overallScore === null
    ? { text: "No Data Yet", bg: "#F3F4F6", color: "#6B7280", border: "1px solid #E5E7EB" }
    : hs.overallScore >= 81 ? { text: "🌟 Excellent", bg: "#DCFCE7", color: "#15803D", border: "1px solid #86EFAC" }
    : hs.overallScore >= 61 ? { text: "🟢 Good", bg: "#D1FAE5", color: "#065F46", border: "1px solid #6EE7B7" }
    : hs.overallScore >= 41 ? { text: "🟠 Moderate", bg: "#FEF3C7", color: "#92400E", border: "1px solid #FCD34D" }
    : { text: "🔴 Poor", bg: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" };
  const gaugeHeadline = hs.overallScore === null ? "Complete a scan to get your score."
    : hs.overallScore >= 81 ? "Your farm is performing well!"
    : hs.overallScore >= 61 ? "Farm health is solid."
    : hs.overallScore >= 41 ? "A few areas need attention."
    : "Your farm needs attention.";

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* ── Greeting + Weather ──────────────────────────────── */}
      <div style={{ padding: "14px 18px 10px", display: "flex", alignItems: "flex-start", gap: 12 }}>

        {/* Left: greeting + location pill */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.txt, lineHeight: 1.25 }}>
            Good Morning, {user?.fullName || "Ramesh"}! <span style={{ fontSize: 18 }}>👋</span>
          </div>
          <div
            onClick={onLocationClick}
            title="Click to search or edit location"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              color: C.primary,
              marginTop: 6,
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 8,
              background: "rgba(46,125,50,0.08)",
              border: `1.2px solid ${C.brd}`,
              maxWidth: "100%",
              overflow: "hidden",
            }}
          >
            <MapPin size={13} color={C.p2} style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {loc
                ? `${loc.name}, ${loc.state}${loc.country ? `, ${loc.country}` : ""}`
                : locError || "Detecting location..."}
            </span>
            <span style={{ fontSize: 9, color: C.mut, flexShrink: 0 }}>
              {lang === "hi" ? "(बदलें)" : lang === "mr" ? "(बदला)" : "Change"}
            </span>
          </div>
        </div>

        {/* Right: compact weather card */}
        <div style={{
          width: 118,
          flexShrink: 0,
          background: "#fff",
          borderRadius: 14,
          padding: "10px 12px",
          border: `1px solid ${C.brd}`,
          boxShadow: C.shadow,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>{wx(cur?.weathercode)}</span>
            <span style={{ fontSize: 17, fontWeight: 800, color: C.txt }}>
              {cur?.temperature_2m != null ? `${cur.temperature_2m}°C` : "--°C"}
            </span>
          </div>
          <div style={{ fontSize: 10, color: C.mut, fontWeight: 600 }}>
            Humidity {cur?.relative_humidity_2m ?? "--"}%
          </div>
          <div style={{ fontSize: 10, color: C.mut, fontWeight: 600 }}>
            Rain {todayRain != null ? `${todayRain}%` : "--"}
          </div>
        </div>

      </div>

      {/* ── Hero: Scan My Land ─────────────────────────────── */}
      <div style={{ margin: "0 14px 16px" }}>
        <div
          style={{
            borderRadius: 20,
            overflow: "hidden",
            position: "relative",
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.p2} 60%)`,
            minHeight: 218,
          }}
        >
          {heroImg && (
            <img
              src={heroImg}
              alt="Farm scan"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "62% center",
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(90deg, rgba(8,49,32,0.96) 0%, rgba(8,49,32,0.88) 42%, rgba(8,49,32,0.35) 72%, rgba(8,49,32,0.06) 100%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.20))",
            }}
          />
          <div
            style={{
              position: "relative",
              padding: "24px 20px 24px",
              maxWidth: 245,
            }}
          >
            <Badge
              text="✦ AI LAND SCAN"
              color="#A5D6A7"
              bg="rgba(165,214,167,0.2)"
            />
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "white",
                marginTop: 10,
                lineHeight: 1.2,
              }}
            >
              Scan My Land
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.84)",
                marginTop: 6,
                lineHeight: 1.5,
                maxWidth: 205,
              }}
            >
              Get AI-powered insights about your land, soil &amp; best crops
              using satellite intelligence.
            </div>
            <button
              onClick={() => setTab("land")}
              style={{
                marginTop: 14,
                padding: "10px 20px",
                borderRadius: 30,
                border: "none",
                background: "rgba(255,255,255,0.22)",
                color: "white",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 7,
                backdropFilter: "blur(8px)",
              }}
            >
              <span>🛰</span> SCAN MY LAND
            </button>
          </div>
        </div>
      </div>

      {/* ── AI Insight Card ────────────────────────────────── */}
      <div style={{
        margin: "0 14px 16px",
        background: insight.bg,
        borderRadius: 20,
        padding: 16,
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}>
        {/* Row 2: emoji + badge / title / desc */}
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ fontSize: 52, lineHeight: 1, flexShrink: 0 }}>{insight.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 9px", borderRadius: 99,
              background: insight.badgeBg, marginBottom: 7,
              fontSize: 10, fontWeight: 700, color: insight.color,
            }}>
              ✦ AI Insight
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1A1A", lineHeight: 1.25, marginBottom: 5 }}>
              {insight.title}
            </div>
            <div style={{ fontSize: 11, color: "#666", lineHeight: 1.55 }}>
              {insight.desc}
            </div>
          </div>
        </div>

        {/* Row 3: metric chips + CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {[insight.metric1, insight.metric2].map((m, i) => (
            <div key={i} style={{ flex: 1, display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{m.icon}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 9, color: "#888", fontWeight: 600, whiteSpace: "nowrap" }}>{m.label}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1A1A", whiteSpace: "nowrap" }}>{m.value}</div>
              </div>
            </div>
          ))}
          <button
            onClick={() => setTab(insight.navigateTo)}
            style={{
              padding: "10px 14px",
              borderRadius: 99,
              border: "none",
              background: insight.color,
              color: "white",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              marginTop: 4,
              width: "100%",
            }}
          >
            View Recommendation ›
          </button>
        </div>
      </div>

      {/* ── Farm Health Score ─────────────────────────────── */}
      <div style={{ margin: "0 14px 16px", background: "white", borderRadius: 20, padding: 18, border: "1px solid rgba(18,60,44,0.08)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>

          {/* LEFT: circular gauge */}
          <div style={{ width: "45%", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.txt, marginBottom: 10, alignSelf: "flex-start", lineHeight: 1.2 }}>
              Farm Health Score
            </div>
            <svg width="130" height="130" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="45" fill="none" stroke="#E5E7EB" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="45" fill="none"
                stroke={gaugeColor(hs.overallScore)}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${gaugeFill} ${gaugeEmpty}`}
                strokeDashoffset={gaugeCirc * 0.25}
                style={{ transition: "stroke-dasharray 1.2s ease", transform: "rotate(0deg)" }}
              />
              <text x="60" y="55" textAnchor="middle" fontSize="24" fontWeight="900" fill="#123C2C" fontFamily="Inter, sans-serif">
                {hs.overallScore ?? "--"}
              </text>
              <text x="60" y="72" textAnchor="middle" fontSize="12" fill="#82938A" fontFamily="Inter, sans-serif">
                /100
              </text>
            </svg>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 14px", borderRadius: 99, background: gaugeBadge.bg, color: gaugeBadge.color, border: gaugeBadge.border, fontSize: 12, fontWeight: 800, marginTop: 8 }}>
              {gaugeBadge.text}
            </div>
            {hs.delta !== null && hs.delta !== 0 && (
              <div style={{ fontSize: 12, fontWeight: 700, color: hs.delta > 0 ? "#16A34A" : "#EF4444", marginTop: 6 }}>
                {hs.delta > 0 ? "↑" : "↓"} {Math.abs(hs.delta)} points this week
              </div>
            )}
          </div>

          {/* RIGHT: sub-scores */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.txt, marginBottom: 3, lineHeight: 1.3 }}>
              {gaugeHeadline}
            </div>
            <div style={{ fontSize: 11, color: C.mut, marginBottom: 14 }}>Here's what's driving your score</div>
            {[
              { icon: "🌱", label: "Soil Health",  score: hs.soilScore       },
              { icon: "🌧️", label: "Weather",       score: hs.weatherScore    },
              { icon: "🌿", label: "Crop Health",   score: hs.cropHealthScore },
              { icon: "📊", label: "Market",        score: hs.marketScore     },
              { icon: "💧", label: "Water Usage",   score: hs.waterScore      },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20, width: 28, flexShrink: 0 }}>{row.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.txt, marginBottom: 3 }}>{row.label}</div>
                  <div style={{ height: 5, borderRadius: 99, background: "#E5E7EB", overflow: "hidden" }}>
                    <div style={{ width: row.score !== null ? row.score + "%" : "0%", height: "100%", background: gaugeColor(row.score), borderRadius: 99, transition: "width 1.2s ease" }} />
                  </div>
                </div>
                <div style={{ whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: C.txt }}>{row.score ?? "--"}</span>
                  <span style={{ fontSize: 11, color: C.mut }}>/100</span>
                </div>
              </div>
            ))}
            <button
              onClick={() => setTab("sustain")}
              style={{ marginTop: "auto", padding: "11px 0", borderRadius: 12, border: "1px solid #D1FAE5", background: "#F0FDF4", color: "#16A34A", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%" }}
            >
              View Full Analysis →
            </button>
          </div>

        </div>
      </div>

      {/* ── Quick Actions ──────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ padding: "0 18px", marginBottom: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.txt }}>Quick Actions</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, padding: "0 14px" }}>
          {[
            {
              Icon: Satellite,
              iconBg: "linear-gradient(135deg, #16864B, #22A05D)",
              title: "Scan My Land",
              desc: "Analyze soil & get AI crop recommendations",
              onClick: () => setTab("land"),
              border: "1px solid #C8E6C9",
              bg: "#FAFFF8",
            },
            {
              Icon: Microscope,
              iconBg: "linear-gradient(135deg, #7C3AED, #9333EA)",
              title: "Diagnose Crop",
              desc: "Detect diseases instantly with AI vision",
              onClick: () => setTab("grow"),
              border: "1px solid #E9D5FF",
              bg: "#FDFAFF",
            },
            {
              Icon: TrendingUp,
              iconBg: "linear-gradient(135deg, #D97706, #F59E0B)",
              title: "Sell My Crop",
              desc: "Check live prices & get AI selling advice",
              onClick: () => setTab("sell"),
              border: "1px solid #FDE68A",
              bg: "#FFFDF5",
            },
            {
              Icon: Landmark,
              iconBg: "linear-gradient(135deg, #0F766E, #0D9488)",
              title: "Govt Schemes",
              desc: "Find benefits & subsidies you qualify for",
              onClick: () => setTab("schemes"),
              border: "1px solid #99F6E4",
              bg: "#F5FFFD",
            },
          ].map(({ Icon, iconBg, title, desc, onClick, border, bg }, i) => (
            <div
              key={i}
              onClick={onClick}
              onMouseDown={e => { e.currentTarget.style.transform = "scale(0.97)"; }}
              onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
              style={{
                background: bg, borderRadius: 16, padding: "14px 10px",
                border, boxShadow: C.shadow, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                transition: "transform 0.15s ease",
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={20} color="white" />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.txt }}>{title}</div>
              </div>
              <div style={{ marginTop: "auto", width: 26, height: 26, borderRadius: "50%", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={13} color="white" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── AI Alerts ──────────────────────────────────────── */}
      <div
        style={{
          margin: "0 14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 7,
        }}
      >
        {alerts.map((a, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 12,
              background:
                a.type === "ok"
                  ? C.tint
                  : a.type === "warn"
                    ? C.tintAmb
                    : C.tintBlue,
              border: `1px solid ${a.type === "ok" ? "#C8E6C9" : a.type === "warn" ? "#FFE0B2" : "#B3D9F5"}`,
            }}
          >
            {a.type === "ok" ? (
              <CheckCircle size={15} color={C.p3} />
            ) : a.type === "warn" ? (
              <AlertTriangle size={15} color={C.amber} />
            ) : (
              <Info size={15} color={C.blue} />
            )}
            <span style={{ fontSize: 12, color: C.txt2, lineHeight: 1.5 }}>
              {a.text}
            </span>
          </div>
        ))}
      </div>

      {/* ── Recent Alerts ─────────────────────────────────── */}
      {(() => {
        const generateRecentAlerts = (weather, scans) => {
          const alerts = [];
          const daily = weather?.daily;
          const cur = weather?.current;
          const todayRain = daily?.precipitation_probability_max?.[0] ?? 0;
          const tomorrowRain = daily?.precipitation_probability_max?.[1] ?? 0;
          const maxTemp = daily?.temperature_2m_max?.[0] ?? 0;
          const minTemp = daily?.temperature_2m_min?.[0] ?? 99;
          const humidity = cur?.relative_humidity_2m ?? 0;
          const temp = cur?.temperature_2m ?? 0;
          const windspeed = cur?.windspeed_10m ?? 0;

          const lastDiseasedScan = scans
            ?.filter(s => s.type === "leaf" && s.data?.status === "diseased")
            ?.sort((a, b) => new Date(b.date) - new Date(a.date))?.[0];

          if (lastDiseasedScan) {
            const ms = Date.now() - new Date(lastDiseasedScan.date).getTime();
            const hrs = Math.round(ms / 3600000);
            const timeStr = hrs < 1 ? "Just now" : hrs < 24 ? hrs + "h ago" : Math.round(hrs / 24) + "d ago";
            alerts.push({ id: "disease", icon: "🦠", title: "Disease Risk High", desc: lastDiseasedScan.data.disease + " detected in your recent scan. Take action immediately.", time: timeStr, urgent: true, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", navigateTo: "grow" });
          }

          if (minTemp < 4) alerts.push({ id: "frost", icon: "❄️", title: "Frost Warning Tonight", desc: "Temperature dropping to " + minTemp + "°C. Cover seedlings and irrigate before sunset.", time: "Tonight", urgent: true, color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", navigateTo: "sustain" });
          if (maxTemp > 40) alerts.push({ id: "heat", icon: "🌡️", title: "Heat Wave Alert", desc: "Extreme " + maxTemp + "°C expected. Irrigate crops before 7 AM.", time: "Today", urgent: true, color: "#C2410C", bg: "#FFF7ED", border: "#FED7AA", navigateTo: "sustain" });

          if (tomorrowRain > 60) {
            alerts.push({ id: "rain", icon: "🌧️", title: "Heavy Rain Expected", desc: tomorrowRain + "% rain chance tomorrow. Skip irrigation, check drainage channels.", time: "Tomorrow", urgent: tomorrowRain > 80, color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", navigateTo: "sustain" });
          } else if (todayRain > 50) {
            alerts.push({ id: "rain_today", icon: "🌦️", title: "Rain Likely Today", desc: todayRain + "% chance of rainfall. Avoid irrigation and pesticide spraying.", time: "Today", urgent: false, color: "#0369A1", bg: "#F0F9FF", border: "#BAE6FD", navigateTo: "sustain" });
          }

          if (humidity > 85 && temp > 24 && !lastDiseasedScan) alerts.push({ id: "disease_risk", icon: "⚠️", title: "Disease Conditions Active", desc: "High humidity " + humidity + "% favours fungal disease. Inspect your crops today.", time: "Right now", urgent: false, color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", navigateTo: "grow" });
          if (windspeed > 25) alerts.push({ id: "wind", icon: "💨", title: "High Wind Advisory", desc: "Wind at " + windspeed + " km/h. Avoid spraying pesticides or fertilizers today.", time: "Current", urgent: false, color: "#0F766E", bg: "#F0FDFA", border: "#99F6E4", navigateTo: "sustain" });

          try {
            const cached = JSON.parse(localStorage.getItem("ks_last_market_v2") || "null");
            if (cached?.latestPrice && cached?.trendPercent) {
              const trend = parseFloat(cached.trendPercent);
              if (trend > 5) {
                alerts.push({ id: "market", icon: "📈", title: "Market Opportunity", desc: (cached.commodity || "Crop") + " prices up " + trend.toFixed(1) + "% — good selling window open now.", time: cached.lastUpdated ? "Updated " + cached.lastUpdated : "Recent data", urgent: false, color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", navigateTo: "sell" });
              } else if (trend < -5) {
                alerts.push({ id: "market_drop", icon: "📉", title: "Price Drop Alert", desc: (cached.commodity || "Crop") + " prices down " + Math.abs(trend).toFixed(1) + "%. Consider selling soon.", time: "Recent data", urgent: false, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", navigateTo: "sell" });
              }
            }
          } catch {}

          if (alerts.length === 0 && weather) alerts.push({ id: "all_clear", icon: "✅", title: "All Clear", desc: "Weather conditions are favorable. Great day for farm activities.", time: "Right now", urgent: false, color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", navigateTo: "land" });
          if (!weather) alerts.push({ id: "no_weather", icon: "📍", title: "Enable Location", desc: "Allow location access to get real-time farm alerts for your area.", time: "Action needed", urgent: false, color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", navigateTo: "home" });

          return alerts.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0)).slice(0, 3);
        };

        const recentAlerts = generateRecentAlerts(weather, scans);
        return (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", marginBottom: 12 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.txt }}>Recent Alerts</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 14px" }}>
              {recentAlerts.map(alert => (
                <div key={alert.id} onClick={() => setTab(alert.navigateTo)}
                  style={{ background: alert.bg, border: "1px solid " + alert.border, borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: alert.color + "20", border: "1px solid " + alert.color + "40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {alert.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: alert.color }}>{alert.title}</div>
                    <div style={{ fontSize: 11, color: C.txt2, lineHeight: 1.4, marginTop: 2, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{alert.desc}</div>
                    <div style={{ fontSize: 10, color: C.mut, fontWeight: 600, marginTop: 4 }}>{alert.time}</div>
                  </div>
                  <ChevronRight size={16} color={C.mut} style={{ flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Government Benefits Banner ────────────────────── */}
      <div
        onClick={() => setTab("schemes")}
        style={{
          margin: "0 14px 16px",
          borderRadius: 16,
          background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 60%, #388E3C 100%)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: -12, right: -12, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ fontSize: 32, flexShrink: 0 }}>🏛️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: "#A5D6A7", fontWeight: 700, letterSpacing: 1, marginBottom: 3 }}>
            ✦ GOVERNMENT BENEFITS
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "white", lineHeight: 1.25, marginBottom: 3 }}>
            6 Schemes You Qualify For
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.80)" }}>
            PM-KISAN, PMFBY, KCC, RKVY &amp; more →
          </div>
        </div>
        <div style={{
          padding: "7px 12px", borderRadius: 10, background: "rgba(255,255,255,0.18)",
          color: "white", fontSize: 11, fontWeight: 700, flexShrink: 0,
          backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)",
        }}>
          View All
        </div>
      </div>

      {/* ── AI Farming Tip Bar ─────────────────────────────── */}
      <div
        style={{
          margin: "0 14px 16px",
          borderRadius: 16,
          background: `linear-gradient(135deg, ${C.primary}, ${C.p2})`,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {botImg ? (
          <img
            src={botImg}
            alt="AI Bot"
            style={{ width: 44, height: 44, objectFit: "contain" }}
          />
        ) : (
          <div style={{ width:44, height:44, borderRadius:12, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Bot size={24} color="white" /></div>
        )}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              color: "#A5D6A7",
              fontWeight: 700,
              marginBottom: 3,
            }}
          >
            ✦ AI Farming Tip
          </div>
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.9)",
              lineHeight: 1.5,
            }}
          >
            {weatherTip}
          </div>
        </div>
        <button
          onClick={() => voiceOn && speak(weatherTip, lang)}
          style={{
            flexShrink: 0,
            padding: "8px 12px",
            borderRadius: 10,
            border: "none",
            background: "rgba(255,255,255,0.18)",
            color: "white",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            backdropFilter: "blur(8px)",
          }}
        >
          <Volume2 size={13} style={{ marginRight:4 }} />Listen
        </button>
      </div>
    </div>
  );
}
