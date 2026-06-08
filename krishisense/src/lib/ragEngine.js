import { SOIL_CROP_MATRIX, DISEASE_TREATMENT_KB, REGIONAL_MARKET_KB, SOIL_AMENDMENT_KB } from '../data/agriculturalKB';

const classifyPH = (ph) => {
  const n = parseFloat(ph);
  if (n < 6.5) return 'acidic';
  if (n <= 7.5) return 'neutral';
  return 'alkaline';
};

export const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1;
  if ([6, 7, 8, 9, 10].includes(month)) return 'Kharif';
  if ([11, 12, 1, 2, 3].includes(month)) return 'Rabi';
  return 'Zaid';
};

export const getCropContext = (soil, loc) => {
  if (!soil || !loc) return '';
  const season = getCurrentSeason();
  const phRange = classifyPH(soil.ph);
  const altSeason = season === 'Kharif' ? 'Rabi' : 'Kharif';

  // Try progressively broader matches — NEVER fall back to an unrelated state
  const candidates = [
    `${loc.state}:${soil.texture}:${phRange}:${season}`,
    `${loc.state}:Loamy:${phRange}:${season}`,
    `${loc.state}:Clayey:${phRange}:${season}`,
    `${loc.state}:Sandy Loam:${phRange}:${season}`,
    `${loc.state}:Sandy:${phRange}:${season}`,
    `${loc.state}:${soil.texture}:neutral:${season}`,
    `${loc.state}:Loamy:neutral:${season}`,
    `${loc.state}:${soil.texture}:${phRange}:${altSeason}`,
    `${loc.state}:Loamy:neutral:${altSeason}`,
  ];

  // Deduplicate while preserving priority order
  const seen = new Set();
  const keys = candidates.filter(k => !seen.has(k) && seen.add(k));

  let entry = null;
  for (const key of keys) {
    if (SOIL_CROP_MATRIX[key]) { entry = SOIL_CROP_MATRIX[key]; break; }
  }
  // No KB entry for this state — let Gemini decide from soil/weather data directly
  if (!entry) return '';

  return `
ICAR REFERENCE DATA FOR ${loc.state} (${soil.texture} soil, pH ${phRange}, ${season}):
Leading crop in this region: ${entry.primaryCrop} (${entry.confidence}% historical suitability)
Alternatives: ${entry.topCrops.join(', ')}
Regional basis: ${entry.reason}
Typical yield: ${entry.yield} | Typical profit: ${entry.profit}
Duration: ${entry.duration} | Fertilizer: ${entry.fertilizer}
Source: ${entry.source}

Use this as one input alongside the actual soil readings and weather above.
  `.trim();
};

export const getDiseaseContext = (diseaseName) => {
  if (!diseaseName) return '';
  const entry = DISEASE_TREATMENT_KB[diseaseName];
  if (!entry) return '';

  return `
VERIFIED TREATMENT PROTOCOL (${entry.source}):
Disease: ${entry.scientificName}
Treatment steps: ${entry.treatment.join(' | ')}
Organic alternative: ${entry.organicOption}
Expected yield loss if untreated: ${entry.estimatedYieldLoss}
  `.trim();
};

export const getDiseaseEntry = (diseaseName) => {
  if (!diseaseName) return null;
  // Try exact match first, then partial match
  if (DISEASE_TREATMENT_KB[diseaseName]) return DISEASE_TREATMENT_KB[diseaseName];
  const lower = diseaseName.toLowerCase();
  const key = Object.keys(DISEASE_TREATMENT_KB).find(k => lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower));
  return key ? DISEASE_TREATMENT_KB[key] : null;
};

export const getSoilAmendmentContext = (soil) => {
  if (!soil) return '';
  const amendments = [];
  const ph = parseFloat(soil.ph);
  const n = parseInt(soil.n);
  const soc = parseFloat(soil.soc);

  if (ph < 6.0) amendments.push(SOIL_AMENDMENT_KB['ph_too_low']);
  if (ph > 8.0) amendments.push(SOIL_AMENDMENT_KB['ph_too_high']);
  if (n < 150) amendments.push(SOIL_AMENDMENT_KB['nitrogen_low']);
  if (soc < 0.4) amendments.push(SOIL_AMENDMENT_KB['soc_low']);

  if (!amendments.length) return '';
  return `SOIL AMENDMENTS NEEDED:\n${amendments.map(a => `${a.amendment}: ${a.dose} (Cost: ${a.cost})`).join('\n')}`;
};

export const buildCropRAGContext = (soil, loc, ndvi) => {
  const parts = [
    getCropContext(soil, loc),
    getSoilAmendmentContext(soil),
  ].filter(Boolean);
  return parts.join('\n\n');
};

export const isDiseaseWeatherMatch = (diseaseName, weather) => {
  const entry = getDiseaseEntry(diseaseName);
  if (!entry?.weatherTrigger || !weather?.current) return false;
  const hum = weather.current.relative_humidity_2m;
  const temp = weather.current.temperature_2m;
  if (hum == null || temp == null) return false;
  try {
    // weatherTrigger uses "humidity" and "temperature" as tokens; replace with actual values
    const expr = entry.weatherTrigger
      .replace(/humidity/g, hum)
      .replace(/temperature/g, temp);
    // eslint-disable-next-line no-new-func
    return new Function(`return (${expr})`)();
  } catch { return false; }
};
