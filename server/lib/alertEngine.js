const DISEASE_CONDITIONS = [
  {
    id: "early_blight",
    crops: ["Tomato", "Potato"],
    condition: (w) => w.humidity > 85 && w.temp >= 24 && w.temp <= 29,
    severity: "high",
    message: (loc) => ({
      title: `⚠️ Disease Alert — ${loc}`,
      body:  "Early Blight conditions detected. Humidity and temperature favour fungal spread. Preventive spray recommended within 24 hours.",
      action: "Spray Mancozeb 75WP at 2.5g/L on leaf undersides today.",
    }),
  },
  {
    id: "late_blight",
    crops: ["Tomato", "Potato"],
    condition: (w) => w.humidity > 90 && w.temp >= 10 && w.temp <= 24 && w.rainProbability > 60,
    severity: "critical",
    message: (loc) => ({
      title: `🚨 URGENT — Late Blight Risk in ${loc}`,
      body:  "Critical: Late Blight conditions in your area. This disease can destroy 100% of crops in 5 days. Act NOW.",
      action: "Apply Metalaxyl + Mancozeb (Ridomil Gold) at 2.5g/L immediately.",
    }),
  },
  {
    id: "powdery_mildew",
    crops: ["Onion", "Grape", "Wheat"],
    condition: (w) => w.humidity >= 70 && w.humidity <= 85 && w.temp >= 20 && w.temp <= 28,
    severity: "medium",
    message: (loc) => ({
      title: `⚠️ Powdery Mildew Risk — ${loc}`,
      body:  "Conditions favour Powdery Mildew development. Monitor crops carefully, especially young leaves.",
      action: "Apply Sulphur 80WP at 3g/L or Karathane at 1ml/L as preventive spray.",
    }),
  },
  {
    id: "heat_stress",
    crops: ["all"],
    condition: (w) => w.maxTemp > 40,
    severity: "high",
    message: (loc) => ({
      title: `🌡️ Heat Wave Alert — ${loc}`,
      body:  "Temperature exceeding 40°C expected. Crops are at risk of heat stress and yield loss.",
      action: "Irrigate before 7 AM. Apply kaolin clay spray (50g/L) to reflect heat on sensitive crops.",
    }),
  },
  {
    id: "frost_risk",
    crops: ["Tomato", "Potato", "Pepper"],
    condition: (w) => w.minTemp < 4,
    severity: "critical",
    message: (loc) => ({
      title: `❄️ Frost Warning — ${loc}`,
      body:  "Temperature may drop below 4°C tonight. Frost can kill seedlings and damage crops.",
      action: "Cover seedlings with plastic sheets tonight. Irrigate fields before sunset (water releases heat).",
    }),
  },
  {
    id: "irrigation_skip",
    crops: ["all"],
    condition: (w) => w.rainProbability > 70,
    severity: "info",
    message: (loc, extra) => ({
      title: `💧 Skip Irrigation Tomorrow — ${loc}`,
      body:  `${Math.round(extra?.rainProbability ?? 70)}% chance of rain. Save water and money by skipping irrigation.`,
      action: "Estimated water saving: 8,000–12,000 litres per acre.",
    }),
  },
  {
    id: "market_opportunity",
    crops: ["Onion", "Tomato"],
    condition: (w, extra) => extra?.priceSpike === true,
    severity: "info",
    message: (loc, extra) => ({
      title: `📈 Price Alert — ${extra?.crop || "Crop"} prices rising`,
      body:  `${extra?.crop || "Crop"} prices at ${loc} mandis have risen ${extra?.pct || ""}% this week. Consider selling soon.`,
      action: "Open KrishiSense SELL tab for buyer contacts and optimal timing.",
    }),
  },
];

const toNum  = (v, fallback)  => (typeof v === "number" ? v : fallback);
const arrMax = (v, fallback)  => (Array.isArray(v) ? Math.max(...v.slice(0, 3)) : toNum(v, fallback));
const arrMin = (v, fallback)  => (Array.isArray(v) ? Math.min(...v.slice(0, 3)) : toNum(v, fallback));

export const evaluateAlerts = (weather, loc, farmerCrops = [], extra = {}) => {
  if (!weather) return [];

  const w = {
    temp:            toNum(weather.temperature_2m,          25),
    humidity:        toNum(weather.relative_humidity_2m,    60),
    maxTemp:         arrMax(weather.temperature_2m_max,     30),
    minTemp:         arrMin(weather.temperature_2m_min,     15),
    rainProbability: arrMax(weather.precipitation_probability_max, toNum(weather.precipitation_probability, 20)),
  };

  return DISEASE_CONDITIONS.filter((rule) => {
    const cropMatch =
      rule.crops.includes("all") ||
      farmerCrops.some((c) => rule.crops.includes(c));
    return cropMatch && rule.condition(w, extra);
  }).map((rule) => ({
    ...rule.message(loc?.name || "your area", { ...extra, rainProbability: w.rainProbability }),
    alertType: rule.id,
    severity:  rule.severity,
    targetUrl:
      rule.id.includes("market")    ? "/?tab=sell"    :
      rule.id.includes("irrigation")? "/?tab=sustain" : "/?tab=grow",
  }));
};
