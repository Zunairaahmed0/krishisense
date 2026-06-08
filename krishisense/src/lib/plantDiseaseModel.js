const HF_API = "https://api-inference.huggingface.co/models";
const PRIMARY_MODEL = "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification";
const BACKUP_MODEL  = "ozair23/mobilenet_v2-1.0-plantnet300K";

const DISEASE_MAP = {
  "Apple___Apple_scab":                                      { name: "Apple Scab",              crop: "Apple",      severity: "medium"   },
  "Apple___Black_rot":                                       { name: "Black Rot",               crop: "Apple",      severity: "high"     },
  "Apple___Cedar_apple_rust":                                { name: "Cedar Apple Rust",        crop: "Apple",      severity: "medium"   },
  "Apple___healthy":                                         { name: "Healthy",                 crop: "Apple",      severity: "none"     },
  "Cherry_(including_sour)___Powdery_mildew":               { name: "Powdery Mildew",          crop: "Cherry",     severity: "medium"   },
  "Cherry_(including_sour)___healthy":                      { name: "Healthy",                 crop: "Cherry",     severity: "none"     },
  "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot":     { name: "Gray Leaf Spot",          crop: "Maize",      severity: "medium"   },
  "Corn_(maize)___Common_rust_":                            { name: "Common Rust",             crop: "Maize",      severity: "medium"   },
  "Corn_(maize)___Northern_Leaf_Blight":                    { name: "Northern Leaf Blight",    crop: "Maize",      severity: "high"     },
  "Corn_(maize)___healthy":                                 { name: "Healthy",                 crop: "Maize",      severity: "none"     },
  "Grape___Black_rot":                                      { name: "Black Rot",               crop: "Grape",      severity: "high"     },
  "Grape___Esca_(Black_Measles)":                           { name: "Black Measles",           crop: "Grape",      severity: "high"     },
  "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)":             { name: "Leaf Blight",             crop: "Grape",      severity: "medium"   },
  "Grape___healthy":                                        { name: "Healthy",                 crop: "Grape",      severity: "none"     },
  "Potato___Early_blight":                                  { name: "Early Blight",            crop: "Potato",     severity: "high"     },
  "Potato___Late_blight":                                   { name: "Late Blight",             crop: "Potato",     severity: "critical" },
  "Potato___healthy":                                       { name: "Healthy",                 crop: "Potato",     severity: "none"     },
  "Strawberry___Leaf_scorch":                               { name: "Leaf Scorch",             crop: "Strawberry", severity: "medium"   },
  "Strawberry___healthy":                                   { name: "Healthy",                 crop: "Strawberry", severity: "none"     },
  "Tomato___Bacterial_spot":                                { name: "Bacterial Spot",          crop: "Tomato",     severity: "high"     },
  "Tomato___Early_blight":                                  { name: "Early Blight",            crop: "Tomato",     severity: "high"     },
  "Tomato___Late_blight":                                   { name: "Late Blight",             crop: "Tomato",     severity: "critical" },
  "Tomato___Leaf_Mold":                                     { name: "Leaf Mold",               crop: "Tomato",     severity: "medium"   },
  "Tomato___Septoria_leaf_spot":                            { name: "Septoria Leaf Spot",      crop: "Tomato",     severity: "medium"   },
  "Tomato___Spider_mites Two-spotted_spider_mite":          { name: "Spider Mite Infestation", crop: "Tomato",     severity: "high"     },
  "Tomato___Target_Spot":                                   { name: "Target Spot",             crop: "Tomato",     severity: "medium"   },
  "Tomato___Tomato_Yellow_Leaf_Curl_Virus":                 { name: "Yellow Leaf Curl Virus",  crop: "Tomato",     severity: "critical" },
  "Tomato___Tomato_mosaic_virus":                           { name: "Mosaic Virus",            crop: "Tomato",     severity: "high"     },
  "Tomato___healthy":                                       { name: "Healthy",                 crop: "Tomato",     severity: "none"     },
  "Pepper,_bell___Bacterial_spot":                          { name: "Bacterial Spot",          crop: "Pepper",     severity: "high"     },
  "Pepper,_bell___healthy":                                 { name: "Healthy",                 crop: "Pepper",     severity: "none"     },
  "Soybean___healthy":                                      { name: "Healthy",                 crop: "Soybean",    severity: "none"     },
  "Squash___Powdery_mildew":                                { name: "Powdery Mildew",          crop: "Squash",     severity: "medium"   },
  "background":                                             { name: "No Plant Detected",       crop: "Unknown",    severity: "none"     },
};

const SEVERITY_PCT = { none: 0, low: 20, medium: 55, high: 75, critical: 92 };

const base64ToBlob = (base64, mimeType = "image/jpeg") => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
};

const callHuggingFace = async (imageBlob, model) => {
  const res = await fetch(`${HF_API}/${model}`, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: imageBlob,
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HF ${res.status}: ${await res.text()}`);
  return res.json();
};

export const classifyPlantDisease = async (imageBase64) => {
  const blob = base64ToBlob(imageBase64);
  let results = null;
  let modelUsed = PRIMARY_MODEL;

  try {
    results = await callHuggingFace(blob, PRIMARY_MODEL);
  } catch (e) {
    console.warn("Primary HF model failed, trying backup:", e.message);
    try {
      results = await callHuggingFace(blob, BACKUP_MODEL);
      modelUsed = BACKUP_MODEL;
    } catch (e2) {
      console.warn("Backup HF model failed:", e2.message);
      return null;
    }
  }

  if (!Array.isArray(results) || !results.length) return null;

  const top = results[0];
  const topScore = top.score || 0;
  if (topScore < 0.35) return null;

  const mapped = DISEASE_MAP[top.label] || {
    name: top.label.replace(/___/g, " — ").replace(/_/g, " "),
    crop: top.label.split("___")[0].replace(/_/g, " "),
    severity: "medium",
  };

  return {
    disease: mapped.name,
    crop: mapped.crop,
    confidence: Math.round(topScore * 100),
    severity: SEVERITY_PCT[mapped.severity] ?? 50,
    status: mapped.severity === "none" ? "healthy" : "diseased",
    rawLabel: top.label,
    modelUsed,
    topPredictions: results.slice(0, 3).map(r => ({
      label: DISEASE_MAP[r.label]?.name || r.label.replace(/___/g, " — ").replace(/_/g, " "),
      score: Math.round(r.score * 100),
    })),
    source: "PlantVillage Dataset (38 disease classes, 54,000+ training images)",
  };
};
