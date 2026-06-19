// Read lazily inside functions — module-level assignment runs before dotenv.config()
const BASE = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

const priceCache = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

// Approximate centre coordinates for major AGMARKNET districts
// Used to sort mandi results by proximity to user's GPS location
const DISTRICT_COORDS = {
  // Maharashtra
  "Pune":          [18.52, 73.86],
  "Mumbai":        [19.08, 72.88],
  "Nashik":        [19.99, 73.79],
  "Nagpur":        [21.15, 79.09],
  "Aurangabad":    [19.88, 75.34],
  "Solapur":       [17.69, 75.91],
  "Kolhapur":      [16.70, 74.24],
  "Satara":        [17.69, 74.00],
  "Thane":         [19.22, 72.98],
  "Ahmednagar":    [19.09, 74.74],
  "Chandrapur":    [19.95, 79.30],
  "Jalgaon":       [21.01, 75.56],
  "Latur":         [18.40, 76.56],
  "Ratnagiri":     [16.99, 73.30],
  "Sangli":        [16.86, 74.57],
  "Dhule":         [20.90, 74.77],
  "Akola":         [20.71, 77.00],
  "Wardha":        [20.75, 78.60],
  "Yavatmal":      [20.39, 78.12],
  "Nanded":        [19.17, 77.32],
  "Amravati":      [20.93, 77.75],
  "Buldhana":      [20.53, 76.18],
  "Parbhani":      [19.27, 76.78],
  "Beed":          [18.98, 75.75],
  "Raigad":        [18.52, 73.16],
  "Gondia":        [21.46, 80.20],
  "Bhandara":      [21.17, 79.65],
  "Osmanabad":     [18.18, 76.04],
  "Hingoli":       [19.72, 77.15],
  "Washim":        [20.11, 77.14],
  "Gadchiroli":    [20.18, 80.00],
  "Nandurbar":     [21.37, 74.24],
  // Gujarat
  "Ahmedabad":     [23.03, 72.59],
  "Surat":         [21.17, 72.83],
  "Vadodara":      [22.31, 73.18],
  "Rajkot":        [22.30, 70.80],
  "Bhavnagar":     [21.76, 72.15],
  "Junagadh":      [21.52, 70.46],
  "Anand":         [22.56, 72.95],
  "Banaskantha":   [24.17, 72.42],
  "Sabarkantha":   [23.58, 73.04],
  // Rajasthan
  "Jaipur":        [26.91, 75.79],
  "Jodhpur":       [26.29, 73.03],
  "Udaipur":       [24.57, 73.69],
  "Kota":          [25.18, 75.84],
  "Ajmer":         [26.45, 74.64],
  "Bikaner":       [28.02, 73.31],
  "Alwar":         [27.56, 76.61],
  "Sri Ganganagar":[29.91, 73.88],
  // Uttar Pradesh
  "Agra":          [27.18, 78.01],
  "Lucknow":       [26.85, 80.95],
  "Kanpur":        [26.46, 80.33],
  "Varanasi":      [25.32, 83.00],
  "Allahabad":     [25.44, 81.84],
  "Bareilly":      [28.37, 79.42],
  "Meerut":        [28.98, 77.71],
  "Mathura":       [27.49, 77.67],
  "Aligarh":       [27.88, 78.07],
  "Gorakhpur":     [26.76, 83.37],
  "Muzaffarnagar": [29.47, 77.70],
  // Punjab & Haryana
  "Ludhiana":      [30.90, 75.85],
  "Amritsar":      [31.63, 74.87],
  "Jalandhar":     [31.33, 75.58],
  "Patiala":       [30.34, 76.39],
  "Ambala":        [30.38, 76.78],
  "Hisar":         [29.15, 75.72],
  "Rohtak":        [28.89, 76.60],
  "Karnal":        [29.69, 76.99],
  // Madhya Pradesh
  "Indore":        [22.72, 75.86],
  "Bhopal":        [23.26, 77.40],
  "Jabalpur":      [23.18, 79.94],
  "Gwalior":       [26.22, 78.18],
  "Ujjain":        [23.18, 75.77],
  "Sagar":         [23.84, 78.74],
  "Rewa":          [24.53, 81.30],
  "Satna":         [24.60, 80.83],
  "Chhindwara":    [22.06, 78.93],
  "Dewas":         [22.96, 76.05],
  // Karnataka
  "Bengaluru":     [12.97, 77.59],
  "Bangalore":     [12.97, 77.59],
  "Mysuru":        [12.30, 76.65],
  "Hubli":         [15.36, 75.13],
  "Mangaluru":     [12.87, 74.84],
  "Belagavi":      [15.85, 74.50],
  "Dharwad":       [15.46, 75.01],
  "Tumkur":        [13.34, 77.10],
  "Davangere":     [14.46, 75.92],
  // Andhra Pradesh & Telangana
  "Hyderabad":     [17.39, 78.49],
  "Vijayawada":    [16.51, 80.61],
  "Visakhapatnam": [17.69, 83.22],
  "Guntur":        [16.31, 80.44],
  "Nellore":       [14.44, 79.99],
  "Kurnool":       [15.83, 78.04],
  "Warangal":      [17.97, 79.60],
  // Tamil Nadu
  "Chennai":       [13.08, 80.27],
  "Coimbatore":    [11.02, 76.96],
  "Madurai":       [9.93,  78.12],
  "Salem":         [11.67, 78.15],
  "Tirupur":       [11.11, 77.34],
  // West Bengal
  "Kolkata":       [22.57, 88.36],
  "Howrah":        [22.59, 88.31],
  "Asansol":       [23.68, 86.98],
  "Siliguri":      [26.72, 88.43],
  // Bihar
  "Patna":         [25.59, 85.14],
  "Muzaffarpur":   [26.12, 85.39],
  "Gaya":          [24.80, 85.00],
  "Bhagalpur":     [25.25, 86.98],
  // Odisha
  "Bhubaneswar":   [20.30, 85.82],
  "Cuttack":       [20.46, 85.88],
  "Berhampur":     [19.31, 84.79],
  // Delhi/NCR
  "Delhi":         [28.61, 77.21],
  "New Delhi":     [28.61, 77.21],
  "Faridabad":     [28.41, 77.31],
  "Gurgaon":       [28.46, 77.03],
  "Noida":         [28.54, 77.39],
  // Himachal Pradesh
  "Shimla":        [31.10, 77.17],
  "Manali":        [32.24, 77.19],
  "Dharamshala":   [32.22, 76.32],
  // Uttarakhand
  "Dehradun":      [30.32, 78.03],
  "Haridwar":      [29.95, 78.16],
};

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const distanceToDistrict = (districtName, userLat, userLon) => {
  if (!userLat || !userLon || !districtName) return Infinity;
  const key = Object.keys(DISTRICT_COORDS).find(
    k => districtName.toLowerCase().includes(k.toLowerCase()) ||
         k.toLowerCase().includes(districtName.toLowerCase())
  );
  if (!key) return Infinity;
  const [lat, lon] = DISTRICT_COORDS[key];
  return haversineKm(userLat, userLon, lat, lon);
};

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

  const res = await fetch(`${BASE}?${params}`, { signal: AbortSignal.timeout(18000) });
  if (!res.ok) throw new Error(`data.gov.in returned ${res.status}`);
  const json = await res.json();
  return json.records || [];
};

export const fetchMandiPrices = async ({
  commodity = "Onion",
  state = "Maharashtra",
  district = null,
  market = null,
  limit = 50,
  lat = null,
  lon = null,
}) => {
  const userLat = lat ? parseFloat(lat) : null;
  const userLon = lon ? parseFloat(lon) : null;
  const cacheKey = `${commodity}_${district || state}_${new Date().toDateString()}`;
  const cached = priceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const data = { ...cached.data, fromCache: true };
    // Re-sort by distance on cache hit (user may have moved)
    if (userLat && userLon && data.records) {
      data.records = [...data.records].sort((a, b) =>
        distanceToDistrict(a.district, userLat, userLon) -
        distanceToDistrict(b.district, userLat, userLon)
      );
      data.summary.bestMarket  = data.records[0].market;
      data.summary.bestPrice   = data.records[0].modalPrice;
    }
    return data;
  }

  // Fetch state-wide results (larger limit so we have enough to sort by distance)
  const rawRecords = await fetchRaw({ commodity, state, district: null, market, limit });
  if (!rawRecords.length) throw new Error("No records returned");

  // AGMARKNET prices are in ₹/quintal → convert to ₹/kg
  const toKg = (v) => Math.round(parseFloat(v || 0) / 100 * 100) / 100;

  const records = rawRecords
    .map(r => ({
      market:      r.market      || "",
      district:    r.district    || "",
      commodity:   r.commodity   || commodity,
      variety:     r.variety     || "Common",
      grade:       r.grade       || "FAQ",
      minPrice:    toKg(r.min_price),
      maxPrice:    toKg(r.max_price),
      modalPrice:  toKg(r.modal_price),
      arrivalDate: r.arrival_date || "",
      state:       r.state        || state,
    }))
    .filter(r => r.modalPrice >= 1); // drop AGMARKNET data-entry errors (< ₹1/kg is invalid)

  if (!records.length) throw new Error("No valid price records");

  // Sort by distance from user's GPS — nearest mandis first
  if (userLat && userLon) {
    records.sort((a, b) =>
      distanceToDistrict(a.district, userLat, userLon) -
      distanceToDistrict(b.district, userLat, userLon)
    );
  } else {
    // No GPS: sort by price descending
    records.sort((a, b) => b.modalPrice - a.modalPrice);
  }

  const modalPrices = records.map(r => r.modalPrice);
  const avgPrice = Math.round(
    (modalPrices.reduce((s, p) => s + p, 0) / modalPrices.length) * 100
  ) / 100;

  const result = {
    commodity,
    state,
    district: district || null,
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
