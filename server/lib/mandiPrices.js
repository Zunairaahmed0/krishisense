const DATA_GOV_KEY = process.env.DATA_GOV_API_KEY;
const BASE = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

const priceCache = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

export const fetchMandiPrices = async ({
  commodity = "Onion",
  state = "Maharashtra",
  district = null,
  market = null,
  limit = 20
}) => {
  const cacheKey = `${commodity}_${state}_${new Date().toDateString()}`;
  const cached = priceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { ...cached.data, fromCache: true };
  }

  const params = new URLSearchParams({
    "api-key": DATA_GOV_KEY,
    format: "json",
    limit: String(limit),
    "filters[state.keyword]": state,
    "filters[commodity]": commodity,
  });
  if (district) params.set("filters[district]", district);
  if (market)   params.set("filters[market]", market);

  const res = await fetch(`${BASE}?${params}`, {
    signal: AbortSignal.timeout(12000)
  });
  if (!res.ok) throw new Error(`data.gov.in returned ${res.status}`);

  const json = await res.json();
  if (!json.records?.length) throw new Error("No records returned");

  const records = json.records
    .map(r => ({
      market:      r.market     || "",
      district:    r.district   || "",
      commodity:   r.commodity  || commodity,
      variety:     r.variety    || "Common",
      grade:       r.grade      || "FAQ",
      minPrice:    parseFloat(r.min_price   || 0),
      maxPrice:    parseFloat(r.max_price   || 0),
      modalPrice:  parseFloat(r.modal_price || 0),
      arrivalDate: r.arrival_date || "",
      state:       r.state || state,
    }))
    .filter(r => r.modalPrice > 0)
    .sort((a, b) => b.modalPrice - a.modalPrice);

  if (!records.length) throw new Error("No valid price records");

  const modalPrices = records.map(r => r.modalPrice);
  const avgPrice = Math.round(
    modalPrices.reduce((s, p) => s + p, 0) / modalPrices.length
  );

  const result = {
    commodity,
    state,
    records,
    summary: {
      avgPrice,
      maxPrice:     Math.max(...modalPrices),
      minPrice:     Math.min(...modalPrices),
      bestMarket:   records[0].market,
      bestPrice:    records[0].modalPrice,
      totalMarkets: records.length,
      lastUpdated:  records[0].arrivalDate,
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
