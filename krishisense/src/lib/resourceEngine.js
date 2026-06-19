export const computeResourcePlan = (weather, scans, loc) => {
  if (!weather?.current || !weather?.daily) return null;

  const temp  = weather.current.temperature_2m          ?? 28;
  const hum   = weather.current.relative_humidity_2m    ?? 60;
  const wind  = weather.current.windspeed_10m           ?? 5;
  const rain0 = weather.daily.precipitation_probability_max?.[0] ?? 0;
  const rain1 = weather.daily.precipitation_probability_max?.[1] ?? 0;
  const rain2 = weather.daily.precipitation_probability_max?.[2] ?? 0;
  const maxTemp0 = weather.daily.temperature_2m_max?.[0] ?? temp;

  const lastSoilScan = scans?.find(s => s.type === "soil");
  const cropName    = lastSoilScan?.data?.rec?.crop  || "Your crop";
  const soilTexture = lastSoilScan?.data?.soil?.texture || "Loamy";

  // ── Irrigation ────────────────────────────────────────
  const baseDose = soilTexture.includes("Sandy") ? 20
    : soilTexture.includes("Clay") ? 32 : 25;

  let irrigationDose   = baseDose;
  let irrigationMethod = "Drip irrigation";
  let irrigationTiming = "6 AM – 8 AM";
  let irrigationStatus = "irrigate";
  let irrigationReason = "";

  if (rain0 > 60) {
    irrigationStatus = "skip";
    irrigationDose   = 0;
    irrigationReason = `${rain0}% rain expected today — skip to save water`;
  } else if (maxTemp0 > 38) {
    irrigationTiming = "4 AM – 7 AM";
    irrigationDose   = Math.round(baseDose * 1.2);
    irrigationReason = `${maxTemp0}°C heat — irrigate early to reduce evaporation`;
  } else if (maxTemp0 > 32) {
    irrigationTiming = "5 AM – 8 AM";
    irrigationReason = `${maxTemp0}°C — complete before peak heat`;
  } else if (hum > 85) {
    irrigationDose   = Math.round(baseDose * 0.7);
    irrigationReason = `High humidity ${hum}% — reduce dose to prevent waterlogging`;
  } else {
    irrigationReason = `Normal conditions — standard ${soilTexture} soil cycle`;
  }

  if (soilTexture.includes("Sandy")) irrigationMethod = "Drip or sprinkler";
  else if (soilTexture.includes("Clay")) irrigationMethod = "Furrow or flood";

  // ── Spray window ──────────────────────────────────────
  let sprayWindow  = "Dawn or evening";
  let sprayStatus  = "ok";
  let sprayReason  = "";
  let scoutFocus   = "General pest monitoring";
  let precaution   = "Test on small patch first";

  if (wind > 20) {
    sprayStatus  = "hold";
    sprayReason  = `Wind ${wind} km/h — hold pesticides. Low-drift nozzles only after wind settles`;
    sprayWindow  = "Wait for wind < 15 km/h";
  } else if (rain0 > 40) {
    sprayStatus  = "hold";
    sprayReason  = `${rain0}% rain today — any spray will wash off. Reschedule`;
    sprayWindow  = "After rain clears";
  } else if (maxTemp0 > 35) {
    sprayStatus  = "caution";
    sprayReason  = `${maxTemp0}°C heat — spray only dawn or late evening to prevent crop burn`;
    sprayWindow  = "Before 7 AM or after 7 PM";
  } else if (hum > 80) {
    sprayStatus  = "caution";
    sprayReason  = `High humidity ${hum}% — good for contact fungicides, avoid systemic`;
    sprayWindow  = "Morning when dew dries";
  } else {
    sprayReason  = `Good conditions for spraying`;
    sprayWindow  = "6 AM – 10 AM preferred";
  }

  const lastDisease = scans?.filter(s => s.type === "leaf" && s.data?.status === "diseased")
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  if (lastDisease?.data?.disease) {
    scoutFocus  = `Watch for ${lastDisease.data.disease} spread`;
    precaution  = "Inspect lower leaves first — disease spreads upward";
  } else if (hum > 80 && temp > 24) {
    scoutFocus  = "Fungal disease (high humidity)";
    precaution  = "Check undersides of leaves";
  } else if (temp > 35) {
    scoutFocus  = "Mites and aphids (heat stress)";
    precaution  = "Spray in evening only";
  }

  // ── Fertilizer ────────────────────────────────────────
  let fertStatus = "ok";
  let fertAdvice = "";
  let fertDose   = "Standard dose";

  if (maxTemp0 > 38) {
    fertStatus = "caution";
    fertAdvice = `Heat stress at ${maxTemp0}°C increases burn risk. Split dose — apply 50% now, 50% when temp drops`;
    fertDose   = "Half dose only";
  } else if (rain0 > 50) {
    fertStatus = "hold";
    fertAdvice = `${rain0}% rain will leach nutrients. Hold fertilizer application`;
    fertDose   = "Skip today";
  } else if (hum > 85) {
    fertStatus = "caution";
    fertAdvice = `High humidity — use granular form, not foliar spray`;
    fertDose   = "Granular only";
  } else {
    fertAdvice = `Good conditions for fertilizer application`;
    fertDose   = "Standard split dose";
  }

  // ── Risk monitor ──────────────────────────────────────
  const risks = {
    rainRisk:         rain0 > 60 ? "High" : rain0 > 30 ? "Moderate" : "Low",
    sprayDrift:       wind  > 20 ? "High" : wind  > 10 ? "Moderate" : "Low",
    diseasePressure:  (hum > 80 && temp > 24) ? "High" : hum > 70 ? "Moderate" : "Normal",
    nutrientLeaching: rain0 > 50 ? "High" : rain0 > 25 ? "Moderate" : "Low",
  };

  // ── 3-day calendar ────────────────────────────────────
  const rains    = [rain0, rain1, rain2];
  const maxTemps = [
    weather.daily.temperature_2m_max?.[0] ?? maxTemp0,
    weather.daily.temperature_2m_max?.[1] ?? maxTemp0,
    weather.daily.temperature_2m_max?.[2] ?? maxTemp0,
  ];

  const calendar = ["Today", "Tomorrow", "Day 3"].map((label, i) => {
    const r    = rains[i];
    const t    = maxTemps[i];
    const skip = r > 60;
    const dose = skip ? 0 : (t > 38 ? Math.round(baseDose * 1.2) : baseDose);
    return {
      label,
      rain: r,
      maxTemp: t,
      water:       skip ? "Skip — rain expected" : `${dose} mm ${irrigationMethod}`,
      timing:      skip ? "—" : (t > 35 ? "4–7 AM" : "6–8 AM"),
      spray:       (r < 40 && wind < 20) ? "OK" : "Hold",
      fertilizer:  r > 50 ? "Hold" : "Standard",
    };
  });

  // ── Action plan ───────────────────────────────────────
  const actions = [];
  if (irrigationStatus !== "skip")
    actions.push(`Irrigate ${cropName} with ${irrigationDose} mm using ${irrigationMethod}.`);
  if (maxTemp0 > 32)
    actions.push(`Complete irrigation before ${irrigationTiming.split("–")[1]?.trim() || "8 AM"} and keep fertilizer doses smaller.`);
  if (lastDisease?.data?.disease || hum > 80)
    actions.push(`Scout for ${scoutFocus} before any pesticide application.`);
  actions.push(`Use ${irrigationMethod} because ${soilTexture.toLowerCase()} soil ${
    soilTexture.includes("Clay")
      ? "retains water — avoid overwatering"
      : "drains fast — maintain consistent moisture"}.`);

  return {
    cropName, soilTexture,
    irrigation: { dose: irrigationDose, method: irrigationMethod,
                  timing: irrigationTiming, status: irrigationStatus, reason: irrigationReason },
    spray:      { status: sprayStatus, window: sprayWindow, reason: sprayReason,
                  scoutFocus, precaution },
    fertilizer: { status: fertStatus, advice: fertAdvice, dose: fertDose },
    risks, calendar, actions,
  };
};
