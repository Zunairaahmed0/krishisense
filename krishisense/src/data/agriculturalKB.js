// Key: "state:soil_texture:ph_range:season"
// ph_range: "acidic" (<6.5), "neutral" (6.5-7.5), "alkaline" (>7.5)
// Textures match estimateSoilMetrics output: Sandy, Clayey, Loamy, Sandy Loam, Sandy Clay Loam, Gravelly Clay
export const SOIL_CROP_MATRIX = {
  "Maharashtra:Clayey:alkaline:Rabi": {
    topCrops: ["Onion", "Wheat", "Chickpea"],
    primaryCrop: "Onion",
    confidence: 91,
    reason: "Black cotton (vertisol) soil with high clay content and alkaline pH 7.2-8.0 is ideal for Rabi onion. Maharashtra produces 40% of India's onion supply from this exact soil profile.",
    yield: "9-12 quintals/acre",
    profit: "₹40,000-55,000/acre",
    duration: "110-120 days",
    fertilizer: "40kg N + 20kg P₂O₅ + 20kg K₂O per acre",
    irrigation: "Every 8-10 days, avoid waterlogging",
    source: "ICAR-NHRDF Nashik recommendations"
  },
  "Maharashtra:Clayey:alkaline:Kharif": {
    topCrops: ["Cotton", "Soybean", "Pigeon Pea"],
    primaryCrop: "Cotton",
    confidence: 89,
    reason: "Vidarbha-Marathwada black cotton soil (vertisol) with deep clay profile and high water retention is the traditional home of cotton in India — Maharashtra grows 40% of national cotton area.",
    yield: "3-5 quintals/acre (lint)",
    profit: "₹22,000-35,000/acre",
    duration: "150-180 days",
    fertilizer: "32kg N + 16kg P₂O₅ + 16kg K₂O per acre as basal + 16kg N top dress at 45 DAS",
    irrigation: "Critical at boll formation (50-60 DAS), 8-10 irrigations total",
    source: "ICAR-CICR Nagpur recommendations"
  },
  "Maharashtra:Clayey:neutral:Kharif": {
    topCrops: ["Soybean", "Cotton", "Pigeon Pea"],
    primaryCrop: "Soybean",
    confidence: 87,
    reason: "Neutral-pH black cotton soil of Malwa plateau extension into Maharashtra provides excellent drainage and nutrient retention for soybean — the crop matches nitrogen-fixing capacity to heavy clay soils.",
    yield: "6-8 quintals/acre",
    profit: "₹22,000-32,000/acre",
    duration: "90-100 days",
    fertilizer: "8kg N + 24kg P₂O₅ + 16kg K₂O per acre (nitrogen-fixing crop, minimal N needed)",
    irrigation: "2-3 supplementary irrigations during dry spells",
    source: "ICAR-IISR Indore, VNMKV Parbhani"
  },
  "Maharashtra:Loamy:neutral:Rabi": {
    topCrops: ["Wheat", "Chickpea", "Sorghum"],
    primaryCrop: "Wheat",
    confidence: 82,
    reason: "Loamy soils of Konkan/Marathwada fringe with neutral pH support Rabi wheat where supplementary irrigation is available; shorter duration varieties are preferred.",
    yield: "12-15 quintals/acre",
    profit: "₹18,000-25,000/acre",
    duration: "105-115 days",
    fertilizer: "40kg N + 20kg P₂O₅ + 12kg K₂O per acre",
    irrigation: "3-4 irrigations (crown root initiation, tillering, grain filling)",
    source: "PDKV Akola, VNMKV Parbhani"
  },
  "Punjab:Loamy:neutral:Rabi": {
    topCrops: ["Wheat", "Mustard", "Potato"],
    primaryCrop: "Wheat",
    confidence: 96,
    reason: "Deep, fertile alluvial loamy soil of the Indo-Gangetic Plain with neutral pH 6.8-7.2 is the world's most productive wheat belt — Punjab yields are consistently 40-50% above national average.",
    yield: "20-24 quintals/acre",
    profit: "₹28,000-38,000/acre",
    duration: "130-140 days",
    fertilizer: "55kg N + 25kg P₂O₅ + 12kg K₂O per acre (N in 3 splits)",
    irrigation: "6 irrigations: CRI, tillering, jointing, flowering, grain filling, dough stage",
    source: "PAU Ludhiana, ICAR-Wheat Research Directorate Karnal"
  },
  "Punjab:Loamy:neutral:Kharif": {
    topCrops: ["Basmati Rice", "Maize", "Cotton"],
    primaryCrop: "Basmati Rice",
    confidence: 92,
    reason: "Punjab's alluvial loam with neutral pH and high water-table produces premium long-grain Basmati rice (Pusa 1121) that commands a 3x export premium over ordinary paddy.",
    yield: "14-18 quintals/acre",
    profit: "₹42,000-65,000/acre",
    duration: "130-145 days",
    fertilizer: "50kg N + 16kg P₂O₅ + 16kg K₂O per acre",
    irrigation: "Continuous flood irrigation 2-3 cm, drain 10 days before harvest",
    source: "PAU Ludhiana (Pusa Basmati 1121 cultivation guide)"
  },
  "Punjab:Loamy:alkaline:Rabi": {
    topCrops: ["Wheat", "Barley", "Mustard"],
    primaryCrop: "Wheat",
    confidence: 85,
    reason: "Slightly alkaline alluvial soils in Punjab's saline-affected districts still support wheat with gypsum amendment and alkaline-tolerant varieties like WH-1105.",
    yield: "18-22 quintals/acre",
    profit: "₹25,000-35,000/acre",
    duration: "130-140 days",
    fertilizer: "50kg N + 25kg P₂O₅ + 12kg K₂O per acre + gypsum 200kg/acre for saline correction",
    irrigation: "6 irrigations (same schedule as neutral soils)",
    source: "PAU Ludhiana, CSSRI Karnal sodic soil guidelines"
  },
  "Haryana:Loamy:neutral:Rabi": {
    topCrops: ["Wheat", "Mustard", "Barley"],
    primaryCrop: "Wheat",
    confidence: 95,
    reason: "Haryana's deep alluvial loam (neutral pH 6.8-7.2) in the Yamuna-Sutlej divide is consistently among India's highest-yielding wheat tracts, matching Punjab in productivity.",
    yield: "22-26 quintals/acre",
    profit: "₹30,000-42,000/acre",
    duration: "125-135 days",
    fertilizer: "55kg N + 25kg P₂O₅ + 12kg K₂O per acre",
    irrigation: "6 irrigations at CRI, tillering, jointing, booting, flowering, grain filling",
    source: "HAU Hisar, ICAR-IARI recommendation"
  },
  "Haryana:Loamy:neutral:Kharif": {
    topCrops: ["Basmati Rice", "Maize", "Bajra"],
    primaryCrop: "Basmati Rice",
    confidence: 88,
    reason: "Haryana's alluvial loam with canal irrigation produces Basmati 1121 and Pusa-44 paddy; western districts with lighter soils shift to Bajra for drought resilience.",
    yield: "18-22 quintals/acre",
    profit: "₹35,000-55,000/acre",
    duration: "125-140 days",
    fertilizer: "50kg N + 20kg P₂O₅ + 20kg K₂O per acre",
    irrigation: "Alternate wetting and drying to save 20-30% water vs continuous flooding",
    source: "HAU Hisar, ICAR-DRR Hyderabad"
  },
  "Uttar Pradesh:Loamy:neutral:Rabi": {
    topCrops: ["Wheat", "Mustard", "Lentil"],
    primaryCrop: "Wheat",
    confidence: 93,
    reason: "UP's fertile alluvial loam in the Ganga-Yamuna doab with neutral pH is India's largest wheat-producing zone, with eastern UP districts historically delivering record state yields.",
    yield: "18-22 quintals/acre",
    profit: "₹25,000-35,000/acre",
    duration: "120-130 days",
    fertilizer: "50kg N + 22kg P₂O₅ + 10kg K₂O per acre",
    irrigation: "4-5 irrigations at CRI, tillering, jointing, flowering, grain filling",
    source: "SVPUAT Meerut, ICAR-Wheat Research Directorate Karnal"
  },
  "Uttar Pradesh:Loamy:neutral:Kharif": {
    topCrops: ["Sugarcane", "Paddy", "Maize"],
    primaryCrop: "Sugarcane",
    confidence: 90,
    reason: "Western UP's neutral alluvial loam with high water retention and year-round irrigation access from the Ganga canal system makes it India's #1 sugarcane-producing district cluster.",
    yield: "300-400 quintals/acre",
    profit: "₹35,000-55,000/acre",
    duration: "10-12 months",
    fertilizer: "100kg N + 36kg P₂O₅ + 36kg K₂O per acre in split doses",
    irrigation: "8-10 irrigations; critical at tillering and elongation stages",
    source: "ICAR-SBI Lucknow, UP Sugarcane Research Institute Shahjahanpur"
  },
  "Bihar:Loamy:neutral:Rabi": {
    topCrops: ["Wheat", "Lentil", "Mustard"],
    primaryCrop: "Wheat",
    confidence: 88,
    reason: "Bihar's North Plains alluvial loam (neutral pH 6.8-7.2) from the Ganga-Ghaghra system is increasingly productive after the Rajendra Prasad Central Agricultural University's variety releases.",
    yield: "17-21 quintals/acre",
    profit: "₹22,000-32,000/acre",
    duration: "115-125 days",
    fertilizer: "45kg N + 20kg P₂O₅ + 10kg K₂O per acre",
    irrigation: "3-4 irrigations (CRI, tillering, grain filling); tube well reliant",
    source: "BAU Sabour, ICAR-IARI variety HD-2781 / K-9107"
  },
  "Bihar:Loamy:neutral:Kharif": {
    topCrops: ["Maize", "Paddy", "Arhar"],
    primaryCrop: "Maize",
    confidence: 86,
    reason: "Bihar's alluvial loam with neutral pH has emerged as India's fastest-growing maize belt; Kosi-Mithila region yields 20+ quintals/acre with hybrid varieties, surpassing many traditional states.",
    yield: "16-20 quintals/acre",
    profit: "₹22,000-32,000/acre",
    duration: "85-95 days",
    fertilizer: "50kg N + 20kg P₂O₅ + 20kg K₂O per acre (N in 3 splits at sowing, knee-high, tasseling)",
    irrigation: "4-5 irrigations at germination, knee-high, silking, grain fill",
    source: "BAU Sabour, CIMMYT India hybrid variety program"
  },
  "West Bengal:Loamy:neutral:Kharif": {
    topCrops: ["Aman Rice", "Jute", "Maize"],
    primaryCrop: "Aman Rice",
    confidence: 92,
    reason: "West Bengal's deep alluvial loam of the Ganga delta with neutral pH and monsoon-fed hydrology is the natural home of Aman (long-duration) paddy — state produces 16 million tonnes annually.",
    yield: "18-24 quintals/acre",
    profit: "₹25,000-38,000/acre",
    duration: "140-150 days",
    fertilizer: "40kg N + 20kg P₂O₅ + 20kg K₂O per acre in 3 splits",
    irrigation: "Maintain 2-5 cm standing water during vegetative; drain 2 weeks before harvest",
    source: "BCKV Mohanpur, ICAR-NRRI Cuttack"
  },
  "West Bengal:Loamy:acidic:Kharif": {
    topCrops: ["Jute", "Rice", "Aus Paddy"],
    primaryCrop: "Jute",
    confidence: 89,
    reason: "Acidic alluvial loam of Murshidabad-Malda-Nadia belt with slightly lower pH 6.0-6.4 is the world's finest jute-growing region — WB produces 50% of global raw jute fiber.",
    yield: "18-24 quintals/acre (dry fiber)",
    profit: "₹28,000-40,000/acre",
    duration: "100-120 days",
    fertilizer: "40kg N + 20kg P₂O₅ + 20kg K₂O per acre",
    irrigation: "Waterlogged to moist conditions through growth; retting water management critical",
    source: "ICAR-NIRJAFT Barrackpore, West Bengal Jute Research Center"
  },
  "West Bengal:Loamy:neutral:Rabi": {
    topCrops: ["Potato", "Mustard", "Wheat"],
    primaryCrop: "Potato",
    confidence: 90,
    reason: "Hooghly-Burdwan alluvial loam with neutral pH and cool Rabi temperatures produces India's highest-quality table potato; West Bengal is the largest potato-producing state (11 million MT/year).",
    yield: "80-100 quintals/acre",
    profit: "₹55,000-85,000/acre",
    duration: "75-90 days",
    fertilizer: "60kg N + 40kg P₂O₅ + 40kg K₂O per acre",
    irrigation: "4-5 irrigations; critical at stolon initiation (30 DAS) and tuber bulking (60 DAS)",
    source: "ICAR-CPRI Shimla, Directorate of Agriculture West Bengal"
  },
  "Karnataka:Sandy Loam:acidic:Kharif": {
    topCrops: ["Ragi", "Groundnut", "Maize"],
    primaryCrop: "Ragi",
    confidence: 88,
    reason: "Karnataka's red sandy loam with acidic pH 5.6-6.4 is the classical Ragi (Finger Millet) belt — state grows 58% of India's ragi; crop is perfectly adapted to low-fertility acidic soils.",
    yield: "6-8 quintals/acre",
    profit: "₹15,000-22,000/acre",
    duration: "90-100 days",
    fertilizer: "24kg N + 16kg P₂O₅ + 16kg K₂O per acre",
    irrigation: "Mostly rain-fed; 1-2 supplementary irrigations in dry years (at tillering and grain fill)",
    source: "UAS Bangalore, ICAR-IISR recommendation"
  },
  "Karnataka:Sandy Loam:acidic:Rabi": {
    topCrops: ["Sunflower", "Chickpea", "Safflower"],
    primaryCrop: "Sunflower",
    confidence: 86,
    reason: "Karnataka's acidic red sandy loam in Dharwad-Bellary-Chitradurga zone is India's leading sunflower tract; acidic soils require sulfur correction but support high oil content (42-44%).",
    yield: "6-8 quintals/acre",
    profit: "₹30,000-40,000/acre",
    duration: "85-95 days",
    fertilizer: "30kg N + 20kg P₂O₅ + 16kg K₂O per acre + 20kg sulfur as gypsum",
    irrigation: "4-5 irrigations: pre-sowing, vegetative, bud initiation, flowering, seed filling",
    source: "ICAR-DRMR, UAS Dharwad"
  },
  "Karnataka:Sandy Loam:neutral:Kharif": {
    topCrops: ["Groundnut", "Soybean", "Cotton"],
    primaryCrop: "Groundnut",
    confidence: 84,
    reason: "Neutral-pH sandy loam of Karnataka's northern dry zone provides the free-draining, calcium-rich conditions groundnut requires for pod set — Kalaburagi-Yadgir belt is a prime groundnut cluster.",
    yield: "8-10 quintals/acre",
    profit: "₹35,000-50,000/acre",
    duration: "100-110 days",
    fertilizer: "8kg N + 20kg P₂O₅ + 16kg K₂O per acre + gypsum 200kg/acre at pegging (35-40 DAS)",
    irrigation: "4-6 irrigations using furrow method; avoid water stress at flowering and pod fill",
    source: "ICAR-NRCG Junagadh, UAS Dharwad"
  },
  "Tamil Nadu:Sandy Loam:acidic:Kharif": {
    topCrops: ["Paddy", "Groundnut", "Sesame"],
    primaryCrop: "Paddy",
    confidence: 90,
    reason: "Cauvery delta acidic sandy loam (pH 5.6-6.2) of Tamil Nadu is one of India's most intensively cultivated rice belts — Thanjavur, Tiruvarur, and Nagapattinam produce 3 crops/year under canal irrigation.",
    yield: "18-22 quintals/acre",
    profit: "₹28,000-40,000/acre",
    duration: "100-110 days",
    fertilizer: "48kg N + 20kg P₂O₅ + 20kg K₂O per acre (split: 50% basal, 25% active tillering, 25% panicle initiation)",
    irrigation: "Flood irrigation 5 cm depth; SRI method saves 30% water with 15% yield gain",
    source: "TNAU Coimbatore, ICAR-IRRI South Asia Hub"
  },
  "Tamil Nadu:Sandy Loam:neutral:Rabi": {
    topCrops: ["Groundnut", "Sunflower", "Maize"],
    primaryCrop: "Groundnut",
    confidence: 87,
    reason: "Neutral-pH sandy loam of Tamil Nadu's inland districts (Vellore, Villupuram, Tiruvannamalai) provides excellent drainage and aeration for groundnut root and pod development in Rabi.",
    yield: "7-9 quintals/acre",
    profit: "₹32,000-44,000/acre",
    duration: "100-105 days",
    fertilizer: "8kg N + 16kg P₂O₅ + 16kg K₂O per acre + gypsum 150kg/acre at pegging",
    irrigation: "4-5 furrow irrigations; water deficit at pod fill stage is critical to avoid",
    source: "TNAU Coimbatore, ICAR-NRCG"
  },
  "Tamil Nadu:Sandy Loam:acidic:Rabi": {
    topCrops: ["Blackgram", "Horsegram", "Sesame"],
    primaryCrop: "Blackgram",
    confidence: 83,
    reason: "Short-duration Blackgram (VBN-6, CO-6) thrives on acidic sandy loam in Tamil Nadu's interior during Rabi; it serves as an excellent crop after Kharif paddy, fixing nitrogen and improving soil health.",
    yield: "4-6 quintals/acre",
    profit: "₹20,000-32,000/acre",
    duration: "60-65 days",
    fertilizer: "8kg N + 24kg P₂O₅ + 12kg K₂O per acre + Rhizobium inoculation at sowing",
    irrigation: "3-4 irrigations (basal, flowering, pod development); excess moisture causes wilt",
    source: "TNAU Pulse Research Station Vamban"
  },
  "Gujarat:Clayey:alkaline:Kharif": {
    topCrops: ["Bt Cotton", "Groundnut", "Castor"],
    primaryCrop: "Bt Cotton",
    confidence: 91,
    reason: "Central Gujarat's black cotton alkaline soil (pH 7.5-8.2) is India's premier Bt cotton territory — Gujarat alone grows 28% of India's cotton and has the highest lint productivity in Asia.",
    yield: "5-8 quintals/acre (lint)",
    profit: "₹35,000-55,000/acre",
    duration: "160-180 days",
    fertilizer: "40kg N + 20kg P₂O₅ + 20kg K₂O per acre (N in 3 splits)",
    irrigation: "Drip irrigation preferred at 4-5L/plant/day; 8-10 irrigations total",
    source: "GAU Anand, ICAR-CICR Nagpur"
  },
  "Gujarat:Sandy:alkaline:Kharif": {
    topCrops: ["Groundnut", "Pearl Millet", "Sesame"],
    primaryCrop: "Groundnut",
    confidence: 92,
    reason: "Saurashtra's sandy alkaline soil (pH 7.5-8.0) is the birthplace of the famous bold-seeded Gujarat groundnut (JL-24, GG-20) — region commands a 30-50% price premium in global oilseed markets.",
    yield: "9-12 quintals/acre",
    profit: "₹45,000-65,000/acre",
    duration: "105-115 days",
    fertilizer: "10kg N + 20kg P₂O₅ + 20kg K₂O per acre + gypsum 200kg/acre at pegging (35 DAS)",
    irrigation: "5-7 irrigations critical at peg entry, pod development, and kernel filling",
    source: "GAU Junagadh, ICAR-NRCG recommendations"
  },
  "Gujarat:Clayey:neutral:Rabi": {
    topCrops: ["Wheat", "Chickpea", "Mustard"],
    primaryCrop: "Wheat",
    confidence: 84,
    reason: "Central Gujarat's neutral-pH black cotton soil supports Rabi wheat with shorter-duration varieties under canal/tube-well irrigation — North Gujarat wheat is a significant contributor to state FCI procurement.",
    yield: "15-20 quintals/acre",
    profit: "₹22,000-30,000/acre",
    duration: "105-115 days",
    fertilizer: "40kg N + 20kg P₂O₅ + 10kg K₂O per acre",
    irrigation: "3-4 irrigations (crown root initiation, tillering, grain filling)",
    source: "GAU Anand, ICAR-CIMMYT India"
  },
  "Rajasthan:Sandy:alkaline:Kharif": {
    topCrops: ["Pearl Millet (Bajra)", "Cluster Bean (Guar)", "Moth Bean"],
    primaryCrop: "Pearl Millet (Bajra)",
    confidence: 94,
    reason: "Rajasthan's arid sandy alkaline soil (pH 7.8-8.5) is uniquely suited to Pearl Millet — the most drought-tolerant cereal, capable of producing grain with only 200mm rainfall on sandy desert soils.",
    yield: "7-9 quintals/acre",
    profit: "₹15,000-20,000/acre",
    duration: "80-90 days",
    fertilizer: "20kg N + 12kg P₂O₅ per acre (light soils, split 50:50 at sowing and knee-high)",
    irrigation: "Mostly rain-fed; 1-2 supplementary irrigations if canal-access at vegetative + grain fill",
    source: "ICAR-AICPMIP, CAZRI Jodhpur, SKRAU Bikaner"
  },
  "Rajasthan:Sandy:alkaline:Rabi": {
    topCrops: ["Mustard", "Wheat", "Barley"],
    primaryCrop: "Mustard",
    confidence: 93,
    reason: "Rajasthan's dry sandy alkaline soil with cool Rabi winters produces 46% of India's mustard crop — the shallow-rooting mustard plant perfectly exploits the limited moisture stored in sandy profiles.",
    yield: "7-10 quintals/acre",
    profit: "₹25,000-40,000/acre",
    duration: "110-120 days",
    fertilizer: "30kg N + 16kg P₂O₅ + 8kg K₂O per acre + 1kg boron/acre (boron-deficient in sandy soils)",
    irrigation: "2-3 irrigations: pre-sowing, rosette stage (30 DAS), flowering (60 DAS)",
    source: "ICAR-DRMR Bharatpur, SKRAU Bikaner"
  },
  "Andhra Pradesh:Sandy Loam:acidic:Kharif": {
    topCrops: ["Paddy", "Maize", "Cotton"],
    primaryCrop: "Paddy",
    confidence: 91,
    reason: "Godavari-Krishna delta acidic sandy loam of AP produces the famous BPT-5204 (Samba Mahsuri) premium rice — the 'rice bowl' region exports to 50+ countries and commands 40% price premium.",
    yield: "20-24 quintals/acre",
    profit: "₹32,000-45,000/acre",
    duration: "130-145 days",
    fertilizer: "50kg N + 25kg P₂O₅ + 20kg K₂O per acre in 3 splits with zinc sulphate 10kg/acre",
    irrigation: "SRI method with alternate wetting/drying; 5 cm standing water at tillering",
    source: "ICAR-NRRI, ANGRAU Guntur"
  },
  "Andhra Pradesh:Sandy Loam:neutral:Rabi": {
    topCrops: ["Groundnut", "Sunflower", "Chickpea"],
    primaryCrop: "Groundnut",
    confidence: 88,
    reason: "Neutral sandy loam of Kurnool-Anantapur-Nellore belt (Rayalaseema) supports bold-seeded groundnut under residual soil moisture and supplementary well irrigation — AP is India's #2 groundnut state.",
    yield: "8-10 quintals/acre",
    profit: "₹38,000-50,000/acre",
    duration: "100-110 days",
    fertilizer: "10kg N + 20kg P₂O₅ + 20kg K₂O + gypsum 200kg/acre at 30 DAS pegging",
    irrigation: "5-6 furrow irrigations; critical at flowering and pod fill",
    source: "ICAR-NRCG Junagadh, ANGRAU"
  },
  "Andhra Pradesh:Sandy Loam:acidic:Rabi": {
    topCrops: ["Chili", "Tobacco", "Groundnut"],
    primaryCrop: "Chili",
    confidence: 86,
    reason: "Guntur district's acidic sandy loam is the global epicenter of chili production — 'Guntur Sannam' (S4 variety) is the world's most exported chili by volume; acidic pH enhances capsaicin production.",
    yield: "8-12 quintals/acre (dry chili)",
    profit: "₹48,000-90,000/acre",
    duration: "150-180 days",
    fertilizer: "40kg N + 30kg P₂O₅ + 30kg K₂O per acre with micronutrient spray at flowering",
    irrigation: "Drip irrigation preferred at 3L/plant/day; 8-10 irrigations in Rabi dry season",
    source: "ICAR-AICRP on Vegetables, ANGRAU Guntur"
  },
  "Telangana:Sandy Loam:acidic:Kharif": {
    topCrops: ["Cotton", "Paddy", "Maize"],
    primaryCrop: "Cotton",
    confidence: 87,
    reason: "Telangana's acidic red sandy loam (pH 5.8-6.4) in Warangal-Nalgonda-Karimnagar supports rain-fed cotton with low input costs; state has expanded from 1M to 2M+ hectares cotton area in a decade.",
    yield: "4-6 quintals/acre (lint)",
    profit: "₹25,000-38,000/acre",
    duration: "150-175 days",
    fertilizer: "36kg N + 18kg P₂O₅ + 18kg K₂O per acre + boron 1kg/acre at boll formation",
    irrigation: "Drip at 4L/plant/day if available; 8-10 flood irrigations otherwise",
    source: "ICAR-CICR Nagpur, PJTSAU Hyderabad"
  },
  "Telangana:Sandy Loam:neutral:Kharif": {
    topCrops: ["Soybean", "Maize", "Pigeon Pea"],
    primaryCrop: "Soybean",
    confidence: 83,
    reason: "Neutral-pH sandy loam in Adilabad-Nirmal-Mancherial belt of Telangana supports soybean expansion — the crop fits well in 90-day window between monsoon onset and withdrawal.",
    yield: "5-7 quintals/acre",
    profit: "₹18,000-28,000/acre",
    duration: "85-95 days",
    fertilizer: "8kg N + 20kg P₂O₅ + 16kg K₂O per acre + Rhizobium + PSB inoculation",
    irrigation: "2-3 supplementary irrigations at pod fill if monsoon deficit",
    source: "ICAR-IISR Indore, PJTSAU Hyderabad"
  },
  "Madhya Pradesh:Clayey:alkaline:Kharif": {
    topCrops: ["Soybean", "Cotton", "Pigeon Pea"],
    primaryCrop: "Soybean",
    confidence: 93,
    reason: "Malwa plateau's black cotton alkaline soil (pH 7.5-8.0) is India's undisputed soybean capital — MP produces 45% of national soybean output; JS-335 variety is perfectly adapted to alkaline vertisols.",
    yield: "7-10 quintals/acre",
    profit: "₹25,000-40,000/acre",
    duration: "90-100 days",
    fertilizer: "8kg N + 24kg P₂O₅ + 16kg K₂O per acre + 20kg sulfur (alkaline soils are S-deficient)",
    irrigation: "2-3 supplementary irrigations; waterlogging is fatal — ensure drainage furrows",
    source: "ICAR-IISR Indore, JNKVV Jabalpur"
  },
  "Madhya Pradesh:Clayey:neutral:Rabi": {
    topCrops: ["Chickpea", "Wheat", "Lentil"],
    primaryCrop: "Chickpea",
    confidence: 88,
    reason: "Neutral black cotton soil of MP's Sagar-Damoh-Vidisha belt provides ideal moisture retention and neutral pH for Chickpea (Gram) — MP is India's #1 chickpea state producing 5 million MT annually.",
    yield: "5-7 quintals/acre",
    profit: "₹22,000-34,000/acre",
    duration: "95-110 days",
    fertilizer: "8kg N + 24kg P₂O₅ + 16kg K₂O per acre + Rhizobium inoculation (no extra N needed after nodulation)",
    irrigation: "1-2 protective irrigations only (pre-sowing and pod formation); over-irrigation causes wilt",
    source: "ICAR-IIPR Kanpur, JNKVV Jabalpur"
  },
  "Himachal Pradesh:Sandy Clay Loam:acidic:Kharif": {
    topCrops: ["Potato", "Maize", "Ginger"],
    primaryCrop: "Potato",
    confidence: 91,
    reason: "HP's acidic sandy clay loam at 1200-2400m elevation with cool summers (15-22°C) produces certified seed potato — Kufri Jyoti and Kufri Giriraj grown here are foundation seed for plains potato growers.",
    yield: "90-110 quintals/acre",
    profit: "₹60,000-90,000/acre (seed potato at premium)",
    duration: "80-100 days",
    fertilizer: "60kg N + 40kg P₂O₅ + 60kg K₂O per acre (high K critical for tuber quality)",
    irrigation: "4-5 sprinkler irrigations; maintain even moisture for uniform tuber sizing",
    source: "ICAR-CPRI Shimla, HP Agriculture Department"
  },
  "Kerala:Gravelly Clay:acidic:Kharif": {
    topCrops: ["Paddy", "Tapioca", "Coconut"],
    primaryCrop: "Paddy",
    confidence: 82,
    reason: "Kerala's gravelly laterite clay with strong acidity (pH 4.8-5.6) supports traditional varieties in Palakkad-Wayanad; Pokkali variety adapted to acidic waterlogged soils is unique globally.",
    yield: "12-16 quintals/acre",
    profit: "₹20,000-30,000/acre",
    duration: "100-115 days",
    fertilizer: "32kg N + 16kg P₂O₅ + 24kg K₂O per acre + lime 400kg/acre to correct strong acidity",
    irrigation: "Rain-fed primarily; laterite water retention low — mulching essential in dry spells",
    source: "Kerala Agricultural University (KAU) Thrissur"
  },
};

export const DISEASE_TREATMENT_KB = {
  "Early Blight": {
    scientificName: "Alternaria solani",
    crops: ["Tomato", "Potato", "Brinjal"],
    symptoms: "Brown concentric ring lesions (target-board pattern) on lower/older leaves; yellow halo surrounds each lesion",
    causes: "Fungal infection, favoured by warm humid conditions 24-29°C above 85% humidity",
    weatherTrigger: "humidity > 85 && temperature >= 24",
    treatment: [
      "Remove and destroy all infected leaves immediately — do not compost infected material",
      "Spray Mancozeb 75WP at 2.5g/L water, thoroughly cover leaf undersides",
      "Follow with Copper Oxychloride (Blitox 50) at 3g/L after 7 days",
      "Apply systemic fungicide Iprodione 50WP at 2g/L for severe infections"
    ],
    urgency: "48 hours",
    prevention: "Maintain 45-60cm plant spacing, avoid overhead irrigation, mulch soil surface",
    organicOption: "Neem oil 3ml/L + Trichoderma viride 5g/L as preventive spray every 10 days",
    estimatedYieldLoss: "20-30% if untreated within 5 days",
    source: "ICAR-IARI Plant Pathology Division"
  },
  "Late Blight": {
    scientificName: "Phytophthora infestans",
    crops: ["Potato", "Tomato"],
    symptoms: "Water-soaked pale green patches on leaves turning brown-black; white mould on underside in humid conditions; tubers rot with copper-brown internal discoloration",
    causes: "Oomycete infection; epidemic in cool moist weather (15-20°C, humidity >90%); spreads at 1km/day under ideal conditions",
    weatherTrigger: "humidity > 90 && temperature <= 20",
    treatment: [
      "Spray Cymoxanil + Mancozeb (Curzate-M8) at 3g/L water immediately — highly systemic",
      "Apply Metalaxyl + Mancozeb (Ridomil Gold) at 2.5g/L as follow-up 7 days later",
      "Destroy all infected plant debris by burning — do not leave in field",
      "Harvest potatoes early if more than 25% foliage affected to save tubers"
    ],
    urgency: "24 hours",
    prevention: "Use certified disease-free seed, earthing up to protect tubers, avoid overhead irrigation",
    organicOption: "Copper hydroxide (Kocide 3000) at 3g/L — OMRI-listed copper fungicide effective as early preventive",
    estimatedYieldLoss: "50-100% if untreated during epidemic weather conditions",
    source: "ICAR-CPRI Shimla, National Potato Research Program"
  },
  "Powdery Mildew": {
    scientificName: "Erysiphe graminis / Sphaerotheca spp.",
    crops: ["Wheat", "Cucurbits", "Grapes", "Peas", "Chili"],
    symptoms: "White powdery coating on upper leaf surface; leaves yellow and die; grains shrivel in wheat",
    causes: "Fungal infection favoured by low humidity (40-70%) with warm days and cool nights; dry conditions spread spores rapidly",
    weatherTrigger: "humidity < 70 && temperature >= 20",
    treatment: [
      "Spray Sulphur 80WP (wettable sulphur) at 2g/L water — highly effective contact fungicide",
      "Apply Propiconazole 25EC at 1ml/L water as systemic control for severe infection",
      "Remove heavily infected leaves and burn them",
      "Repeat spray every 10-14 days until disease pressure subsides"
    ],
    urgency: "72 hours",
    prevention: "Ensure good air circulation, avoid nitrogen excess, plant resistant varieties",
    organicOption: "Baking soda (sodium bicarbonate) 5g/L + neem oil 3ml/L; or potassium bicarbonate 10g/L",
    estimatedYieldLoss: "15-25% in severe infections; up to 40% in wheat if at heading stage",
    source: "ICAR-IARI, DWR Karnal fungicide recommendations"
  },
  "Downy Mildew": {
    scientificName: "Sclerospora graminicola / Plasmopara viticola",
    crops: ["Pearl Millet", "Grapes", "Cucumbers", "Onion"],
    symptoms: "Downy white/grey growth on leaf underside; upper surface shows yellow angular spots; pearl millet shows 'green ear' disease (malformation)",
    causes: "Oomycete; thrives in cool moist conditions with overnight leaf wetness; spores need free water",
    weatherTrigger: "humidity > 80 && temperature >= 15",
    treatment: [
      "Remove and destroy all affected plants/parts immediately",
      "Spray Metalaxyl + Mancozeb (Ridomil MZ) at 2.5g/L — effective systemic",
      "Apply Fosetyl-Al (Aliette) at 2g/L for systemic protection for 3 weeks",
      "In vineyards, use copper-based sprays before symptom onset in wet years"
    ],
    urgency: "48 hours",
    prevention: "Treat seeds with Metalaxyl 35 SD at 6g/kg seed; use resistant/tolerant varieties (HHB-67 in bajra)",
    organicOption: "Copper sulphate 3g/L + slaked lime 3g/L (Bordeaux mixture 0.5%) as preventive spray",
    estimatedYieldLoss: "30-80% in pearl millet; 60-100% in susceptible grape varieties",
    source: "ICAR-AICPMIP, ICAR-NRC Grapes Pune"
  },
  "Fusarium Wilt": {
    scientificName: "Fusarium oxysporum f.sp.",
    crops: ["Tomato", "Cotton", "Chickpea", "Banana", "Watermelon"],
    symptoms: "One-sided yellowing of leaves; vascular browning visible when stem is cut longitudinally; plant wilts despite adequate soil moisture; older leaves fall",
    causes: "Soil-borne fungus; enters through roots; warm soil temperature (28-32°C) and high humidity favour infection; persists 20+ years in soil",
    weatherTrigger: "temperature >= 28 && humidity > 60",
    treatment: [
      "Remove and destroy infected plants with root ball — do not leave in field",
      "Drench soil with Carbendazim 50WP at 2g/L around healthy plants as preventive",
      "Apply Trichoderma viride / harzianum at 5g/kg soil as bio-control",
      "Treat seed with Thiram 75WP at 3g/kg + Carbendazim 50WP at 2g/kg before sowing"
    ],
    urgency: "Immediate removal required; no curative spray is 100% effective",
    prevention: "Use grafted tomato seedlings on resistant rootstock; long crop rotation (4 years); avoid excess nitrogen",
    organicOption: "Trichoderma viride 5g/L soil drench around root zone every 15 days as bio-control",
    estimatedYieldLoss: "40-100% in severely affected fields with no resistant variety",
    source: "ICAR-IARI, ICAR-NRCA Lucknow (banana wilt)"
  },
  "Bacterial Leaf Spot": {
    scientificName: "Xanthomonas campestris pv. vesicatoria",
    crops: ["Tomato", "Pepper", "Chili"],
    symptoms: "Small water-soaked spots turning brown/black with yellow halo on leaves; fruit develops raised scab-like spots; severe defoliation",
    causes: "Bacterial infection; spread by rain splash and insects; warm wet conditions (24-30°C, humidity >80%)",
    weatherTrigger: "humidity > 80 && temperature >= 24",
    treatment: [
      "Spray Copper Oxychloride 50WP at 3g/L water immediately — contact bactericide",
      "Apply Streptomycin sulphate 90% + Tetracycline hydrochloride 10% (Plantomycin) at 0.5g/L",
      "Remove heavily infected leaves and fruit",
      "Repeat copper spray after 7 days; rotate bactericides to prevent resistance"
    ],
    urgency: "48 hours",
    prevention: "Use certified disease-free transplants, avoid overhead irrigation, stake plants for airflow",
    organicOption: "Copper hydroxide at 2g/L + neem-based PGPR (Pseudomonas fluorescens 5g/L) as preventive",
    estimatedYieldLoss: "15-30% in moderate infection; 50%+ in severe wet-weather epidemics",
    source: "ICAR-IARI Vegetable Science Division"
  },
  "Yellow Mosaic Virus": {
    scientificName: "Mungbean Yellow Mosaic Virus (MYMV) / Geminiviridae",
    crops: ["Moong (Green Gram)", "Blackgram", "Soybean", "Cowpea"],
    symptoms: "Bright yellow patches alternating with green on leaves; leaves curl downward; plants stunted; pods malformed with few seeds",
    causes: "Gemini virus transmitted exclusively by whitefly (Bemisia tabaci); no plant-to-plant spread without vector",
    weatherTrigger: "temperature >= 30 && humidity < 60",
    treatment: [
      "Control whitefly vector immediately — spray Imidacloprid 17.8 SL at 0.5ml/L water",
      "Alternately spray Thiamethoxam 25WG at 0.3g/L to prevent insecticide resistance",
      "Remove and destroy all virus-infected plants to reduce inoculum source",
      "No curative treatment exists — vector control and roguing are the only options"
    ],
    urgency: "48 hours (control whitefly)",
    prevention: "Use virus-resistant varieties (SML-668 moong, KU-301 blackgram); sow early before peak whitefly season; reflective mulch repels whitefly",
    organicOption: "Neem oil 5ml/L + yellow sticky traps at 10/acre for whitefly monitoring and early control",
    estimatedYieldLoss: "40-100% if infection occurs at seedling stage",
    source: "ICAR-IIPR Kanpur, ICAR-IARI Pulse Improvement Program"
  },
  "Root Rot": {
    scientificName: "Rhizoctonia solani / Pythium aphanidermatum",
    crops: ["Chili", "Tomato", "Beans", "Cotton", "Groundnut"],
    symptoms: "Water-soaked brown/black discoloration at soil level; plant collapses suddenly; roots show brown cortex with white pith; small plants die within 24-48 hours",
    causes: "Soil-borne fungi; waterlogged poorly drained soil, excessive irrigation, soil compaction, high temperatures (28-35°C) trigger outbreak",
    weatherTrigger: "humidity > 85 && temperature >= 28",
    treatment: [
      "Immediately improve drainage — create outlet channels to remove standing water",
      "Drench with Metalaxyl + Mancozeb (Ridomil Gold) at 2g/L around root zone",
      "Apply Copper Oxychloride 3g/L soil drench as supplementary treatment",
      "Reduce irrigation frequency drastically until soil drains partially"
    ],
    urgency: "24 hours",
    prevention: "Raised bed planting for drainage; treat seed with Thiram + Carbendazim; avoid waterlogging; use fumigated nursery soil",
    organicOption: "Trichoderma harzianum 5g/kg soil mixed at transplanting stage as bio-control",
    estimatedYieldLoss: "20-50% stand loss in nursery; 15-40% in field outbreak",
    source: "ICAR-IARI, NHRDF Nashik nursery disease management"
  },
  "Anthracnose": {
    scientificName: "Colletotrichum gloeosporioides / C. truncatum",
    crops: ["Mango", "Chili", "Sorghum", "Beans", "Papaya"],
    symptoms: "Sunken black spots on fruit/pods; dark brown lesions on leaves with pink spore masses; fruit rot at ripening stage; grain discoloration in sorghum",
    causes: "Fungal infection; thrives in warm humid conditions (25-30°C, humidity >80%); spreads rapidly during rains",
    weatherTrigger: "humidity > 80 && temperature >= 25",
    treatment: [
      "Spray Mancozeb 75WP at 2.5g/L water, covering all plant surfaces",
      "Apply Carbendazim 50WP at 1g/L as systemic treatment for established infections",
      "In mango: Copper Oxychloride 3g/L at pre-flowering, flowering, and fruit set stages",
      "Harvest and destroy all mummified fruit from previous season"
    ],
    urgency: "48 hours",
    prevention: "Proper pruning for air circulation; avoid wetting foliage; post-harvest hot water treatment (52°C, 5 min) for mango",
    organicOption: "Neem oil 5ml/L + copper soap (copper octanoate) 3ml/L as weekly preventive spray",
    estimatedYieldLoss: "15-50% in mango; 30-60% in chili at advanced infection",
    source: "ICAR-CISH Lucknow (mango), ICAR-IARI Vegetable Division"
  },
  "Wheat Stem Rust": {
    scientificName: "Puccinia graminis f.sp. tritici",
    crops: ["Wheat", "Barley"],
    symptoms: "Brick-red/orange powdery pustules on stems, leaf sheaths, and glumes; severe lodging; grain shrivelling; leaves dry prematurely",
    causes: "Fungal; high-temperature rust (18-30°C, humidity >95%); race Ug99 (TTKS) is a global threat; spreads by wind hundreds of km",
    weatherTrigger: "humidity > 80 && temperature >= 18",
    treatment: [
      "Spray Propiconazole 25EC (Tilt) at 1ml/L water immediately — highly effective triazole",
      "Apply Tebuconazole 25.9EC at 1ml/L as alternative if propiconazole-resistant strains suspected",
      "Repeat spray after 14 days if disease pressure continues",
      "Monitor surrounding wheat fields — rust spreads via wind, alert neighbours"
    ],
    urgency: "48 hours",
    prevention: "Grow resistant varieties (HD-2967, PBW-343 replaced by Ug99-resistant K-307, DBW-17); treat seed with Carboxin + Thiram",
    organicOption: "No effective organic curative; prevention through resistant varieties is the only viable organic strategy",
    estimatedYieldLoss: "70-100% in susceptible varieties during epidemic years",
    source: "ICAR-Wheat Research Directorate Karnal, National Wheat Rust Monitoring Program"
  },
  "Wheat Yellow Rust": {
    scientificName: "Puccinia striiformis f.sp. tritici",
    crops: ["Wheat"],
    symptoms: "Yellow-orange powdery pustules arranged in stripes along leaf veins (stripe/yellow rust pattern); entire leaf yellows; cool-weather epidemic",
    causes: "Cool-weather rust (10-15°C optimal, humidity >95%); affects high-altitude and northern wheat areas in February-March",
    weatherTrigger: "humidity > 85 && temperature <= 15",
    treatment: [
      "Spray Propiconazole 25EC at 1ml/L immediately — most effective triazole for yellow rust",
      "Apply Tebuconazole 25EC at 1ml/L as alternative; both provide 3-week protection",
      "Two sprays at 14-day interval usually sufficient to stop epidemic",
      "Harvest early if infection is severe at heading stage to save grain weight"
    ],
    urgency: "48 hours — spreads 40x faster than brown rust in cold conditions",
    prevention: "Grow varieties with Yr10/Yr18 resistance genes (HD-2781, PBW-550); avoid late sowing (increases exposure)",
    organicOption: "No effective organic curative; Bordeaux mixture has limited contact efficacy only",
    estimatedYieldLoss: "40-70% in susceptible varieties; some varieties show complete crop failure",
    source: "ICAR-DWR Karnal, Borlaug Institute for South Asia (BISA)"
  },
  "Wheat Leaf Rust": {
    scientificName: "Puccinia triticina (recondita)",
    crops: ["Wheat"],
    symptoms: "Small orange-red pustules scattered on upper leaf surface (round/oval, not striped); leaf turns yellow; prevalent in irrigated wheat",
    causes: "Most common wheat disease in India; optimal at 15-22°C with >80% humidity; survives on green bridges between crops",
    weatherTrigger: "humidity > 80 && temperature >= 15",
    treatment: [
      "Spray Propiconazole 25EC at 1ml/L water — triazole is standard treatment",
      "Apply Flutriafol 12.5SC at 1ml/L as alternative systemic option",
      "One to two sprays at grain filling stage protect yield; at tillering is preventive"
    ],
    urgency: "5-7 days",
    prevention: "Use varieties with Lr34/Lr46 durable resistance (HD-2967, WH-1105); balanced nitrogen (excess N increases susceptibility)",
    organicOption: "Sulphur dust 20kg/acre for early mild infections; limited efficacy only",
    estimatedYieldLoss: "15-35% in susceptible varieties; up to 50% in warm irrigated conditions",
    source: "ICAR-DWR Karnal, All India Wheat and Barley Improvement Program"
  },
  "Brown Plant Hopper": {
    scientificName: "Nilaparvata lugens",
    crops: ["Paddy (Rice)"],
    symptoms: "Plants yellow and dry from base upward (hopperburn); circular patches of dead rice in field; heavy honeydew deposits on stems cause sooty mould; stem bases show feeding damage",
    causes: "Sucking insect pest; massive population build-up in dense canopy at >80% humidity; resistance develops quickly to single pesticide use",
    weatherTrigger: "humidity > 80 && temperature >= 25",
    treatment: [
      "Drain field immediately — Brown Plant Hopper cannot survive without standing water",
      "Spray Buprofezin 25SC at 1ml/L water — IGR that prevents nymph development",
      "Apply Thiamethoxam 25WG at 0.2g/L as fast knockdown for adult populations",
      "Spray at base of plant where hoppers feed; repeat after 7 days if population persists"
    ],
    urgency: "24 hours — hopperburn is irreversible once >25% plants affected",
    prevention: "Balanced nitrogen (excess N creates lush dense canopy that BPH loves); avoid prophylactic sprays that kill natural enemies; grow resistant varieties (IR-36, MTU-7029)",
    organicOption: "Neem oil 5ml/L + fish oil rosin soap 25ml/L at plant base; natural enemies (spiders, Cyrtorhinus) effective at low populations",
    estimatedYieldLoss: "30-100% in hopperburn patches; epidemic can cause complete crop loss",
    source: "ICAR-DRR Hyderabad, ICAR-NRRI Cuttack"
  },
  "American Bollworm": {
    scientificName: "Helicoverpa armigera",
    crops: ["Cotton", "Chili", "Tomato", "Chickpea", "Maize"],
    symptoms: "Circular holes bored in bolls/pods/fruit; green caterpillars with yellow head inside boll; frass (excreta) outside entry holes; shedding of squares and bolls",
    causes: "Polyphagous pest; moves between crops; high-temperature conditions (>30°C) accelerate egg-to-adult cycle to 25 days; highly insecticide-resistant globally",
    weatherTrigger: "temperature >= 28 && humidity < 65",
    treatment: [
      "Spray Chlorantraniliprole 18.5SC (Coragen) at 0.3ml/L — most effective, targets gut receptor differently",
      "Use Indoxacarb 14.5SC at 1ml/L as alternative diamide compound",
      "Install pheromone traps at 5/acre for monitoring; spray only when >5 moths/trap/day",
      "Do NOT spray pyrethroids or organophosphates — Helicoverpa is resistant globally"
    ],
    urgency: "48 hours from first larva/hole detection",
    prevention: "Install pheromone traps from seedling stage; spray NPV (Nuclear Polyhedrosis Virus) at 250LE/acre on first-instar larvae",
    organicOption: "Bt (Bacillus thuringiensis) kurstaki at 2g/L water — effective only on young larvae before they bore into boll",
    estimatedYieldLoss: "20-40% in cotton; 30-60% in chickpea at flowering stage",
    source: "ICAR-CICR Nagpur, Central Institute for Arid Horticulture"
  },
  "Onion Purple Blotch": {
    scientificName: "Alternaria porri",
    crops: ["Onion", "Garlic"],
    symptoms: "Small whitish lesions turning purple with yellow margin on leaves; lesions enlarge to form purple blotches; leaves die back from tip; neck rot of bulbs in storage",
    causes: "Fungal; thrives at 25-31°C with >80% humidity and prolonged leaf wetness (dew, rain, irrigation); severe in Kharif onion",
    weatherTrigger: "humidity > 80 && temperature >= 25",
    treatment: [
      "Spray Iprodione 50WP at 2g/L water — most effective for Alternaria genus",
      "Apply Mancozeb 75WP at 2.5g/L water as broad-spectrum protective fungicide",
      "Alternate with Propiconazole 25EC at 1ml/L every 10 days to prevent resistance",
      "Reduce overhead irrigation; switch to drip if possible"
    ],
    urgency: "48 hours",
    prevention: "Maintain 15cm row spacing for airflow; use drip irrigation; apply stable straw mulch",
    organicOption: "Garlic extract 5ml/L + neem oil 3ml/L as preventive spray from 30 DAS",
    estimatedYieldLoss: "15-35% in bulb yield; severe neck rot reduces storage life by 50%",
    source: "ICAR-NHRDF Nashik, Maharashtra Agriculture Department"
  },
  "Cercospora Leaf Spot": {
    scientificName: "Cercospora arachidicola / Cercospora personatum",
    crops: ["Groundnut", "Blackgram", "Cowpea", "Soybean"],
    symptoms: "Small brown spots with yellow halo on upper leaf surface (early leaf spot); dark brown spots without halo on underside (late leaf spot); severe defoliation weakens pod fill",
    causes: "Fungal; warm moist conditions (25-30°C, humidity >80%); 80-100 days into crop cycle, primarily at pod fill stage",
    weatherTrigger: "humidity > 80 && temperature >= 25",
    treatment: [
      "Spray Mancozeb 75WP at 2.5g/L water at first symptom appearance",
      "Apply Chlorothalonil 75WP at 2g/L as alternative at 7-14 day intervals",
      "Spray Carbendazim + Mancozeb combination for systemic + contact action",
      "Continue spraying at 15-day intervals through pod filling stage"
    ],
    urgency: "5-7 days",
    prevention: "Foliar spray of sulfur 80WP at 2g/L from 30 DAS as preventive; crop rotation breaks disease cycle",
    organicOption: "Neem oil 5ml/L + Pseudomonas fluorescens 5g/L spray every 15 days from 30 DAS",
    estimatedYieldLoss: "10-40% in pod yield through premature defoliation and reduced photosynthesis",
    source: "ICAR-NRCG Junagadh, ANGRAU Groundnut Research"
  },
  "Rice Blast": {
    scientificName: "Magnaporthe oryzae",
    crops: ["Paddy (Rice)"],
    symptoms: "Diamond-shaped lesions with grey-green centre and brown/orange margin on leaves (leaf blast); lesions at node (node blast); panicle neck infection causing white/empty panicles (neck blast)",
    causes: "Fungal; explosively epidemic in high nitrogen + high humidity + cool nights (20-25°C day, <18°C night); spreads by wind",
    weatherTrigger: "humidity > 90 && temperature >= 20",
    treatment: [
      "Spray Tricyclazole 75WP at 0.6g/L water — most effective systemic anti-blast fungicide",
      "Apply Isoprothiolane 40EC at 1.5ml/L as alternative melanin synthesis inhibitor",
      "Spray Carbendazim + Mancozeb at 2g/L as broad-spectrum backup",
      "At neck blast: spray at boot leaf + 50% heading stages for maximum protection"
    ],
    urgency: "24-48 hours — neck blast at heading is catastrophic; cannot be reversed",
    prevention: "Balanced nitrogen (split application; avoid excess); grow resistant varieties (Pusa Basmati 6, IR-64, MTU-7029); seed treatment with Tricyclazole 75WP at 2g/kg",
    organicOption: "Silicon (silica solubilizing bacteria) soil application strengthens cell walls; Pseudomonas fluorescens 5g/L foliar spray as preventive",
    estimatedYieldLoss: "10-30% in leaf blast; 60-100% in neck blast if untreated at heading",
    source: "ICAR-NRRI Cuttack, ICAR-DRR Hyderabad"
  },
  "Sheath Blight": {
    scientificName: "Rhizoctonia solani AG-1 IA",
    crops: ["Paddy (Rice)"],
    symptoms: "Oval/irregular greyish-green water-soaked lesions on leaf sheath near waterline; lesions turn straw-coloured with brown border; climbing to upper leaves in severe infection",
    causes: "Soil-borne fungus; sclerotia float and infect plants; dense tillering + high nitrogen + warm standing water (>30°C) explosive build-up",
    weatherTrigger: "humidity > 85 && temperature >= 28",
    treatment: [
      "Spray Hexaconazole 5EC at 2ml/L water — systemic triazole penetrates into sheath",
      "Apply Validamycin 3L at 2ml/L as alternative (biological origin, low resistance risk)",
      "Propiconazole 25EC at 1ml/L is also highly effective at early stages",
      "Drain field to reduce humidity at crop base level"
    ],
    urgency: "48 hours",
    prevention: "Reduce nitrogen rate by 20% if history of sheath blight; narrow row spacing (15x10cm); use bioagent Trichoderma at transplanting",
    organicOption: "Pseudomonas fluorescens 5g/L foliar spray + Trichoderma harzianum 5g/kg soil at transplanting",
    estimatedYieldLoss: "10-30% in grain weight; severe infections reduce harvest index by 40%",
    source: "ICAR-DRR Hyderabad, ICAR-NRRI Cuttack"
  },
  "Bacterial Blight": {
    scientificName: "Xanthomonas oryzae pv. oryzae",
    crops: ["Paddy (Rice)"],
    symptoms: "Water-soaked greyish yellow stripes on leaf margins; leaves wilt and dry from tip (blight phase); milky bacterial ooze from cut stem; kresek phase — seedling wilting at 2-3 weeks",
    causes: "Bacterial; enters through leaf margins and hydathodes; explosive in flood-prone kresek-phase; warm humid weather (25-34°C, >90% humidity) after cyclone/storm",
    weatherTrigger: "humidity > 90 && temperature >= 28",
    treatment: [
      "Spray Copper Oxychloride 50WP at 3g/L water — bactericide; spray immediately",
      "Apply Streptomycin sulphate + Tetracycline (Plantomycin) at 0.5g/L water",
      "Drain excess water from field; avoid nitrogen top-dressing during infection",
      "No systemic bactericide effective once kresek phase established — focus on remaining healthy plants"
    ],
    urgency: "24 hours",
    prevention: "Grow resistant varieties (IR-36, IR-64, MTU-7029); avoid urea excess; drain field 10 days after transplanting",
    organicOption: "Pseudomonas fluorescens 5g/L as preventive seed treatment + foliar spray at tillering",
    estimatedYieldLoss: "20-30% in blight phase; 40-70% when kresek phase hits seedlings",
    source: "ICAR-NRRI Cuttack, DRR Hyderabad"
  },
  "Cotton Leaf Curl Virus": {
    scientificName: "Cotton Leaf Curl Gemini Virus (CLCuV)",
    crops: ["Cotton"],
    symptoms: "Upward or downward curling of leaves; vein darkening and thickening; leaf lamina enation (outgrowth) on underside; stunted plant with few bolls",
    causes: "Geminivirus transmitted by whitefly (Bemisia tabaci); no plant-to-plant spread; epidemic in Punjab-Haryana-Rajasthan cotton belt when whitefly >5/leaf",
    weatherTrigger: "temperature >= 30 && humidity < 60",
    treatment: [
      "No curative treatment for virus; focus entirely on vector (whitefly) control",
      "Spray Imidacloprid 17.8SL at 0.5ml/L to knock down whitefly populations",
      "Alternate with Spiromesifen 22.9SC at 1ml/L (different mode of action to prevent resistance)",
      "Remove and burn severely infected plants to reduce inoculum in field"
    ],
    urgency: "48 hours (control vector)",
    prevention: "Grow CLCuV-tolerant/resistant varieties (MRC-7361, FH-142); install yellow sticky traps at 10/acre; avoid sowing adjacent to fields with known infection",
    organicOption: "Neem oil 5ml/L + reflective silver mulch to confuse whitefly movement; predatory beetles control early infestations",
    estimatedYieldLoss: "30-80% in susceptible varieties in Punjab-Haryana CLCuV belt",
    source: "ICAR-CICR Nagpur, CCS HAU Hisar (Punjab cotton CLCuV program)"
  },
  "Neck Blast": {
    scientificName: "Magnaporthe oryzae (panicle infection)",
    crops: ["Paddy (Rice)"],
    symptoms: "Infection at panicle neck causes neck to turn brown/black and bend (gooseneck symptom); panicles fail to fill — entirely white/empty spikelets; most economically devastating rice disease",
    causes: "Same fungal pathogen as leaf blast but infecting at neck — critical window is boot leaf stage to 50% heading; cool nights (<20°C) during heading",
    weatherTrigger: "humidity > 90 && temperature <= 22",
    treatment: [
      "Spray Tricyclazole 75WP at 0.6g/L at boot leaf stage PREVENTIVELY — before symptoms appear",
      "Second spray at 50% heading stage — two-spray protocol is standard in high-risk areas",
      "Isoprothiolane 40EC at 1.5ml/L is equally effective at boot + heading",
      "Once gooseneck visible, treatment reduces further spread only — affected grains cannot be recovered"
    ],
    urgency: "Preventive treatment at boot leaf stage is essential — no recovery after panicle infection",
    prevention: "Grow blast-resistant varieties (Pusa Basmati 6 has Pib resistance); avoid excessive nitrogen at booting; stagger sowing dates to avoid all crop at heading simultaneously",
    organicOption: "Silicon soil application (silica solubilizing bacteria 5g/kg soil) strengthens culm at heading stage — reduces neck blast severity by 30-40%",
    estimatedYieldLoss: "60-100% if untreated in epidemic year; single major cause of rice crop failure",
    source: "ICAR-DRR Hyderabad, ICAR-NRRI, International Rice Research Institute (IRRI)"
  },
  "Whitefly": {
    scientificName: "Bemisia tabaci (Biotype B / Biotype Q)",
    crops: ["Cotton", "Chili", "Tomato", "Okra", "Soybean"],
    symptoms: "White waxy adult flies on leaf undersides; yellowing leaves with sticky honeydew; black sooty mould on honeydew; plants stunted; virus transmission (MYMV, CLCuV, TYLCV)",
    causes: "Rapid population build-up in hot dry conditions (>30°C, <60% humidity); populations double every 7-10 days; highly insecticide-resistant",
    weatherTrigger: "temperature >= 30 && humidity < 60",
    treatment: [
      "Spray Spiromesifen 22.9SC at 1ml/L — kills eggs + nymphs; no resistance reported yet",
      "Apply Pyriproxyfen 10EC at 1ml/L (IGR — prevents moulting) for nymph control",
      "Alternate with Buprofezin 25SC at 1ml/L every 15 days to prevent resistance",
      "Install yellow sticky traps 5/acre for population monitoring and early warning"
    ],
    urgency: "48 hours — populations explode in 7-10 days at >30°C",
    prevention: "Install yellow sticky traps from transplanting; avoid broad-spectrum insecticides that kill natural enemies (Encarsia spp.); silver reflective mulch repels adults",
    organicOption: "Neem oil 5ml/L + insecticidal soap 5ml/L at leaf underside; parasitoid Encarsia formosa release at 5000/acre",
    estimatedYieldLoss: "Direct feeding: 10-20%; as virus vector: 40-100% in susceptible varieties",
    source: "ICAR-CICR Nagpur, ICAR-IIHR Bangalore"
  },
  "Aphids": {
    scientificName: "Aphis gossypii / Myzus persicae / Lipaphis erysimi",
    crops: ["Cotton", "Mustard", "Chili", "Potato", "Wheat"],
    symptoms: "Colonies of small soft insects on young shoots/leaves; sticky honeydew + black sooty mould; leaves curl downward; mustard pods malformed; stunted new growth",
    causes: "Explosive population build-up in cool dry conditions (15-25°C); parthenogenetic females produce 5-10 nymphs/day; natural enemies control population except in dry years",
    weatherTrigger: "humidity < 60 && temperature >= 15",
    treatment: [
      "Spray Imidacloprid 17.8SL at 0.5ml/L — highly systemic, moves through plant",
      "Apply Dimethoate 30EC at 2ml/L as contact + systemic option",
      "Spray Thiamethoxam 25WG at 0.3g/L for heavy populations on mustard",
      "Wash leaves with strong water jet to dislodge colonies on small infestations"
    ],
    urgency: "72 hours",
    prevention: "Install yellow sticky traps for monitoring; conserve natural enemies (ladybirds, lacewings); avoid excess nitrogen that produces lush susceptible tissue",
    organicOption: "Neem oil 5ml/L + insecticidal soap 5ml/L spray directly on colonies; lady beetle release",
    estimatedYieldLoss: "10-25% in cotton; 15-40% in mustard at pod fill; severe viral transmission in potato",
    source: "ICAR-NRRI, ICAR-DRMR Bharatpur"
  },
  "Thrips": {
    scientificName: "Thrips palmi / Scirtothrips dorsalis",
    crops: ["Chili", "Cotton", "Onion", "Grape", "Pomegranate"],
    symptoms: "Silvery-bronze streaking on leaves; upward leaf curling (chili curl disease caused by Chilli Leaf Curl Virus via thrips); distorted terminal shoots; onion leaves show silver patches",
    causes: "Hot dry conditions (>30°C, <50% humidity) trigger explosive build-up; 1mm insects hide in leaf folds/flower buds; chili thrips vector of leaf curl disease",
    weatherTrigger: "temperature >= 30 && humidity < 50",
    treatment: [
      "Spray Spinosad 45SC at 0.3ml/L — natural origin, highly effective on thrips",
      "Apply Fipronil 5SC at 1.5ml/L as alternative for heavy infestation",
      "Dimethoate 30EC at 2ml/L for onion thrips where Spinosad not available",
      "Spray in evening hours when thrips are active on leaf surfaces"
    ],
    urgency: "48 hours — early season thrips in chili transmit leaf curl virus permanently",
    prevention: "Install blue sticky traps at 10/acre (thrips are attracted to blue); spray Azadirachtin 0.03% at 2ml/L from seedling stage; silver mulch repels adult thrips",
    organicOption: "Neem oil 5ml/L + insecticidal soap 5ml/L; release predatory mite Amblyseius cucumeris at 50,000/acre in greenhouse",
    estimatedYieldLoss: "15-40% direct damage; 30-80% through virus transmission in chili",
    source: "ICAR-IIHR Bangalore, AICRP on Vegetables"
  },
  "Red Rot": {
    scientificName: "Colletotrichum falcatum",
    crops: ["Sugarcane"],
    symptoms: "Internal reddening of internode tissue with white patches when stalk is split; sour smell from infected stalks; leaves show drying from tip; plants die in patches (top rot)",
    causes: "Fungal; enters through wounds, borers, and soil; hot-humid conditions (28-32°C) + drought stress trigger latent infection; spreads through infected setts",
    weatherTrigger: "humidity > 80 && temperature >= 28",
    treatment: [
      "Remove and destroy all infected stalks from the field immediately",
      "Treat seed setts with Carbendazim 50WP at 1g/L + Thiram 75WP at 2g/L for 10 minutes before planting",
      "Drench soil around infected stools with Carbendazim 1g/L",
      "No effective spray cure once infection in stalk — roguing is primary management"
    ],
    urgency: "Immediate removal of affected stalks",
    prevention: "Use disease-free certified seed setts; hot water treatment at 50°C for 2 hours; grow resistant varieties (Co-0238, CoLk-94184)",
    organicOption: "Trichoderma viride 5g/kg seed sett treatment + soil application 2.5kg/acre at planting",
    estimatedYieldLoss: "10-50% in affected stools; complete loss of affected area in severe outbreak",
    source: "ICAR-SBI Lucknow, Sugarcane Breeding Institute Coimbatore"
  },
  "Alternaria Blight": {
    scientificName: "Alternaria brassicae / A. brassicicola",
    crops: ["Mustard", "Rapeseed", "Cabbage", "Cauliflower"],
    symptoms: "Circular dark brown spots with yellow halo on leaves; concentric rings visible; spots coalesce and leaves die; dark lesions on siliquae (pods) reduce seed filling",
    causes: "Fungal; warm moist conditions (25-30°C, humidity >80%); spreads rapidly during post-flowering rains in Rabi",
    weatherTrigger: "humidity > 80 && temperature >= 25",
    treatment: [
      "Spray Mancozeb 75WP at 2.5g/L water from first symptom appearance",
      "Apply Iprodione 50WP at 2g/L for systemic control at 10-day intervals",
      "Thiram 75WP at 3g/kg seed treatment prevents seed-borne infection",
      "Harvest promptly when 75% siliquae mature — delays increase pod infection"
    ],
    urgency: "48 hours",
    prevention: "Treat seed with Thiram + Carbendazim; maintain plant spacing 30x10cm; spray Mancozeb preventively at flowering in high-risk years",
    organicOption: "Garlic extract 5ml/L + neem oil 3ml/L as preventive spray at bud formation",
    estimatedYieldLoss: "15-30% in seed yield from siliquae infection; up to 40% in epidemic wet years",
    source: "ICAR-DRMR Bharatpur, NRCRM Rajasthan"
  },
  "Damping Off": {
    scientificName: "Pythium aphanidermatum / Rhizoctonia solani",
    crops: ["Chili", "Tomato", "Brinjal", "Onion", "Cauliflower"],
    symptoms: "Seedlings collapse at or below soil line (post-emergence damping-off); water-soaked lesion at base of stem; rapid spread to neighbouring seedlings; pre-emergence seed rot",
    causes: "Soil-borne fungi/oomycetes; waterlogged nursery beds, high temperature (28-35°C), high humidity; overcrowded seedlings",
    weatherTrigger: "humidity > 90 && temperature >= 28",
    treatment: [
      "Immediately drain nursery bed to reduce waterlogging",
      "Drench with Metalaxyl + Mancozeb at 2g/L around affected area to contain spread",
      "Remove and destroy all collapsed seedlings with root ball",
      "Reduce irrigation frequency drastically and improve drainage channels"
    ],
    urgency: "24 hours — epidemic spread in nursery within 48-72 hours",
    prevention: "Solarize nursery bed for 3 weeks before sowing; treat seed with Thiram 75WP 3g/kg + Carbendazim 2g/kg; raised bed nursery at 15cm height for drainage",
    organicOption: "Mix Trichoderma harzianum at 5g/kg soil before sowing; drench with Pseudomonas fluorescens 5g/L after emergence",
    estimatedYieldLoss: "20-100% nursery stand loss if untreated; transplanting delay cascades to main crop loss",
    source: "ICAR-IARI Vegetable Science, ICAR-NHRDF Nashik nursery management"
  },
};

export const REGIONAL_MARKET_KB = {
  "Maharashtra": {
    majorMandis: ["Lasalgaon APMC (Nashik)", "Pune APMC", "Navi Mumbai APMC", "Nagpur APMC", "Sangli APMC"],
    peakSellMonths: {
      "Onion": ["March", "April", "October", "November"],
      "Cotton": ["November", "December", "January"],
      "Soybean": ["October", "November"],
      "Grapes": ["February", "March", "April"]
    },
    exportDestinations: ["Dhaka Bangladesh", "Colombo Sri Lanka", "Dubai UAE", "Kathmandu Nepal"],
    govtSchemes: ["PM-KISAN", "Mahatma Phule Jan Arogya Yojana", "Magel Tyala Shet Tale", "Maharashtra Shetkari Sanman Yojana", "Namo Shetkari Mahsnman Nidhi"]
  },
  "Punjab": {
    majorMandis: ["Khanna APMC (Asia's largest grain mandi)", "Ludhiana APMC", "Amritsar APMC", "Bathinda APMC", "Moga APMC"],
    peakSellMonths: {
      "Wheat": ["April", "May"],
      "Basmati Rice": ["October", "November"],
      "Maize": ["September", "October"]
    },
    exportDestinations: ["Middle East (UAE, Saudi Arabia)", "Europe (UK, Germany)", "USA", "Iran"],
    govtSchemes: ["PM-KISAN", "PMFBY Crop Insurance", "Punjab Kisan Credit Card", "Paani Bachao Paisa Kamao (water-saving paddy incentive)", "MSP procurement at mandis"]
  },
  "Uttar Pradesh": {
    majorMandis: ["Hapur APMC (largest potato hub)", "Agra APMC", "Bareilly APMC", "Kanpur APMC", "Varanasi APMC"],
    peakSellMonths: {
      "Wheat": ["April", "May"],
      "Potato": ["February", "March"],
      "Sugarcane": ["November", "December", "January", "February"],
      "Mustard": ["March", "April"]
    },
    exportDestinations: ["Bangladesh (potato)", "Middle East (wheat flour)", "Southeast Asia"],
    govtSchemes: ["PM-KISAN", "UP Kisan Karj Mafi Yojana", "Mukhyamantri Kisan Sahayata Kosh", "PMFBY", "Sugarcane FRP payment guarantee"]
  },
  "Karnataka": {
    majorMandis: ["Tumkur APMC (coconut)", "Hubballi APMC", "Raichur APMC (paddy)", "Davangere APMC", "Belgaum APMC"],
    peakSellMonths: {
      "Ragi": ["October", "November"],
      "Groundnut": ["January", "February"],
      "Sunflower": ["March", "April"],
      "Paddy": ["November", "December"]
    },
    exportDestinations: ["Middle East (groundnut oil)", "Europe (coffee, spices)", "USA (specialty rice)"],
    govtSchemes: ["PM-KISAN", "Raita Siri Yojana", "Karnataka Raita Suraksha Hakku Sthapana", "PMFBY", "Krishibhagya (water harvesting)"]
  },
  "Tamil Nadu": {
    majorMandis: ["Koyambedu APMC Chennai", "Madurai APMC", "Salem APMC", "Tirupur APMC", "Tiruchirappalli APMC"],
    peakSellMonths: {
      "Paddy": ["January", "February", "August", "September"],
      "Groundnut": ["February", "March"],
      "Banana": ["Year-round", "peak October-December"],
      "Turmeric": ["February", "March", "April"]
    },
    exportDestinations: ["Sri Lanka", "Singapore", "Malaysia", "UAE", "UK (Tamil diaspora)"],
    govtSchemes: ["PM-KISAN", "Uzhavar Sandhai (direct farmer-consumer market)", "TN CM Drought Relief", "PMFBY", "Free electricity for agriculture"]
  },
  "Gujarat": {
    majorMandis: ["Rajkot APMC (groundnut hub)", "Surendranagar APMC (cotton)", "Surat APMC", "Ahmedabad APMC", "Junagadh APMC"],
    peakSellMonths: {
      "Groundnut": ["November", "December", "January"],
      "Cotton": ["November", "December", "January", "February"],
      "Wheat": ["March", "April"],
      "Castor": ["December", "January"]
    },
    exportDestinations: ["China (castor oil)", "EU (groundnut oil)", "Bangladesh (cotton)", "USA (Bt cotton technology)"],
    govtSchemes: ["PM-KISAN", "Mukhyamantri Kisan Sahay Yojana", "PMFBY", "Sujalam Sufalam Water Grid (micro-irrigation subsidy 50%)"]
  },
  "Rajasthan": {
    majorMandis: ["Jodhpur APMC (millet hub)", "Alwar APMC", "Bikaner APMC", "Jaipur APMC", "Bharatpur APMC (mustard)"],
    peakSellMonths: {
      "Mustard": ["March", "April"],
      "Pearl Millet": ["October", "November"],
      "Wheat": ["April", "May"],
      "Cumin": ["March", "April"]
    },
    exportDestinations: ["UAE (cumin, coriander)", "USA (organic mustard oil)", "Pakistan (border trade, informal)"],
    govtSchemes: ["PM-KISAN", "Rajasthan Mukhyamantri Krishak Sathi Yojana", "PMFBY", "Water storage subsidy (tanka/kund)", "Free solar pump scheme"]
  },
  "West Bengal": {
    majorMandis: ["Mecheda APMC (potato hub)", "Kolkata APMC (Vidyasagar)", "Siliguri APMC", "Bankura APMC", "Burdwan APMC (rice)"],
    peakSellMonths: {
      "Potato": ["February", "March"],
      "Aman Rice": ["November", "December"],
      "Jute": ["September", "October"],
      "Vegetables": ["November", "December", "January"]
    },
    exportDestinations: ["Bangladesh (potato, rice, vegetables)", "Bhutan (rice)", "Nepal (vegetables)"],
    govtSchemes: ["PM-KISAN", "Krishak Bandhu (state income support ₹10,000/acre/year)", "PMFBY", "Soilonomy card for soil testing"]
  },
  "Andhra Pradesh": {
    majorMandis: ["Kurnool APMC (cotton hub)", "Guntur APMC (chili hub, Asia's largest)", "Vijayawada APMC", "Tirupati APMC", "Nellore APMC"],
    peakSellMonths: {
      "Chili": ["February", "March", "April"],
      "Paddy": ["November", "December", "May", "June"],
      "Cotton": ["December", "January"],
      "Groundnut": ["January", "February"]
    },
    exportDestinations: ["China (dry chili)", "USA (paprika)", "Vietnam (cashew)", "Bangladesh (rice)"],
    govtSchemes: ["PM-KISAN", "YSR Rythu Bharosa (₹13,500/acre/year state support)", "YSR Free Crop Insurance", "PMFBY", "Jagananna Thodu (farmer business loans 0% interest)"]
  },
};

export const SOIL_AMENDMENT_KB = {
  "ph_too_low": {
    amendment: "Agricultural lime (Calcium Carbonate CaCO₃)",
    dose: "400-500kg per acre for every 0.5 pH unit increase needed",
    timing: "Apply 6-8 weeks before planting, incorporate to 15cm depth by ploughing",
    cost: "₹2,000-2,500 per acre"
  },
  "ph_too_high": {
    amendment: "Gypsum (Calcium Sulphate CaSO₄) or elemental Sulphur",
    dose: "200-300kg gypsum per acre; elemental sulphur 40-60kg/acre (slower acting)",
    timing: "Apply gypsum 4 weeks before sowing, incorporate 10cm; sulphur needs 6-8 weeks",
    cost: "₹1,800-2,200 per acre (gypsum); ₹3,000-4,000 per acre (sulphur)"
  },
  "nitrogen_low": {
    amendment: "Urea (46% N) or Ammonium Sulphate (21% N)",
    dose: "Urea: 50kg per acre as basal + 25kg top dress at 30 days + 25kg at 60 days",
    timing: "Split application: 50% at sowing, 25% at 30 days, 25% at 60 days (reduces leaching losses by 30%)",
    cost: "₹1,200-1,500 per acre"
  },
  "phosphorus_low": {
    amendment: "Single Superphosphate (SSP 16% P₂O₅) or DAP (46% P₂O₅)",
    dose: "SSP: 200-250kg/acre as basal; DAP: 40-50kg/acre as basal at sowing",
    timing: "Apply entire phosphorus dose as basal at sowing — P is immobile in soil, no split needed",
    cost: "₹2,500-3,000 per acre (SSP); ₹3,500-4,500 per acre (DAP)"
  },
  "potassium_low": {
    amendment: "Muriate of Potash (MOP, 60% K₂O) or Sulphate of Potash (SOP, 50% K₂O)",
    dose: "MOP: 50-75kg/acre; SOP preferred for chloride-sensitive crops (potato, fruits) at 60-80kg/acre",
    timing: "50% basal at sowing + 50% at knee-high or first top dress; SOP for quality improvement in fruits/potato",
    cost: "₹2,000-2,500 per acre (MOP); ₹3,500-4,500 per acre (SOP)"
  },
  "soc_low": {
    amendment: "Farm Yard Manure (FYM) or Vermicompost",
    dose: "FYM: 4-5 tonnes/acre annually; Vermicompost: 1-2 tonnes/acre; Green manure (Dhaincha/Sunhemp): 300kg seed/acre",
    timing: "Apply FYM 3-4 weeks before sowing, incorporate by ploughing; green manure incorporates 50-60 days after sowing",
    cost: "₹8,000-12,000 per acre (FYM purchased); ₹15,000-20,000 per acre (vermicompost); ₹3,000-4,000 per acre (green manure)"
  },
  "micronutrient_deficiency": {
    amendment: "Zinc Sulphate (ZnSO₄ 21%) + Boron (Borax 11%) soil application",
    dose: "Zinc Sulphate: 10-12kg/acre (soil); Boron: 2kg/acre (soil) or 0.5g/L foliar spray; Iron: FeSO₄ 20kg/acre in calcareous soils",
    timing: "Zinc and Boron as basal at sowing; foliar micronutrient spray at flowering + fruit set gives immediate correction",
    cost: "₹800-1,200 per acre (zinc + boron package); ₹500-700 per acre (foliar micronutrient spray)"
  },
};
