// Read lazily inside functions — module-level assignment runs before dotenv.config()
const BASE = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

const priceCache = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

const fetchRaw = async ({ commodity, state, district, market, limit }) => {
  const DATA_GOV_KEY = process.env.DATA_GOV_API_KEY;
  if (!DATA_GOV_KEY) throw new Error("DATA_GOV_API_KEY not set in environment");
  const params = new URLSearchParams({
    "api-key": DATA_GOV_KEY,
    format: "json",
    limit: String(limit),
    "filters[state.keyword]": state,
    "filters[commodity]": commodity,
  });
  if (district) params.set("filters[district]", district);
  if (market)   params.set("filters[market]", market);

  const res = await fetch(`${BASE}?${params}`, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`data.gov.in returned ${res.status}`);
  const json = await res.json();
  return json.records || [];
};

export const fetchMandiPrices = async ({
  commodity = "Onion",
  state = "Maharashtra",
  district = null,
  market = null,
  limit = 30,
}) => {
  const cacheKey = `${commodity}_${district || state}_${new Date().toDateString()}`;
  const cached = priceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { ...cached.data, fromCache: true };
  }

  // Try district-filtered first; fall back to state-wide if < 3 local results
  let rawRecords = [];
  let usedDistrict = null;
  if (district) {
    rawRecords = await fetchRaw({ commodity, state, district, market, limit });
    if (rawRecords.length >= 3) {
      usedDistrict = district;
    } else {
      // Not enough local results — go state-wide
      rawRecords = await fetchRaw({ commodity, state, district: null, market, limit });
    }
  } else {
    rawRecords = await fetchRaw({ commodity, state, district: null, market, limit });
  }

  if (!rawRecords.length) throw new Error("No records returned");

  // AGMARKNET returns prices in ₹/quintal (1 quintal = 100 kg)
  // Convert to ₹/kg for display by dividing by 100
  const toKg = (v) => Math.round(parseFloat(v || 0) / 100 * 100) / 100;

  const records = rawRecords
    .map(r => ({
      market:      r.market     || "",
      district:    r.district   || "",
      commodity:   r.commodity  || commodity,
      variety:     r.variety    || "Common",
      grade:       r.grade      || "FAQ",
      minPrice:    toKg(r.min_price),
      maxPrice:    toKg(r.max_price),
      modalPrice:  toKg(r.modal_price),
      minPriceQ:   parseFloat(r.min_price   || 0),
      maxPriceQ:   parseFloat(r.max_price   || 0),
      modalPriceQ: parseFloat(r.modal_price || 0),
      arrivalDate: r.arrival_date || "",
      state:       r.state || state,
    }))
    .filter(r => r.modalPrice > 0)
    .sort((a, b) => b.modalPrice - a.modalPrice);

  if (!records.length) throw new Error("No valid price records");

  const modalPrices = records.map(r => r.modalPrice); // ₹/kg
  const avgPrice = Math.round(
    (modalPrices.reduce((s, p) => s + p, 0) / modalPrices.length) * 100
  ) / 100;

  const result = {
    commodity,
    state,
    district: usedDistrict,
    records,
    summary: {
      avgPrice,
      maxPrice:     Math.max(...modalPrices),
      minPrice:     Math.min(...modalPrices),
      bestMarket:   records[0].market,
      bestPrice:    records[0].modalPrice,
      totalMarkets: records.length,
      lastUpdated:  records[0].arrivalDate,
      unit:         "₹/kg",
    },
    source: "data.gov.in / AGMARKNET",
    live: true,
  };

  priceCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
};

export const fetchPriceTrend = async (commodity, state) => {
  const data = await fetchMandiPrices({ commodity, state, limit: 50 });
  const byDate = {};
  data.records.forEach(r => {
    if (!byDate[r.arrivalDate]) byDate[r.arrivalDate] = [];
    byDate[r.arrivalDate].push(r.modalPrice);
  });
  return Object.entries(byDate)
    .map(([date, prices]) => ({
      date,
      price: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length)
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-15);
};

export const fetchMultiCropPrices = async (crops, state) => {
  const results = await Promise.allSettled(
    crops.map(commodity => fetchMandiPrices({ commodity, state }))
  );
  return Object.fromEntries(
    crops.map((crop, i) => [
      crop,
      results[i].status === "fulfilled" ? results[i].value : null
    ])
  );
};
