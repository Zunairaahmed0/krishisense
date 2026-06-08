// Hardcoded impressive demo data for conference presentations.
// Activated by tapping the KrishiSense logo 5 times.

export const DEMO_SOIL = { ph: "7.6", n: "182", soc: "0.58", texture: "Clayey" };

export const DEMO_SOIL_SCAN = {
  soil: DEMO_SOIL,
  ndvi: {
    success: true,
    current: 0.61,
    previous: 0.54,
    delta: 0.07,
    trendLabel: "Improving ↑",
    trendColor: "#388E3C",
    latestDate: "2026-06-01",
    classification: { label: "Good Vegetation", color: "#2E7D32", emoji: "🌿", pct: 68 },
    source: "NASA MODIS",
    isMock: false,
  },
  rec: {
    crop: "Onion",
    confidence: 91,
    yield: "10-12 quintals/acre",
    profit: "₹52,000/acre",
    duration: "110-120 days",
    reason: "Black cotton vertisol soil (pH 7.6) with strong nitrogen levels is ideal for Rabi Onion — Maharashtra's premier commercial crop. Satellite NDVI of 0.61 confirms healthy vegetation baseline.",
    actions: [
      "Prepare raised beds 15 cm high for excellent drainage and root penetration",
      "Apply 40 kg N + 20 kg P₂O₅ + 20 kg K₂O per acre as basal fertilizer",
      "Irrigate every 8-10 days, avoid waterlogging at bulbing stage",
    ],
    risk: "Low",
    season: "Rabi",
  },
  loc: { name: "Nashik", state: "Maharashtra" },
};

export const DEMO_DISEASE = {
  disease: "Early Blight",
  scientific: "Alternaria solani",
  crop: "Tomato",
  severity: 72,
  confidence: 96,
  status: "diseased",
  description: "Early blight (Alternaria solani) identified — characteristic concentric brown ring lesions on lower leaves. Current high humidity (88%) is accelerating fungal spore spread.",
  treatment: [
    "Remove and destroy all infected leaves immediately — do not compost",
    "Spray Mancozeb 75WP at 2.5 g/L water, thoroughly cover leaf undersides",
    "Follow with Copper Oxychloride (Blitox 50) at 3 g/L after 7 days",
  ],
  urgency: "48 hours",
  prevention: "Maintain 45-60 cm plant spacing, avoid overhead irrigation, mulch soil surface",
  hf_model_used: true,
  hf_confidence: 94,
  hf_source: "PlantVillage Dataset (38 disease classes, 54,000+ training images)",
  top_predictions: [
    { label: "Early Blight", score: 94 },
    { label: "Target Spot",  score: 4  },
    { label: "Septoria Leaf Spot", score: 2 },
  ],
};

export const DEMO_MARKET = {
  latestPrice: 18,
  trendPercent: "12.5",
  isUp: true,
  chartPrices: [
    { day:"D1",  price:13.2, forecast:null }, { day:"D2",  price:13.8, forecast:null },
    { day:"D3",  price:14.5, forecast:null }, { day:"D4",  price:14.9, forecast:null },
    { day:"D5",  price:15.2, forecast:null }, { day:"D6",  price:15.6, forecast:null },
    { day:"D7",  price:16.0, forecast:null }, { day:"D8",  price:16.4, forecast:null },
    { day:"D9",  price:16.8, forecast:null }, { day:"D10", price:17.1, forecast:null },
    { day:"D11", price:17.4, forecast:null }, { day:"D12", price:17.6, forecast:null },
    { day:"D13", price:17.8, forecast:null }, { day:"D14", price:18.0, forecast:null },
    { day:"D15", price:18.2, forecast:null },
  ],
  forecastPrices: [
    { day:"F1", price:null, forecast:18.8 }, { day:"F2", price:null, forecast:19.5 },
    { day:"F3", price:null, forecast:20.1 }, { day:"F4", price:null, forecast:20.8 },
    { day:"F5", price:null, forecast:21.5 },
  ],
  mandis: [
    { name:"Lasalgaon APMC", city:"Nashik",  price:18, change:12, updated:"20 min ago" },
    { name:"Pune APMC",      city:"Pune",    price:20, change:15, updated:"30 min ago" },
    { name:"Kalyan Mandi",   city:"Thane",   price:19, change:10, updated:"1 hr ago"   },
    { name:"Mumbai APMC",    city:"Mumbai",  price:21, change:8,  updated:"25 min ago" },
  ],
  buyers: [
    { name:"Lasalgaon Direct Buyer",  type:"Retailer",   dist:"3 km",   offer:19, qty:"500 kg",   color:"#E65100" },
    { name:"Mumbai Agro Exports Ltd", type:"Exporter",   dist:"185 km", offer:22, qty:"5 tonnes", color:"#1565C0" },
    { name:"Pune Restaurant Chain",   type:"Restaurant", dist:"68 km",  offer:20, qty:"300 kg",   color:"#388E3C" },
  ],
  recommendation: {
    action: "HOLD",
    days: 5,
    target: "₹21-23",
    reason: "Onion prices rising steadily driven by export demand from Bangladesh and UAE at Lasalgaon mandi. Holding 5 days may yield 12-15% additional returns.",
    confidence: 88,
    percent: 14,
  },
};
