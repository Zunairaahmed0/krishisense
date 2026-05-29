import { useState } from "react";
import { Beaker, ChevronRight, Droplets, Leaf, Recycle, TrendingUp, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { C } from "../constants/theme";
import { wx } from "../constants/data";
import { speak } from "../lib/speech";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import CircularGauge from "../components/ui/CircularGauge";

const SectionTitle = ({ title, action, onAction }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 18px", marginBottom: 10 }}>
    <div style={{ fontSize: 16, fontWeight: 800, color: C.txt }}>{title}</div>
    {action && (
      <button onClick={onAction} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.p2, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
        {action} <ChevronRight size={14} />
      </button>
    )}
  </div>
);

const Metric = ({ Icon, label, value, sub, color, bg }) => (
  <div style={{
    minWidth: 0,
    background: bg,
    border: `1px solid ${color}22`,
    borderRadius: 14,
    padding: "13px 12px",
  }}>
    <div style={{ width: 30, height: 30, borderRadius: 10, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", color, boxShadow: "0 6px 18px rgba(18,60,44,0.06)", marginBottom: 8 }}>
      <Icon size={16} />
    </div>
    <div style={{ fontSize: 10, color: C.mut, fontWeight: 700, marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 17, fontWeight: 900, color: C.txt, lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: 10, color, fontWeight: 700, marginTop: 4 }}>{sub}</div>
  </div>
);

const EXTRA_PRACTICES = [
  { Icon: Zap, label: "Solar Irrigation", status: "Recommended", note: "Install drip irrigation with timer to cut electricity costs by 40%.", color: "#F59E0B" },
  { Icon: TrendingUp, label: "Yield Tracking", status: "Active", note: "Log harvest weights each season to identify yield trends.", color: "#8B5CF6" },
];

export default function SustainTab({ weather, weatherLoading, weatherError, loc, locError, botImg, voiceOn, lang }) {
  const [showAllTips, setShowAllTips] = useState(false);
  const [forecastExpanded, setForecastExpanded] = useState(false);
  const daily = weather?.daily;

  const irrigation = (daily?.time || []).slice(0, 7).map((date, i) => {
    const rain = daily?.precipitation_probability_max?.[i];
    const temp = daily?.temperature_2m_max?.[i];
    const skip = rain > 50;
    const condition = rain > 60 ? "Humid" : rain > 40 ? "Rain likely" : temp > 32 ? "Warm" : "Mild";
    return {
      date: i === 0 ? "Today" : new Date(date).toLocaleDateString("en", { weekday: "short" }),
      rain,
      temp,
      skip,
      condition,
      advisory: skip ? "Skip" : temp > 30 ? "Normal" : "Light",
      advisoryColor: skip ? C.blue : C.p3,
      savings: skip ? 6000 + ((i * 1375) % 4000) : 0,
      weatherCode: daily?.weathercode?.[i],
    };
  });

  const totalSaved = irrigation.reduce((s, d) => s + d.savings, 0);
  const barData = irrigation.map(d => ({ day: d.date, saved: d.savings }));
  const today = irrigation[0];
  const forecastStatus = locError || weatherError || (weatherLoading ? "Loading live forecast..." : "Enable location to get live forecast.");

  const skipDays = irrigation.filter(d => d.skip).length;
  const sustainScore = irrigation.length > 0
    ? Math.min(95, Math.round(62 + (skipDays / 7) * 28 + Math.min(10, totalSaved / 9000)))
    : 76;
  const scoreLabel = sustainScore >= 85 ? "Excellent farm health" : sustainScore >= 72 ? "Good farm practices" : "Room to improve";
  const scoreDesc = sustainScore >= 75
    ? "Your farm is using water efficiently while keeping soil conditions stable."
    : "Optimize irrigation scheduling based on the 7-day weather forecast to improve your score.";

  const precipSum = (weather?.daily?.precipitation_sum || []).reduce((a, b) => a + (b || 0), 0);
  const monthWater = Math.round(precipSum * 780 + 14000);
  const monthEnergy = Math.round(monthWater / 340);
  const monthCarbon = +(monthWater * 0.00068).toFixed(1);

  const currentTemp = weather?.current?.temperature_2m || 28;
  const practices = [
    { Icon: Recycle, label: "Crop Rotation", status: "Recommended", note: "Rotate onion with pulses after harvest to restore nitrogen.", color: C.p3 },
    { Icon: Leaf, label: "Organic Carbon", status: currentTemp > 35 ? "Monitor" : "Good", note: currentTemp > 35 ? "High temps reduce organic matter — add compost urgently." : "Maintain compost in the next soil cycle.", color: C.p3 },
    { Icon: Droplets, label: "Water Efficiency", status: skipDays > 2 ? "High" : "Moderate", note: skipDays > 0 ? `${skipDays} rain day${skipDays > 1 ? "s" : ""} this week — skip irrigation on those days to save water.` : "Use short morning irrigation windows (5–7 AM).", color: C.blue },
    { Icon: Beaker, label: "Nitrogen Level", status: "Slightly Low", note: "Plan a measured nitrogen top-up before next crop cycle.", color: C.amber },
  ];

  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ padding: "16px 18px 12px" }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.primary, letterSpacing: 0 }}>Sustain</div>
        <div style={{ fontSize: 13, color: C.mut, marginTop: 3 }}>
          {loc ? `${loc.name}, ${loc.state}${loc.country ? `, ${loc.country}` : ""}` : forecastStatus}
        </div>
      </div>

      <div style={{ margin: "0 14px 18px" }}>
        <Card style={{ padding: 0, overflow: "hidden", background: `linear-gradient(135deg, ${C.primary}, #1F6F48)`, border: "none", boxShadow: C.shadowLg }}>
          <div style={{ padding: "20px 18px", color: "white" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Badge text="SUSTAINABILITY SCORE" color="#DDF7E7" bg="rgba(255,255,255,0.14)" />
                <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 14 }}>
                  <span style={{ fontSize: 46, lineHeight: 0.95, fontWeight: 900 }}>{sustainScore}</span>
                  <span style={{ fontSize: 15, color: "rgba(255,255,255,0.72)", fontWeight: 700 }}>/100</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, marginTop: 6 }}>{scoreLabel}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.76)", lineHeight: 1.55, marginTop: 8, maxWidth: 240 }}>
                  {scoreDesc}
                </div>
              </div>
              <CircularGauge value={sustainScore} size={82} color="#B7F0C8" />
            </div>

            <div style={{ marginTop: 18, padding: "13px 14px", borderRadius: 14, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.16)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Droplets size={20} color="#D9F7FF" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", fontWeight: 700 }}>Today's irrigation</div>
                <div style={{ fontSize: 17, fontWeight: 900, marginTop: 2 }}>{today ? (today.skip ? "Skip irrigation today" : "Light irrigation only") : "Waiting for live forecast"}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.72)", marginTop: 3 }}>{today ? (today.rain > 50 ? "Rain expected soon" : `${today.rain}% rain chance today`) : forecastStatus}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{(today?.savings ?? 0).toLocaleString()}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.68)", fontWeight: 700 }}>litres saved</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <SectionTitle title="This Week's Impact" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 9, padding: "0 14px 18px" }}>
        <Metric Icon={Droplets} label="Water Saved" value={monthWater >= 1000 ? `${Math.round(monthWater/1000)}k L` : `${monthWater} L`} sub={`${skipDays} skip day${skipDays !== 1 ? "s" : ""}`} color={C.blue} bg={C.tintBlue} />
        <Metric Icon={Zap} label="Energy" value={monthEnergy} sub="kWh saved" color={C.amber} bg={C.tintAmb} />
        <Metric Icon={Leaf} label="Carbon" value={monthCarbon} sub="kg CO₂ off" color={C.p3} bg={C.tint} />
      </div>

      <SectionTitle title="7-Day Farming Impact" action={forecastExpanded ? "Collapse" : "Forecast"} onAction={() => setForecastExpanded(v => !v)} />
      {irrigation.length ? (
        <div style={{ display: "flex", gap: 10, padding: "0 14px 18px", overflowX: "auto" }}>
          {irrigation.map((d, i) => (
          <div key={d.date} style={{
            flex: "0 0 104px",
            padding: "12px 10px",
            borderRadius: 14,
            background: i === 0 ? C.tint : C.surface,
            border: i === 0 ? `1px solid ${C.brdHi}` : `1px solid ${C.brd}`,
            boxShadow: i === 0 ? C.shadow : "none",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: i === 0 ? C.p2 : C.mut }}>{d.date}</div>
              <div style={{ fontSize: 19 }}>{wx(d.weatherCode)}</div>
            </div>
            <div style={{ fontSize: 19, fontWeight: 900, color: C.txt }}>{d.temp}°</div>
            <div style={{ fontSize: 10, color: C.mut, marginTop: 2 }}>{d.condition}</div>
            <div style={{ height: 1, background: C.brd, margin: "10px 0" }} />
            <div style={{ fontSize: 11, color: d.advisoryColor, fontWeight: 800 }}>{d.advisory}</div>
            <div style={{ fontSize: 9, color: C.mut, marginTop: 2 }}>{d.rain}% rain</div>
            </div>
          ))}
        </div>
      ) : (
        <Card style={{ margin: "0 14px 18px", color: C.mut, fontSize: 12 }}>
          {forecastStatus}
        </Card>
      )}

      {forecastExpanded && irrigation.length > 0 && (
        <div style={{ margin: "0 14px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
          {irrigation.map(d => (
            <div key={d.date} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: d.skip ? C.tintBlue : C.surface, border: `1px solid ${d.skip ? "#B3D9F5" : C.brd}` }}>
              <div style={{ fontSize: 22, width: 32, textAlign: "center" }}>{wx(d.weatherCode)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.txt }}>{d.date} — {d.temp}° · {d.condition}</div>
                <div style={{ fontSize: 10, color: C.mut, marginTop: 2 }}>{d.rain}% rain probability</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: d.advisoryColor }}>{d.advisory}</div>
                {d.savings > 0 && <div style={{ fontSize: 9, color: C.blue }}>{d.savings.toLocaleString()} L saved</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalSaved > 0 && (
        <>
          <SectionTitle title="Weekly Water Savings" />
          <Card style={{ margin: "0 14px 18px", padding: "16px 10px 10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 8px 10px" }}>
              <div>
                <div style={{ fontSize: 12, color: C.mut, fontWeight: 700 }}>Predicted saving</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.blue }}>{totalSaved.toLocaleString()} L</div>
              </div>
              <Badge text="Optimized" color={C.blue} bg={C.tintBlue} />
            </div>
            <ResponsiveContainer width="100%" height={132}>
              <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.brd} />
                <XAxis dataKey="day" tick={{ fill: C.mut, fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fill: C.mut, fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.brd}`, borderRadius: 10, fontSize: 11 }} formatter={v => [`${v.toLocaleString()} L`, "Saved"]} />
                <Bar dataKey="saved" fill={C.blue} radius={[7, 7, 0, 0]} opacity={0.82} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      <div style={{ margin: "0 14px 18px" }}>
        <Card style={{ background: C.tint, border: "1px solid #C8E6C9", display: "flex", gap: 14, alignItems: "center" }}>
          {botImg && <img src={botImg} alt="AI advisor" style={{ width: 54, height: 54, objectFit: "contain", flexShrink: 0 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.p2, fontSize: 12, fontWeight: 800 }}>
                <TrendingUp size={14} /> AI Insight
              </div>
              <button
                onClick={() => {
                  const insight = today ? (today.skip ? "Live forecast shows rain risk, so reducing irrigation can save water without affecting yield." : "Live forecast does not show strong rain risk today. Keep irrigation light and monitor soil moisture.") : "Live local forecast will drive irrigation guidance once GPS and weather are available.";
                  if (voiceOn) speak(insight, lang);
                }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: C.p3, display: "flex", alignItems: "center", gap: 3, fontWeight: 700 }}
              >
                🔊 Listen
              </button>
            </div>
            <div style={{ fontSize: 12, color: C.txt2, lineHeight: 1.6, marginTop: 6 }}>
              {today ? (today.skip ? "Live forecast shows rain risk, so reducing irrigation can save water without affecting yield." : "Live forecast does not show strong rain risk today. Keep irrigation light and monitor soil moisture.") : "Live local forecast will drive irrigation guidance once GPS and weather are available."}
            </div>
          </div>
        </Card>
      </div>

      <SectionTitle title="Recommended Practices" action={showAllTips ? "Less" : "More Tips"} onAction={() => setShowAllTips(v => !v)} />
      <div style={{ display: "flex", flexDirection: "column", gap: 9, padding: "0 14px 8px" }}>
        {[...practices, ...(showAllTips ? EXTRA_PRACTICES : [])].map(({ Icon, label, status, note, color }) => (
          <Card key={label} style={{ padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: `${color}16`, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={19} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.txt }}>{label}</div>
                <Badge text={status} color={color} />
              </div>
              <div style={{ fontSize: 11, color: C.mut, lineHeight: 1.45 }}>{note}</div>
            </div>
            <ChevronRight size={16} color={C.mut} />
          </Card>
        ))}
      </div>
    </div>
  );
}
