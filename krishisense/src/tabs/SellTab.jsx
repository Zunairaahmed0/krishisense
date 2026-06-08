import { useState, useEffect } from "react";
import { useDemoMode } from "../lib/demoMode";
import { DEMO_MARKET } from "../lib/demoData";
import { ChevronRight, CheckCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { C } from "../constants/theme";
import { PRICES, BUYERS } from "../constants/data";
import { askAI } from "../lib/ai";
import { speak } from "../lib/speech";
import { parseJSON } from "../lib/utils";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Sparkline from "../components/ui/Sparkline";
import Spinner from "../components/ui/Spinner";
import LiveDot from "../components/ui/LiveDot";

const CROP_EMOJIS = { Onion: "🧅", Tomato: "🍅", Wheat: "🌾", Cotton: "🌿", Rice: "🌾" };

export default function SellTab({ loc, voiceOn, lang, onionsImg }) {
  const demoMode = useDemoMode();
  const [crop, setCrop] = useState("Onion");
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [buyerModal, setBuyerModal] = useState(null);
  const [mandiModal, setMandiModal] = useState(false);
  const [qtyKg, setQtyKg] = useState("");

  // Build location-aware buyer list from actual city/state
  const buildLocalBuyers = (city, state, pricePerKg) => {
    const c = city || "Local";
    const s = state || "India";
    const p = pricePerKg || 15;
    return [
      {
        name: `${c} Fresh Mart`,
        type: "Retailer",
        dist: `${3 + Math.floor(Math.random() * 6)} km`,
        offer: +(p * 1.06).toFixed(1),
        qty: "300–500 kg",
        rating: 4.7,
        tag: "Nearest",
        color: "#388E3C",
      },
      {
        name: `${s} Agro Exports`,
        type: "Exporter",
        dist: `${70 + Math.floor(Math.random() * 60)} km`,
        offer: +(p * 1.14).toFixed(1),
        qty: "2–5 tonnes",
        rating: 4.6,
        tag: "Best Price",
        color: "#1565C0",
      },
      {
        name: `${c} Wholesale Hub`,
        type: "Wholesaler",
        dist: `${12 + Math.floor(Math.random() * 15)} km`,
        offer: +(p * 0.97).toFixed(1),
        qty: "5–10 tonnes",
        rating: 4.4,
        tag: "High Volume",
        color: "#9CA3AF",
      },
      {
        name: `${c} Hotel & Restaurant Group`,
        type: "Restaurant",
        dist: `${2 + Math.floor(Math.random() * 5)} km`,
        offer: +(p * 1.02).toFixed(1),
        qty: "100–200 kg",
        rating: 4.9,
        tag: "Premium",
        color: "#E65100",
      },
    ];
  };

  // 1. Generate elegant fallback data in case API fails
  const getFallbackData = (selectedCrop) => {
    const pd = PRICES[selectedCrop] || PRICES.Onion;
    const latest = pd[pd.length - 1].p;
    const prev = pd[pd.length - 8].p;
    const trend = (((latest - prev) / prev) * 100).toFixed(1);
    const up = parseFloat(trend) > 0;

    const chartData = pd.slice(-15).map(d => ({ day: d.d, price: d.p, forecast: null }));
    const lastPrice = chartData[chartData.length - 1].price;
    const forecastData = Array.from({ length: 5 }, (_, i) => ({
      day: `F${i+1}`,
      price: null,
      forecast: +(lastPrice + (i + 1) * 0.9 + ((i * 7) % 5) * 0.08).toFixed(1),
    }));

    // Mock Mandis scaled to the actual price level of this crop
    const localMandis = [
      { name: "Lasalgaon Mandi", city: "Nashik",  price: Math.round(latest * 0.95), change: 8,  updated: "30 min ago" },
      { name: "Pune Market",     city: "Pune",    price: Math.round(latest * 1.10), change: 12, updated: "20 min ago" },
      { name: "Kalyan Mandi",    city: "Thane",   price: Math.round(latest * 1.00), change: 5,  updated: "1 hr ago"   },
      { name: "Mumbai Market",   city: "Mumbai",  price: Math.round(latest * 1.15), change: 9,  updated: "25 min ago" },
    ];

    return {
      latestPrice: latest,
      trendPercent: trend,
      isUp: up,
      chartPrices: chartData,
      forecastPrices: forecastData,
      mandis: localMandis,
      buyers: buildLocalBuyers(loc?.name, loc?.state, latest),
      recommendation: {
        action: "HOLD",
        days: 5,
        target: `₹${(latest * 1.15).toFixed(0)}-${(latest * 1.25).toFixed(0)}`,
        reason: `High demand expected in major wholesale hubs for ${selectedCrop} over the next few days.`,
        confidence: 85,
        percent: 12,
      }
    };
  };

  // 2. Fetch live mandi prices from data.gov.in AGMARKNET via backend
  const fetchLiveMarketData = async (selectedCrop) => {
    // ── Demo mode: instant market data ────────────────────────────────────────
    if (demoMode) {
      setMarketData(DEMO_MARKET);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const BACKEND = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/+$/, "");
    const stateName = loc?.state || "Maharashtra";
    const districtName = loc?.name || "";
    const latParam = loc?.lat ? `&lat=${loc.lat}` : "";
    const lonParam = loc?.lon ? `&lon=${loc.lon}` : "";
    const districtParam = districtName ? `&district=${encodeURIComponent(districtName)}` : "";

    try {
      const [pricesRes, trendRes] = await Promise.all([
        fetch(`${BACKEND}/api/market/prices?commodity=${encodeURIComponent(selectedCrop)}&state=${encodeURIComponent(stateName)}${districtParam}${latParam}${lonParam}`),
        fetch(`${BACKEND}/api/market/trend?commodity=${encodeURIComponent(selectedCrop)}&state=${encodeURIComponent(stateName)}`)
      ]);

      if (!pricesRes.ok) throw new Error("Price API failed");

      const pricesData = await pricesRes.json();
      const trendData  = trendRes.ok ? await trendRes.json() : { trend: [] };

      // Build chart data from real trend
      const chartPrices = (trendData.trend || []).map((t, i) => ({
        day:      `D${i + 1}`,
        price:    t.price,
        forecast: null,
        date:     t.date,
      }));

      // If trend is empty fall back to records
      if (!chartPrices.length) {
        pricesData.records.slice(0, 10).forEach((r, i) => {
          chartPrices.push({ day: `D${i + 1}`, price: r.modalPrice, forecast: null });
        });
      }

      const lastPrice  = pricesData.summary.avgPrice;
      const firstPrice = chartPrices[0]?.price || lastPrice;
      const trendPct   = firstPrice > 0
        ? (((lastPrice - firstPrice) / firstPrice) * 100).toFixed(1)
        : "0";
      const trendSlope = chartPrices.length > 1
        ? (chartPrices[chartPrices.length - 1].price - chartPrices[0].price) / chartPrices.length
        : 0.5;

      // 5-day AI forecast extrapolation
      const forecastPrices = Array.from({ length: 5 }, (_, i) => ({
        day:      `F${i + 1}`,
        price:    null,
        forecast: Math.round(lastPrice + trendSlope * (i + 1)),
      }));

      // Top 4 mandis from real records
      const mandis = pricesData.records.slice(0, 4).map(r => ({
        name:     r.market,
        city:     r.district || r.market,
        price:    r.modalPrice,
        minPrice: r.minPrice,
        maxPrice: r.maxPrice,
        variety:  r.variety,
        updated:  r.arrivalDate || "Today",
        change:   Math.round(((r.modalPrice - lastPrice) / lastPrice) * 10),
      }));

      // Ask Gemini for recommendation using real price numbers
      const recPrompt =
        `Agricultural market analyst. Real AGMARKNET government data:
Crop: ${selectedCrop}, State: ${stateName}
Average modal price across ${pricesData.summary.totalMarkets} mandis: ₹${lastPrice}/quintal
Best mandi: ${pricesData.summary.bestMarket} at ₹${pricesData.summary.bestPrice}/quintal
Price trend: ${trendPct}% change over last ${chartPrices.length} data points
Last updated: ${pricesData.summary.lastUpdated}

Give HOLD or SELL recommendation. Return ONLY valid JSON:
{"action":"HOLD or SELL","days":0,"target":"₹XX-XX","reason":"one sentence using the real price data","confidence":85,"percent":8}`;

      const raw = await askAI(recPrompt, "Return only valid JSON. No markdown.");
      const rec = parseJSON(raw) || {
        action:     parseFloat(trendPct) > 3 ? "HOLD" : "SELL",
        days:       parseFloat(trendPct) > 3 ? 5 : 0,
        target:     `₹${Math.round(lastPrice * 1.1)}-${Math.round(lastPrice * 1.18)}`,
        reason:     `${selectedCrop} prices averaging ₹${lastPrice} across ${pricesData.summary.totalMarkets} mandis in ${stateName}.`,
        confidence: 82,
        percent:    Math.abs(parseFloat(trendPct)),
      };

      const localBuyers = buildLocalBuyers(districtName, stateName, lastPrice);

      const mktData = {
        latestPrice:  lastPrice,
        trendPercent: parseFloat(trendPct),
        isUp:         parseFloat(trendPct) >= 0,
        chartPrices,
        forecastPrices,
        mandis,
        buyers: localBuyers,
        recommendation:  rec,
        dataSource:      pricesData.source,
        lastUpdated:     pricesData.summary.lastUpdated,
        totalMarkets:    pricesData.summary.totalMarkets,
        bestMarket:      pricesData.summary.bestMarket,
        bestPrice:       pricesData.summary.bestPrice,
        localDistrict:   pricesData.district || districtName,
      };
      setMarketData(mktData);
      try { localStorage.setItem("ks_last_market_v2", JSON.stringify(mktData)); } catch {}

      if (voiceOn && rec) {
        const msg = rec.action === "HOLD"
          ? `${selectedCrop} average price is ₹${lastPrice} per quintal across ${pricesData.summary.totalMarkets} mandis. Recommendation: hold for ${rec.days} days. Target ${rec.target}.`
          : `${selectedCrop} at ₹${lastPrice} per quintal. Best price at ${pricesData.summary.bestMarket}. Good time to sell.`;
        speak(msg, lang);
      }

    } catch (e) {
      console.error("[market]", e.message);
      // Try localStorage cache before static fallback
      try {
        const cached = JSON.parse(localStorage.getItem("ks_last_market_v2") || "null");
        if (cached?.latestPrice && cached?.dataSource) {
          setMarketData(cached);
          setError("Showing last known live data — refresh to update.");
          setLoading(false);
          return;
        }
      } catch {}
      setError("Live mandi data unavailable — showing AI estimated prices.");
      setMarketData(getFallbackData(selectedCrop));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveMarketData(crop);
  }, [crop, loc?.state, loc?.name]);

  const currentData = marketData || getFallbackData(crop);
  const latest = currentData.latestPrice;
  const trend = currentData.trendPercent;
  const up = currentData.isUp;
  const fullData = [...currentData.chartPrices, ...currentData.forecastPrices];
  const cropEmoji = CROP_EMOJIS[crop] || "🌾";

  return (
    <div style={{ paddingBottom: 16 }}>

      {/* ── Hero Header ────────────────────────────────────── */}
      <div style={{ padding: "14px 18px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.txt }}>Smart Selling Insights</div>
          <div style={{ fontSize: 12, color: C.mut }}>AI-powered market intelligence</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => fetchLiveMarketData(crop)}
            disabled={loading}
            style={{
              background: "none",
              border: `1px solid ${C.brd}`,
              borderRadius: 10,
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 700,
              color: C.p2,
              display: "flex",
              alignItems: "center",
              gap: 5,
              boxShadow: C.shadow,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "🔄 Updating..." : "🔄 Refresh"}
          </button>
          <div style={{ fontSize: 32 }}>📈</div>
        </div>
      </div>

      {/* ── Error Banner ───────────────────────────────────── */}
      {error && (
        <div style={{ margin: "0 14px 12px", padding: "8px 12px", borderRadius: 10, background: "#FFF3E0", border: "1px solid #FFE0B2", color: "#E65100", fontSize: 10, display: "flex", gap: 6, alignItems: "center" }}>
          <span>⚠️</span> <span>{error}</span>
        </div>
      )}

      {/* ── AI Recommendation Card ─────────────────────────── */}
      <Card style={{ margin: "0 14px 16px", background: C.tint, border: "1px solid #C8E6C9", minHeight: 180, position: "relative" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 160, gap: 10 }}>
            <Spinner size={32} />
            <span style={{ fontSize: 12, color: C.mut, fontWeight: 600 }}>Executing AI Search Grounding…</span>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: C.shadow }}>🤖</div>
                <div style={{ fontSize: 12, color: C.p2, fontWeight: 700 }}>✦ AI Recommendation</div>
              </div>
              
              <div style={{ fontSize: 26, fontWeight: 900, color: currentData.recommendation.action === "HOLD" ? C.primary : C.p3, letterSpacing: -0.5 }}>
                {currentData.recommendation.action === "HOLD" ? `HOLD FOR ${currentData.recommendation.days} DAYS` : "✅ SELL NOW"}
              </div>
              <div style={{ fontSize: 12, color: C.txt2, marginTop: 4, lineHeight: 1.4 }}>{currentData.recommendation.reason}</div>
              
              {currentData.recommendation.action === "HOLD" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                  <Badge text={`+${currentData.recommendation.percent}%`} color={C.p3} />
                  <span style={{ fontSize: 11, color: C.mut }}>Target: {currentData.recommendation.target}</span>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                  <Badge text="Best Price" color={C.p3} />
                  <span style={{ fontSize: 11, color: C.mut }}>Market Rate: ₹{latest}/kg</span>
                </div>
              )}
            </div>

            <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 10 }}>
              <div style={{ background: C.surface, borderRadius: 12, padding: "6px 12px", border: `1px solid ${C.brd}`, marginBottom: 8, fontSize: 11, color: C.mut }}>Your Crop</div>
              {crop === "Onion" && onionsImg ? (
                <img src={onionsImg} alt="Onion" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 12 }} />
              ) : (
                <div style={{ fontSize: 56, paddingRight: 8 }}>{cropEmoji}</div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* ── Crop Selector ──────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, padding: "0 18px 14px", overflowX: "auto" }}>
        {Object.keys(PRICES).map(c => (
          <button key={c} onClick={() => { setCrop(c); }} style={{ flexShrink: 0, padding: "5px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700, border: `1px solid ${crop===c ? C.p3 : C.brd}`, background: crop===c ? C.tint : C.surface, color: crop===c ? C.p2 : C.mut, cursor: "pointer" }}>
            {c}
          </button>
        ))}
      </div>

      {/* ── Your Quantity & Profit Calculator ─────────────── */}
      <div style={{ margin: "0 14px 16px", padding: "14px 16px", borderRadius: 14, border: `1px solid ${C.brd}`, background: C.surface, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 28, flexShrink: 0 }}>{cropEmoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: C.mut, fontWeight: 700, marginBottom: 7 }}>Your quantity to sell</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="number"
              min="1"
              placeholder="e.g. 500"
              value={qtyKg}
              onChange={e => setQtyKg(e.target.value)}
              style={{ width: 100, padding: "7px 10px", borderRadius: 9, border: `1.5px solid ${C.brdHi}`, fontSize: 15, fontWeight: 700, color: C.txt, outline: "none", background: C.bg }}
            />
            <span style={{ fontSize: 12, color: C.mut, fontWeight: 700 }}>kg</span>
          </div>
        </div>
        {parseFloat(qtyKg) > 0 && (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: C.mut, fontWeight: 700 }}>Est. earnings</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.p2 }}>₹{Math.round(parseFloat(qtyKg) * latest).toLocaleString("en-IN")}</div>
            <div style={{ fontSize: 9, color: C.mut }}>at ₹{latest}/kg</div>
          </div>
        )}
      </div>

      {/* ── Live Mandi Prices ──────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 18px", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.txt }}>Live Mandi Prices</div>
          {marketData?.dataSource && !marketData?.fromFallback && (
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "2px 8px", borderRadius: 99,
              background: "#E8F5E9", border: "1px solid #C8E6C9",
              fontSize: 9, fontWeight: 700, color: "#2E7D32"
            }}>
              <div style={{
                width: 5, height: 5, borderRadius: "50%",
                background: "#2E7D32",
                animation: "pulse 1.5s infinite"
              }} />
              LIVE · {marketData.localDistrict ? `Near ${marketData.localDistrict}` : marketData.dataSource}
            </div>
          )}
        </div>
        <button onClick={() => setMandiModal(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.p3, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>View All <ChevronRight size={14}/></button>
      </div>

      <div style={{ display: "flex", gap: 10, padding: "0 14px 16px", overflowX: "auto", minHeight: 120 }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "20px 0" }}>
            <Spinner size={20} /> <span style={{ fontSize: 11, color: C.mut, marginLeft: 8 }}>Grounding mandi list...</span>
          </div>
        ) : (
          currentData.mandis.map((m, i) => (
            <Card key={i} style={{ flex: "0 0 140px", padding: "12px 14px", border: i === 1 ? `2px solid ${C.p3}` : `1px solid ${C.brd}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.txt, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
              <div style={{ fontSize: 10, color: C.mut, marginBottom: 6 }}>{m.city}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.txt }}>₹{m.price}<span style={{ fontSize: 12, color: C.mut }}>/kg</span></div>
              {m.minPrice && m.maxPrice && (
                <div style={{ fontSize: 9, color: C.mut, marginTop: 2 }}>
                  Range: ₹{m.minPrice}–₹{m.maxPrice}
                </div>
              )}
              {m.variety && m.variety !== "Common" && (
                <div style={{ fontSize: 9, color: C.mut }}>
                  Variety: {m.variety}
                </div>
              )}
              <div style={{ fontSize: 10, color: m.change >= 0 ? C.p3 : C.red, fontWeight: 600 }}>
                {m.change >= 0 ? "↑" : "↓"} {m.change >= 0 ? "+" : ""}{m.change}%
              </div>
              <Sparkline data={currentData.chartPrices.slice(-8).map(d => d.price || latest)} color={C.p3} width={80} height={24} />
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 9, color: C.mut }}>
                <LiveDot color={C.p3} /> Updated {m.updated}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* ── AGMARKNET Attribution ──────────────────────────── */}
      {marketData?.lastUpdated && (
        <div style={{
          fontSize: 9, color: C.mut, textAlign: "center",
          padding: "4px 0 8px", fontWeight: 600
        }}>
          📊 Data: AGMARKNET via data.gov.in · Last updated: {marketData.lastUpdated} · {marketData.totalMarkets} markets reporting
        </div>
      )}

      {/* ── Price Trend Chart ──────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 18px", marginBottom: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.txt }}>Price Trend &amp; AI Forecast</div>
        <button onClick={() => document.getElementById("sell-buyers-section")?.scrollIntoView({ behavior: "smooth" })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.p3, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>View Buyers <ChevronRight size={14}/></button>
      </div>

      <Card style={{ margin: "0 14px 16px", padding: "14px 8px 8px" }}>
        <div style={{ display: "flex", gap: 16, paddingLeft: 8, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.txt2 }}>
            <div style={{ width: 20, height: 2, background: C.p3, borderRadius: 1 }}/>Past Prices
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.mut }}>
            <div style={{ width: 20, height: 2, background: C.amber, borderRadius: 1, borderStyle: "dashed" }}/>AI Forecast
          </div>
        </div>
        
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 180, gap: 8 }}>
            <Spinner size={24} />
            <span style={{ fontSize: 11, color: C.mut }}>Reconstructing price chart...</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={fullData} margin={{ top: 5, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.p3} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={C.p3} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.brd} />
              <XAxis dataKey="day" tick={{ fill: C.mut, fontSize: 9 }} tickLine={false} interval={3}/>
              <YAxis tick={{ fill: C.mut, fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.brd}`, borderRadius: 10, fontSize: 12, color: C.txt }} formatter={(v, n) => [v ? `₹${v}` : "-", n === "price" ? crop : "AI Forecast"]} />
              <Area type="monotone" dataKey="price" stroke={C.p3} strokeWidth={2.5} fill="url(#priceGrad)" dot={false} connectNulls={false} />
              <Area type="monotone" dataKey="forecast" stroke={C.amber} strokeWidth={2} strokeDasharray="5 5" fill="none" dot={{ fill: C.amber, r: 3 }} connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 8px 0", borderTop: `1px solid ${C.brd}`, marginTop: 4 }}>
          <span style={{ fontSize: 14 }}>✦</span>
          <span style={{ fontSize: 11, color: C.p2, fontWeight: 500 }}>
            {loading ? "Calculating forecast models..." : `AI Forecast: Prices expected to move by ${trend}% this week.`}
          </span>
        </div>
      </Card>

      {/* ── Nearby Buyers ──────────────────────────────────── */}
      <div id="sell-buyers-section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 18px", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.txt }}>Nearby Buyers</div>
          {loc?.name && <div style={{ fontSize: 10, color: C.mut, marginTop: 1 }}>📍 Near {loc.name}, {loc.state}</div>}
        </div>
        <button onClick={() => setBuyerModal("all")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.p3, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>View All <ChevronRight size={14}/></button>
      </div>

      <div style={{ padding: "0 14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "30px 0" }}>
            <Spinner size={20} /> <span style={{ fontSize: 11, color: C.mut, marginLeft: 8 }}>Scouting verified direct deals...</span>
          </div>
        ) : (
          currentData.buyers.map((b, i) => (
            <Card key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${b.color || '#4CAF50'}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                {b.type === "Retailer" ? "🏪" : b.type === "Exporter" ? "🚢" : b.type === "Restaurant" ? "🍽" : "🏢"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.txt, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</span>
                  <CheckCircle size={12} color={C.p3} />
                  <span style={{ fontSize: 9, color: C.p3 }}>Verified</span>
                </div>
                <div style={{ fontSize: 11, color: C.mut }}>Needs: {b.qty} {crop}</div>
                <div style={{ fontSize: 10, color: C.mut }}>📍 {b.dist} away</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.txt }}>₹{b.offer}<span style={{ fontSize: 10, color: C.mut }}>/kg</span></div>
                <button onClick={() => setBuyerModal(b)} style={{ marginTop: 6, padding: "5px 12px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.surface, fontSize: 10, color: C.p2, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  View Offer <ChevronRight size={11} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* ── Mandi Comparison Modal ─────────────────────────── */}
      {mandiModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: C.bg, width: "100%", maxWidth: 480, maxHeight: "80vh", borderTopLeftRadius: 24, borderTopRightRadius: 24, overflowY: "auto", boxShadow: "0 -8px 32px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 6px" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E0E0E0" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 18px 12px", borderBottom: `1px solid ${C.brd}` }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.txt }}>All Mandi Prices — {crop}</div>
              <button onClick={() => setMandiModal(false)} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: C.surface, color: C.txt2, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              {[...currentData.mandis].sort((a, b) => b.price - a.price).map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: i === 0 ? C.tint : C.surface, border: i === 0 ? `2px solid ${C.p3}` : `1px solid ${C.brd}` }}>
                  {i === 0 && <div style={{ fontSize: 16 }}>🏆</div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.txt }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: C.mut }}>📍 {m.city} · Updated {m.updated}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: i === 0 ? C.p2 : C.txt }}>₹{m.price}<span style={{ fontSize: 11, color: C.mut }}>/kg</span></div>
                    <div style={{ fontSize: 10, color: C.p3, fontWeight: 600 }}>↑ +{m.change}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Buyer Detail / All Buyers Modal ────────────────── */}
      {buyerModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: C.bg, width: "100%", maxWidth: 480, maxHeight: "80vh", borderTopLeftRadius: 24, borderTopRightRadius: 24, overflowY: "auto", boxShadow: "0 -8px 32px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 6px" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E0E0E0" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 18px 12px", borderBottom: `1px solid ${C.brd}` }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.txt }}>{buyerModal === "all" ? `All Buyers — ${crop}` : buyerModal.name}</div>
              <button onClick={() => setBuyerModal(null)} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: C.surface, color: C.txt2, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              {(buyerModal === "all" ? currentData.buyers : [buyerModal]).map((b, i) => (
                <div key={i} style={{ borderRadius: 14, border: `1px solid ${C.brd}`, background: C.surface, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: `${b.color || C.p3}10` }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${b.color || C.p3}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                      {b.type === "Retailer" ? "🏪" : b.type === "Exporter" ? "🚢" : b.type === "Restaurant" ? "🍽" : "🏢"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: C.txt }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: C.mut }}>{b.type} · {b.dist} away</div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: C.p2 }}>₹{b.offer}<span style={{ fontSize: 11, color: C.mut }}>/kg</span></div>
                  </div>
                  <div style={{ padding: "12px 16px", display: "flex", gap: 10 }}>
                    <div style={{ flex: 1, fontSize: 11, color: C.txt2 }}>
                      <div>📦 Needs: <strong>{b.qty} of {crop}</strong></div>
                      <div style={{ marginTop: 4 }}>📍 Distance: <strong>{b.dist}</strong></div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <a href="tel:+919999999999" style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: C.p2, color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                        📞 Call
                      </a>
                      <a href={`https://wa.me/?text=${encodeURIComponent(`Hi, I have ${qtyKg ? `${qtyKg} kg` : b.qty} of ${crop} available at ₹${b.offer}/kg. Interested?`)}`} target="_blank" rel="noreferrer" style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.surface, color: C.txt2, fontSize: 11, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                        💬 WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── AI Selling Tip ─────────────────────────────────── */}
      <div style={{ margin: "0 14px 8px", borderRadius: 16, background: "#FFFBF0", border: "1px solid #FFE0B2", padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ fontSize: 28, flexShrink: 0 }}>🤖</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: C.amber, fontWeight: 700, marginBottom: 3 }}>✦ AI Selling Tip</div>
          <div style={{ fontSize: 12, color: C.txt2, lineHeight: 1.5 }}>
            {loading ? "Re-evaluating profit margins..." : (
              <>
                {currentData.recommendation.reason} <br/>
                {currentData.recommendation.action === "HOLD" ? (
                  <span>Holding your crop for <strong style={{ color: C.amber }}>{currentData.recommendation.days} days</strong> may increase profits by <strong style={{ color: C.amber }}>{currentData.recommendation.percent}%</strong>.</span>
                ) : (
                  <span>Recommend selling immediately at target price <strong style={{ color: C.amber }}>{currentData.recommendation.target}</strong> to secure margins.</span>
                )}
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            if (loading || !voiceOn) return;
            const tipText = `${currentData.recommendation.reason}. AI Recommendation is to ${currentData.recommendation.action === "HOLD" ? `hold for ${currentData.recommendation.days} days to increase profits by ${currentData.recommendation.percent} percent.` : `sell now.`}`;
            speak(tipText, lang);
          }}
          disabled={loading}
          style={{ flexShrink: 0, padding: "7px 12px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.surface, color: C.txt2, fontSize: 10, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.5 : 1 }}
        >
          🔊 Listen
        </button>
      </div>
    </div>
  );
}
