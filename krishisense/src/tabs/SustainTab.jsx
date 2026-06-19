import { useState } from "react";
import { Beaker, ChevronRight, Droplets, Leaf, Recycle, TrendingUp, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { C } from "../constants/theme";
import { wx } from "../constants/data";
import { speak } from "../lib/speech";
import { computeResourcePlan } from "../lib/resourceEngine";
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
  <div style={{ minWidth: 0, background: bg, border: `1px solid ${color}22`, borderRadius: 14, padding: "13px 12px" }}>
    <div style={{ width: 30, height: 30, borderRadius: 10, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", color, boxShadow: "0 6px 18px rgba(18,60,44,0.06)", marginBottom: 8 }}>
      <Icon size={16} />
    </div>
    <div style={{ fontSize: 10, color: C.mut, fontWeight: 700, marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 17, fontWeight: 900, color: C.txt, lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: 10, color, fontWeight: 700, marginTop: 4 }}>{sub}</div>
  </div>
);

const EXTRA_PRACTICES = [
  { Icon: Zap,       label: "Solar Irrigation", status: "Recommended", note: "Install drip irrigation with timer to cut electricity costs by 40%.", color: "#F59E0B" },
  { Icon: TrendingUp, label: "Yield Tracking",  status: "Active",       note: "Log harvest weights each season to identify yield trends.",          color: "#8B5CF6" },
];

export default function SustainTab({ weather, weatherLoading, weatherError, loc, locError, botImg, voiceOn, lang, scans }) {
  const [showAllTips, setShowAllTips]       = useState(false);
  const [forecastExpanded, setForecastExpanded] = useState(false);
  const [showRulebook, setShowRulebook]     = useState(false);

  const plan  = computeResourcePlan(weather, scans || [], loc);
  const daily = weather?.daily;

  const irrigation = (daily?.time || []).slice(0, 7).map((date, i) => {
    const rain = daily?.precipitation_probability_max?.[i];
    const temp = daily?.temperature_2m_max?.[i];
    const skip = rain > 50;
    const condition = rain > 60 ? "Humid" : rain > 40 ? "Rain likely" : temp > 32 ? "Warm" : "Mild";
    return {
      date: i === 0 ? "Today" : new Date(date).toLocaleDateString("en", { weekday: "short" }),
      rain, temp, skip, condition,
      advisory: skip ? "Skip" : temp > 30 ? "Normal" : "Light",
      advisoryColor: skip ? C.blue : C.p3,
      savings: skip ? 6000 + ((i * 1375) % 4000) : 0,
      weatherCode: daily?.weathercode?.[i],
    };
  });

  const totalSaved = irrigation.reduce((s, d) => s + d.savings, 0);
  const barData    = irrigation.map(d => ({ day: d.date, saved: d.savings }));
  const today      = irrigation[0];
  const forecastStatus = locError || weatherError || (weatherLoading ? "Loading live forecast..." : "Enable location to get live forecast.");

  const skipDays    = irrigation.filter(d => d.skip).length;
  const sustainScore = irrigation.length > 0
    ? Math.min(95, Math.round(62 + (skipDays / 7) * 28 + Math.min(10, totalSaved / 9000)))
    : 76;
  const scoreLabel  = sustainScore >= 85 ? "Excellent farm health" : sustainScore >= 72 ? "Good farm practices" : "Room to improve";
  const scoreDesc   = sustainScore >= 75
    ? "Your farm is using water efficiently while keeping soil conditions stable."
    : "Optimize irrigation scheduling based on the 7-day weather forecast to improve your score.";

  const precipSum  = (weather?.daily?.precipitation_sum || []).reduce((a, b) => a + (b || 0), 0);
  const monthWater = Math.round(precipSum * 780 + 14000);
  const monthEnergy = Math.round(monthWater / 340);
  const monthCarbon = +(monthWater * 0.00068).toFixed(1);

  const currentTemp = weather?.current?.temperature_2m || 28;
  const practices = [
    { Icon: Recycle,  label: "Crop Rotation",   status: "Recommended",                             note: "Rotate onion with pulses after harvest to restore nitrogen.",                                                                          color: C.p3   },
    { Icon: Leaf,     label: "Organic Carbon",   status: currentTemp > 35 ? "Monitor" : "Good",    note: currentTemp > 35 ? "High temps reduce organic matter — add compost urgently." : "Maintain compost in the next soil cycle.",             color: C.p3   },
    { Icon: Droplets, label: "Water Efficiency", status: skipDays > 2 ? "High" : "Moderate",       note: skipDays > 0 ? `${skipDays} rain day${skipDays > 1 ? "s" : ""} this week — skip irrigation on those days to save water.` : "Use short morning irrigation windows (5–7 AM).", color: C.blue },
    { Icon: Beaker,   label: "Nitrogen Level",   status: "Slightly Low",                            note: "Plan a measured nitrogen top-up before next crop cycle.",                                                                               color: C.amber },
  ];

  // Status-aware colors for irrigation and spray cards
  const irrigSkip = plan?.irrigation?.status === "skip";
  const sprayHold    = plan?.spray?.status === "hold";
  const sprayCaution = plan?.spray?.status === "caution";

  return (
    <div style={{ paddingBottom: 20 }}>

      {/* ── Page title ──────────────────────────────────── */}
      <div style={{ padding: "16px 18px 12px" }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.primary, letterSpacing: 0 }}>Sustain</div>
        <div style={{ fontSize: 13, color: C.mut, marginTop: 3 }}>
          {loc ? `${loc.name}, ${loc.state}${loc.country ? `, ${loc.country}` : ""}` : forecastStatus}
        </div>
      </div>

      {/* ── Weather Command Center hero ──────────────────── */}
      <div style={{ margin: "0 14px 16px", borderRadius: 20, background: "linear-gradient(135deg, #0a2818, #1B5E20)", padding: "18px 18px 14px", color: "white" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#A5D6A7", letterSpacing: 1.5, marginBottom: 8 }}>
          ⚡ WEATHER COMMAND CENTER
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.2, marginBottom: 6 }}>
          One screen for water,<br />fertilizer &amp; pesticide decisions.
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
          Based on live weather · Your soil · Recent scan history
        </div>
        {loc?.name && (
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 99, background: "rgba(255,255,255,0.12)", width: "fit-content", fontSize: 11, fontWeight: 700 }}>
            📍 {loc.name}, {loc.state}
          </div>
        )}
      </div>

      {/* ── Sustainability Score ─────────────────────────── */}
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
                <div style={{ fontSize: 17, fontWeight: 900, marginTop: 2 }}>
                  {today ? (today.skip ? "Skip irrigation today" : "Light irrigation only") : "Waiting for live forecast"}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.72)", marginTop: 3 }}>
                  {today ? (today.rain > 50 ? "Rain expected soon" : `${today.rain}% rain chance today`) : forecastStatus}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{(today?.savings ?? 0).toLocaleString()}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.68)", fontWeight: 700 }}>litres saved</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Irrigation Plan ──────────────────────────────── */}
      {plan && (
        <div style={{ margin: "0 14px 14px" }}>
          <Card style={{
            background: irrigSkip ? "#EFF6FF" : "#F0FFF4",
            border: `1px solid ${irrigSkip ? "#BFDBFE" : "#BBF7D0"}`,
            padding: 16,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, color: C.mut, letterSpacing: 1, marginBottom: 4 }}>
                  💧 IRRIGATION PLAN
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.txt, lineHeight: 1.1 }}>
                  {irrigSkip ? "Skip Irrigation Today" : `Apply ${plan.irrigation.dose} mm`}
                </div>
                <div style={{ fontSize: 12, color: C.txt2, marginTop: 4, lineHeight: 1.4 }}>
                  {plan.irrigation.reason}
                </div>
              </div>
              <div style={{ fontSize: 32, flexShrink: 0 }}>{irrigSkip ? "⏭️" : "💧"}</div>
            </div>
            {!irrigSkip && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, borderTop: `1px solid ${C.brd}`, paddingTop: 12 }}>
                {[
                  ["SUGGESTED DOSE", `${plan.irrigation.dose} mm`],
                  ["BEST TIMING",    plan.irrigation.timing],
                  ["METHOD FOCUS",   plan.irrigation.method],
                ].map(([label, val]) => (
                  <div key={label} style={{ background: C.surface, borderRadius: 10, padding: "8px 10px" }}>
                    <div style={{ fontSize: 8, fontWeight: 800, color: C.mut, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: C.txt }}>{val}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Spray Window ─────────────────────────────────── */}
      {plan && (
        <div style={{ margin: "0 14px 14px" }}>
          <Card style={{
            background: sprayHold ? "#FEF2F2" : sprayCaution ? "#FFFBEB" : "#F0FFF4",
            border: `1px solid ${sprayHold ? "#FECACA" : sprayCaution ? "#FDE68A" : "#BBF7D0"}`,
            padding: 16,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: C.mut, letterSpacing: 1 }}>🛡 SPRAY WINDOW</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                    background: sprayHold ? "#FEE2E2" : sprayCaution ? "#FEF3C7" : "#D1FAE5",
                    color: sprayHold ? C.red : sprayCaution ? "#92400E" : "#065F46",
                  }}>
                    {plan.spray.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.txt }}>
                  {sprayHold ? "Hold All Spraying" : "Use Cooler Spray Window"}
                </div>
                <div style={{ fontSize: 11, color: C.txt2, marginTop: 4, lineHeight: 1.4 }}>
                  {plan.spray.reason}
                </div>
              </div>
              <div style={{ fontSize: 28 }}>🌡️</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, borderTop: `1px solid ${C.brd}`, paddingTop: 10 }}>
              {[
                ["SPRAY WINDOW", plan.spray.window],
                ["SCOUT FOCUS",  plan.spray.scoutFocus],
                ["PRECAUTION",   plan.spray.precaution],
                ["METHOD",       sprayHold ? "Postpone" : "Standard nozzle"],
              ].map(([label, val]) => (
                <div key={label} style={{ background: C.surface, borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ fontSize: 8, fontWeight: 800, color: C.mut, marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.txt }}>{val}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── Risk Monitor ─────────────────────────────────── */}
      {plan && (
        <div style={{ margin: "0 14px 14px" }}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              ⚠️ Risk Monitor
            </div>
            {[
              ["Rain Risk",         plan.risks.rainRisk],
              ["Spray Drift",       plan.risks.sprayDrift],
              ["Disease Pressure",  plan.risks.diseasePressure],
              ["Nutrient Leaching", plan.risks.nutrientLeaching],
            ].map(([label, level]) => {
              const color = level === "High" ? C.red : level === "Moderate" ? C.amber : C.p3;
              return (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.brd}` }}>
                  <div style={{ fontSize: 12, color: C.txt2, fontWeight: 600, borderLeft: `3px solid ${color}`, paddingLeft: 10 }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color }}>{level}</div>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* ── Action Plan ──────────────────────────────────── */}
      {plan?.actions?.length > 0 && (
        <div style={{ margin: "0 14px 14px" }}>
          <Card style={{ background: C.tint, border: `1px solid ${C.brdHi}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.mut, letterSpacing: 1, marginBottom: 10 }}>
              📋 ACTION PLAN · Next field moves
            </div>
            <div style={{ fontSize: 10, color: C.mut, marginBottom: 12 }}>
              Updated {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </div>
            {plan.actions.map((action, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 800 }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: 12, color: C.txt, lineHeight: 1.55, flex: 1 }}>{action}</div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ── 3-Day Resource Calendar ──────────────────────── */}
      {plan && (
        <div style={{ margin: "0 14px 14px" }}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 4 }}>
              📅 Weather-Adjusted Resource Calendar
            </div>
            <div style={{ fontSize: 10, color: C.mut, marginBottom: 14 }}>3-day plan</div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr", gap: 0 }}>
              {["WINDOW", "WATER", "SPRAY", "FERT"].map(h => (
                <div key={h} style={{ fontSize: 9, fontWeight: 800, color: C.mut, padding: "0 8px 8px", borderBottom: `1px solid ${C.brd}` }}>{h}</div>
              ))}
              {plan.calendar.map((day, i) => [
                <div key={"l" + i} style={{ fontSize: 11, fontWeight: 700, color: C.txt, padding: "10px 8px", borderBottom: i < 2 ? `1px solid ${C.brd}` : "none" }}>
                  {day.label}
                </div>,
                <div key={"w" + i} style={{ fontSize: 10, color: C.txt2, padding: "10px 8px", borderBottom: i < 2 ? `1px solid ${C.brd}` : "none" }}>
                  {day.water}
                </div>,
                <div key={"s" + i} style={{ fontSize: 10, fontWeight: 700, color: day.spray === "OK" ? C.p3 : C.red, padding: "10px 8px", borderBottom: i < 2 ? `1px solid ${C.brd}` : "none" }}>
                  {day.spray}
                </div>,
                <div key={"f" + i} style={{ fontSize: 10, fontWeight: 700, color: day.fertilizer === "Hold" ? C.amber : C.p3, padding: "10px 8px", borderBottom: i < 2 ? `1px solid ${C.brd}` : "none" }}>
                  {day.fertilizer}
                </div>,
              ])}
            </div>
          </Card>
        </div>
      )}

      {/* ── This Week's Impact ───────────────────────────── */}
      <SectionTitle title="This Week's Impact" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 9, padding: "0 14px 18px" }}>
        <Metric Icon={Droplets} label="Water Saved"  value={monthWater >= 1000 ? `${Math.round(monthWater / 1000)}k L` : `${monthWater} L`} sub={`${skipDays} skip day${skipDays !== 1 ? "s" : ""}`} color={C.blue}  bg={C.tintBlue} />
        <Metric Icon={Zap}      label="Energy"       value={monthEnergy} sub="kWh saved"   color={C.amber} bg={C.tintAmb} />
        <Metric Icon={Leaf}     label="Carbon"       value={monthCarbon} sub="kg CO₂ off"  color={C.p3}    bg={C.tint} />
      </div>

      {/* ── 7-Day Farming Impact ─────────────────────────── */}
      <SectionTitle title="7-Day Farming Impact" action={forecastExpanded ? "Collapse" : "Forecast"} onAction={() => setForecastExpanded(v => !v)} />
      {irrigation.length ? (
        <div style={{ display: "flex", gap: 10, padding: "0 14px 18px", overflowX: "auto" }}>
          {irrigation.map((d, i) => (
            <div key={d.date} style={{ flex: "0 0 104px", padding: "12px 10px", borderRadius: 14, background: i === 0 ? C.tint : C.surface, border: i === 0 ? `1px solid ${C.brdHi}` : `1px solid ${C.brd}`, boxShadow: i === 0 ? C.shadow : "none" }}>
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

      {/* ── Weekly Water Savings chart ───────────────────── */}
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

      {/* ── AI Insight ───────────────────────────────────── */}
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
                  const insight = today
                    ? (today.skip ? "Live forecast shows rain risk, so reducing irrigation can save water without affecting yield." : "Live forecast does not show strong rain risk today. Keep irrigation light and monitor soil moisture.")
                    : "Live local forecast will drive irrigation guidance once GPS and weather are available.";
                  if (voiceOn) speak(insight, lang);
                }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: C.p3, display: "flex", alignItems: "center", gap: 3, fontWeight: 700 }}
              >
                🔊 Listen
              </button>
            </div>
            <div style={{ fontSize: 12, color: C.txt2, lineHeight: 1.6, marginTop: 6 }}>
              {today
                ? (today.skip ? "Live forecast shows rain risk, so reducing irrigation can save water without affecting yield." : "Live forecast does not show strong rain risk today. Keep irrigation light and monitor soil moisture.")
                : "Live local forecast will drive irrigation guidance once GPS and weather are available."}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Recommended Practices ────────────────────────── */}
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

      {/* ── Weather Rulebook ─────────────────────────────── */}
      <div style={{ margin: "8px 14px 14px" }}>
        <button onClick={() => setShowRulebook(v => !v)} style={{ width: "100%", padding: "12px 16px", borderRadius: 14, border: `1px solid ${C.brd}`, background: C.surface, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontSize: 13, fontWeight: 700, color: C.txt }}>
          📖 Weather Rulebook {showRulebook ? "▲" : "▼"}
        </button>
        {showRulebook && (
          <Card style={{ marginTop: 8 }}>
            {[
              { icon: "🌧️", title: "Rain or storm",         body: "Pause irrigation, pesticide spray, and top dressing. Focus on drainage and runoff control." },
              { icon: "💨", title: "Wind above 15 km/h",    body: "Hold pesticides and foliar fertilizers. Use low-drift nozzles only after wind settles." },
              { icon: "🌡️", title: "Heat above 32°C",       body: "Irrigate before 8 AM. Avoid pesticide spray and split fertilizer to prevent stress." },
              { icon: "💧", title: "High humidity > 80%",   body: "Ideal for contact fungicide spray. Avoid irrigation to prevent waterlogging." },
              { icon: "❄️", title: "Temperature below 10°C", body: "Pause all spraying. Irrigate before sunset — soil moisture protects from frost." },
            ].map(({ icon, title, body }) => (
              <div key={title} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.brd}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: C.tint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {icon}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.txt }}>{title}</div>
                </div>
                <div style={{ fontSize: 12, color: C.txt2, lineHeight: 1.5, paddingLeft: 40 }}>{body}</div>
              </div>
            ))}
          </Card>
        )}
      </div>

    </div>
  );
}
