# KrishiSense — Project Context & Technical Reference

> Generated 2026-06-07 from source. Covers architecture, data flows, module API contracts, external services, auth strategy, voice pipeline, and operational notes.

---

## 1. Purpose

KrishiSense is a mobile-first React/Vite agritech PWA targeting Indian smallholder farmers. It combines real-time satellite data, AI crop diagnosis, live mandi price intelligence, multilingual voice assistance, and farm sustainability scoring — all accessible from a narrow 480 px mobile shell with offline-capable local fallbacks.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (PWA)                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ HomeTab  │  │ LandTab  │  │ GrowTab  │  │  SellTab     │   │
│  │          │  │ (Leaflet │  │ (Disease │  │  (Market     │   │
│  │ weather  │  │  Map +   │  │  AI +    │  │   AI Search  │   │
│  │ insights │  │  NDVI +  │  │  HF ML)  │  │   Grounding) │   │
│  │ notifs   │  │  Soil)   │  │          │  │              │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    App.jsx (Shell)                       │    │
│  │  Auth · Location/GPS · Weather · Scans · Demo Mode      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌───────────────────┐  ┌──────────────────────────────────┐    │
│  │ ExpertCallPanel   │  │ lib/                             │    │
│  │  AudioRecorder    │  │  ai.js · firebase.js · api.js   │    │
│  │  Groq Whisper STT │  │  ragEngine.js · ndvi.js         │    │
│  │  Gemini LLM       │  │  plantDiseaseModel.js           │    │
│  │  Sarvam TTS       │  │  groqWhisper.js · sarvamTTS.js  │    │
│  └───────────────────┘  └──────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
         │                              │
    VITE_BACKEND_URL             Direct fallback
    (production)                (VITE_GEMINI_KEY)
         │
┌────────▼──────────┐
│   Express Server   │
│   server/server.js │
│   /api/ai/chat    │◄──► Gemini API (4 models, waterfall)
│   /health         │
│   /api/auth/*     │  ← legacy JSON-file auth (Firebase preferred)
│   /api/scans      │
└───────────────────┘
         │
┌────────▼──────────────────────────────────────────────────────┐
│                     External Services                          │
│  Firebase Auth/Firestore  │  Gemini generativelanguage API    │
│  Open-Meteo (weather)     │  NASA MODIS (NDVI)               │
│  Nominatim (geocoding)    │  Hugging Face (PlantVillage ML)   │
│  SoilGrids (soil data)    │  Groq Whisper (STT)              │
│  Sarvam Bulbul v3 (TTS)  │  Google Search Grounding          │
└───────────────────────────────────────────────────────────────┘
```

---

## 3. Repository Layout

```
d:\Claude\Krishisense\
├── krishisense/               ← Vite/React frontend
│   ├── src/
│   │   ├── App.jsx            ← root shell: auth, GPS, weather, tab routing
│   │   ├── index.css
│   │   ├── assets/            ← logo.png, Bot.png, voice_bot.png, etc.
│   │   ├── components/
│   │   │   ├── advisor/
│   │   │   │   ├── ExpertCallPanel.jsx   ← full voice call UI
│   │   │   │   └── AdvisorPanel.jsx      ← text chat fallback
│   │   │   ├── auth/
│   │   │   │   └── AuthScreen.jsx
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx
│   │   │   │   └── BottomNav.jsx
│   │   │   └── ui/
│   │   │       ├── Toast.jsx / ErrorBoundary.jsx / MenuDrawer.jsx
│   │   │       ├── LocationModal.jsx / NotifPanel.jsx
│   │   │       └── Card.jsx / Badge.jsx / Spinner.jsx / etc.
│   │   ├── constants/
│   │   │   ├── theme.js       ← color palette (C object)
│   │   │   └── data.js        ← static price series, buyer cards
│   │   ├── data/
│   │   │   └── agriculturalKB.js  ← ICAR SOIL_CROP_MATRIX, DISEASE_TREATMENT_KB, etc.
│   │   ├── lib/
│   │   │   ├── ai.js              ← Gemini client (backend proxy + direct fallback)
│   │   │   ├── api.js             ← thin wrapper over firebase.js
│   │   │   ├── firebase.js        ← real Firebase SDK + localStorage emulator
│   │   │   ├── ragEngine.js       ← retrieval layer over agriculturalKB.js
│   │   │   ├── ndvi.js            ← NASA MODIS NDVI fetch + classify + fallback
│   │   │   ├── plantDiseaseModel.js ← Hugging Face PlantVillage classifier
│   │   │   ├── audioRecorder.js   ← MediaRecorder + Web Audio silence detection
│   │   │   ├── groqWhisper.js     ← Groq Whisper-large-v3 transcription
│   │   │   ├── sarvamTTS.js       ← Sarvam Bulbul v3 TTS + browser fallback
│   │   │   ├── voiceAI.js         ← legacy browser SpeechRecognition helpers
│   │   │   ├── demoMode.js        ← DemoCtx React context
│   │   │   ├── demoData.js        ← canned demo payloads
│   │   │   ├── speech.js          ← Web Speech API speak() helper
│   │   │   ├── utils.js           ← parseJSON, misc helpers
│   │   │   ├── sentinelHub.js     ← Sentinel-2 imagery (optional)
│   │   │   └── sentinel.js
│   │   └── tabs/
│   │       ├── HomeTab.jsx
│   │       ├── LandTab.jsx
│   │       ├── GrowTab.jsx
│   │       ├── SellTab.jsx
│   │       └── SustainTab.jsx
│   ├── .env / .env.example
│   ├── vite.config.js
│   ├── firebase.json / .firebaserc / dist/
│   └── package.json
│
└── server/                    ← Node ESM Express backend
    ├── server.js              ← Gemini proxy + legacy auth/scans
    ├── lib/
    │   ├── db.js              ← JSON-file user/session/scan store
    │   └── crypto.js          ← salt/hash/token helpers
    ├── .env / .env.example
    └── package.json
```

---

## 4. Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 19 |
| Build | Vite 8 |
| Mapping | Leaflet + React Leaflet |
| Charting | Recharts |
| Icons | Lucide React |
| Auth (production) | Firebase Auth (email/password + phone OTP) |
| Database (production) | Cloud Firestore |
| Auth/DB (no env key) | localStorage emulator (see §7) |
| AI (production) | Gemini 2.5 Flash Lite → 2.5 Flash → 1.5 Flash (waterfall) via backend proxy |
| AI (local dev) | Direct Gemini via `VITE_GEMINI_KEY` |
| Speech-to-Text | Groq Whisper Large v3 |
| Text-to-Speech | Sarvam Bulbul v3 → Web SpeechSynthesis fallback |
| Plant disease ML | Hugging Face (`linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification`) |
| Satellite NDVI | NASA MODIS MOD13Q1 (no key, 250 m, 16-day) |
| Soil data | SoilGrids REST API |
| Weather | Open-Meteo (no key) |
| Geocoding | Nominatim (no key) |
| Market search | Gemini Search Grounding (Google) |
| Backend | Node ESM, Express, CORS, dotenv |
| Hosting (frontend) | Firebase Hosting (dist/ present) |
| Hosting (backend) | Render (implied by CORS config) |

---

## 5. Environment Variables

### Frontend — `krishisense/.env`

| Variable | Purpose | Required |
|---|---|---|
| `VITE_BACKEND_URL` | Express server URL (e.g. `http://localhost:5000`). Leave empty for direct Gemini mode. | No |
| `VITE_GEMINI_KEY` | Browser-side Gemini key — local dev only, never use in production. | No |
| `VITE_FIREBASE_API_KEY` | Enables real Firebase. Absent → localStorage emulator. | No |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase project auth domain | Only with Firebase |
| `VITE_FIREBASE_PROJECT_ID` | Firestore project ID | Only with Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Only with Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID | Only with Firebase |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Only with Firebase |
| `VITE_GROQ_KEY` | Groq API key for Whisper transcription | Voice call only |
| `VITE_SARVAM_KEY` | Sarvam API key for Bulbul v3 TTS | Voice call only |

### Backend — `server/.env`

| Variable | Purpose | Required |
|---|---|---|
| `PORT` | Express port (default 5000) | No |
| `GEMINI_API_KEY` | Server-side Gemini key (never exposed to browser) | Yes (prod) |
| `FRONTEND_URL` | Comma-separated allowed CORS origins | Yes (prod) |

---

## 6. Module Reference

### `src/lib/ai.js` — Gemini Client

```
askAI(content, system?, enableSearch?) → Promise<string>
```

**Routing logic:**
1. If `VITE_BACKEND_URL` → POST `/api/ai/chat` (30 s timeout)
2. If backend fails AND `VITE_GEMINI_KEY` → direct Gemini API
3. If `VITE_BACKEND_URL` absent → direct Gemini API

`content` accepts a plain string OR a `[{type:"text"|"image", source:{...}}]` array for multimodal (vision) requests.

**Backend proxy** (`server/server.js /api/ai/chat`):
- Rate limit: 20 req/min per IP (in-memory bucket, no Redis)
- Gemini model waterfall: `gemini-2.5-flash-lite` → `gemini-2.5-flash` → `gemini-1.5-flash` → `gemini-1.5-flash-latest`
- Strips markdown bold (`**`) for voice-safe output
- Returns `{ text, model }` on success, `502` if all models fail

---

### `src/lib/firebase.js` — Auth & Persistence Layer

Detects `VITE_FIREBASE_API_KEY` at module load. If present, initializes the real Firebase SDK. If absent, builds a localStorage-backed emulator with the same API surface.

**Exported object:** `firebaseCore`

| Method | Real Firebase | Emulated (no key) |
|---|---|---|
| `registerUser(email, fullName, password)` | `createUserWithEmailAndPassword` + Firestore doc | Push to `krishi_local_users`, `triggerAuthStateChange` |
| `loginWithEmail(email, password)` | `signInWithEmailAndPassword` | Find in local users, compare plain password |
| `sendPhoneOTP(phone, recaptchaId)` | `RecaptchaVerifier` + `signInWithPhoneNumber` | Random 6-digit code via `alert()`, confirm by matching |
| `saveScanRecord(type, data)` | `addDoc(scans)` | Prepend to `krishi_local_scans` |
| `fetchUserScans()` | Firestore query + client-side sort | Filter `krishi_local_scans` by uid |
| `deleteScanRecord(id)` | `deleteDoc` | Filter out from localStorage |
| `updateUserProfile(uid, updates)` | `updateDoc` | Update `krishi_local_users` + `krishi_active_session` |
| `logoutUser()` | `signOut` | `triggerAuthStateChange(null)` |

**localStorage keys:**
- `krishi_local_users` — array of user profiles (with plaintext password in emulated mode)
- `krishi_local_scans` — array of scan records
- `krishi_active_session` — active user profile object

**Warning:** The emulated mode stores passwords in plaintext in localStorage. This is intentional for zero-dependency local development only. Never deploy without `VITE_FIREBASE_API_KEY` in production.

---

### `src/lib/api.js` — Frontend API Facade

Thin wrapper over `firebaseCore`. All tabs and `App.jsx` use `api.*` exclusively.

```js
api.login(email, password)
api.register(email, fullName, password)
api.sendPhoneOTP(phone, recaptchaContainerId)
api.getMe()           // onAuthStateChanged → Firestore profile lookup
api.logout()
api.saveScan(type, data)
api.getScans()
api.deleteScan(scanId)
api.updateProfile(uid, updates)
```

---

### `src/lib/ragEngine.js` — Agricultural Knowledge Retrieval

Retrieval layer over `src/data/agriculturalKB.js`.

| Function | Input | Output |
|---|---|---|
| `getCropContext(soil, loc)` | soil object + location | ICAR reference string for Gemini prompt |
| `getDiseaseContext(diseaseName)` | disease name string | Verified treatment protocol string |
| `getDiseaseEntry(diseaseName)` | disease name | KB entry object (exact or partial match) |
| `getSoilAmendmentContext(soil)` | soil object | Amendment list string (pH, N, SOC checks) |
| `buildCropRAGContext(soil, loc, ndvi)` | all three | Combined string for LandTab Gemini prompt |
| `isDiseaseWeatherMatch(disease, weather)` | disease + weather | boolean — weather risk trigger via `new Function()` |
| `getCurrentSeason()` | — | `"Kharif"` / `"Rabi"` / `"Zaid"` by month |

`SOIL_CROP_MATRIX` keys follow `"{state}:{texture}:{phRange}:{season}"`. The engine tries 9 progressively broader fallback keys before returning `""`.

---

### `src/lib/ndvi.js` — NASA MODIS NDVI

Uses NASA ORNL MODIS REST API (no key required):

1. `GET /MOD13Q1/dates?latitude=&longitude=` → available observation dates
2. `GET /MOD13Q1/subset?...&band=250m_16_days_NDVI&kmAboveBelow=0` → pixel values
3. Scales raw integers × 0.0001 (MODIS scale factor)
4. Fail → realistic mock data (0.48–0.70 range)

**`classifyNDVI(val)` thresholds:**

| NDVI | Label | Color |
|---|---|---|
| ≥ 0.70 | Excellent | `#1B5E20` |
| ≥ 0.50 | Good | `#388E3C` |
| ≥ 0.30 | Moderate | `#F57C00` |
| ≥ 0.10 | Stressed | `#C62828` |
| < 0.10 | Bare / Water | `#9E9E9E` |

---

### `src/lib/plantDiseaseModel.js` — Hugging Face Plant Disease Classifier

**Models (primary → backup fallback):**
- `linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification`
- `ozair23/mobilenet_v2-1.0-plantnet300K`

Sends `application/octet-stream` image blob converted from base64. Minimum confidence threshold: `0.35`. Returns `{ disease, crop, confidence, severity, topPredictions[3], status, rawLabel, modelUsed }`.

**DISEASE_MAP** covers 38 PlantVillage classes: Apple, Cherry, Corn, Grape, Potato, Strawberry, Tomato, Pepper, Soybean, Squash. Severity levels: `none | low | medium | high | critical` → numeric `{0, 20, 55, 75, 92}`.

---

### `src/lib/audioRecorder.js` — Silence-Detecting MediaRecorder

`AudioRecorder({ silenceMs: 1800, silenceThreshold: 0.012 })`

**`start()` → Promise\<Blob\>** — auto-resolves after 1800 ms RMS silence < 0.012. 600 ms startup grace period prevents false-positive early stops. Uses `requestAnimationFrame` loop for silence polling.

**`getLevel()` → 0–1** — live RMS for waveform visualization bars.

Mime type priority: `audio/webm;codecs=opus` → `audio/webm` → `audio/ogg;codecs=opus` → `audio/mp4`.

---

### `src/lib/groqWhisper.js` — Groq Whisper Transcription

Sends `multipart/form-data` to `https://api.groq.com/openai/v1/audio/transcriptions`:
- Model: `whisper-large-v3`, `response_format: verbose_json`, 20 s timeout
- Returns `{ transcript, langInfo: LANG_MAP[detected] }`

Falls back to Hindi if `VITE_GROQ_KEY` absent or request fails.

**Language → Sarvam speaker mapping (`LANG_MAP`):**

| Code | Language | Speaker |
|---|---|---|
| hi | Hindi | shubh |
| mr | Marathi | kavya |
| te | Telugu | rahul |
| ta | Tamil | priya |
| kn | Kannada | aditya |
| gu | Gujarati | simran |
| bn | Bengali | roopa |
| pa | Punjabi | shubh |
| ml | Malayalam | kavya |
| en | English (IN) | neha |

---

### `src/lib/sarvamTTS.js` — Sarvam Bulbul v3 TTS

`speakText(text, langCode, speaker, onStart, onEnd)` — main entry point.

**Pipeline:**
1. `cancelAllSpeech()` — stops in-flight audio or SpeechSynthesis
2. 80 ms pause for pipeline to clear
3. `speakWithSarvam()` — POST `https://api.sarvam.ai/text-to-speech`
   - Model: `bulbul:v3`, pace: `0.92`, sample rate: 24000
   - Text chunked at 450 chars on sentence boundaries (`[.!?।]+`)
   - WAV chunks played sequentially via `Audio()` API
4. If Sarvam fails or key absent → `speakWithBrowser()` (Web SpeechSynthesis, `rate:0.88 pitch:1.05`)

---

## 7. Authentication Strategy

### Production (Firebase)

```
User → email/password → Firebase Auth → Firestore "users" doc
                ↓
     onAuthStateChanged → api.getMe() → profile object
```

Phone OTP uses `RecaptchaVerifier` (invisible) + `signInWithPhoneNumber`.

### Local Dev / No Firebase Key (Emulator)

```
User → email/password → localStorage "krishi_local_users" array
                ↓
     triggerAuthStateChange → in-memory authInstance.currentUser
```

OTP emulation shows a browser `alert()` with the 6-digit code (`activeSimulatedOTP` — single global slot, one active OTP at a time).

---

## 8. Data Flows

### 8.1 Location & Weather

`App.jsx` runs `navigator.geolocation.watchPosition`:
- Reverse geocodes with Nominatim if coords change by > 0.01°
- Refreshes Open-Meteo weather if > 10 min elapsed or > 0.01° change
- Manual location (via `LocationModal`) sets `isManualLoc=true`, suspending GPS updates
- `handleResetToGPS()` clears manual flag and calls `getCurrentPosition`

Open-Meteo fields requested: `temperature_2m`, `precipitation`, `windspeed_10m`, `relative_humidity_2m`, `weathercode` (current); `temperature_2m_max/min`, `precipitation_sum`, `precipitation_probability_max`, `weathercode` (daily, 7 days).

### 8.2 AI Calls

All AI calls go through `askAI()` in `src/lib/ai.js`:

```
Tab → askAI(prompt, system?, enableSearch?)
         ↓
   BACKEND_URL set? → POST /api/ai/chat → Gemini (server-side key)
         ↓ (fail or absent)
   GEMINI_KEY set? → Direct Gemini API
         ↓ (fail)
   Return ""
```

JSON responses parsed with `parseJSON()` which strips ` ```json ` fences before `JSON.parse`.

### 8.3 Land Analysis (LandTab)

```
GPS coords
  ├─→ SoilGrids API → { ph, n, soc, texture, ... }
  │      └─ fail → regional estimation fallback
  ├─→ NASA MODIS → NDVI value + trend
  │      └─ fail → realistic mock (0.48–0.70)
  ├─→ ragEngine.buildCropRAGContext(soil, loc) → ICAR reference text
  └─→ askAI(combined prompt) → JSON { crop, confidence, alternatives[], rationale }
         └─ fail → rule-based fallback from agriculturalKB
```

Soil report saved via `api.saveScan("soil", { soil, rec, ndvi, loc })`.

### 8.4 Crop Disease Diagnosis (GrowTab)

```
User uploads / captures leaf image (base64)
  ↓
classifyPlantDisease(base64) → Hugging Face inference
  ├─ primary: linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification
  └─ backup:  ozair23/mobilenet_v2-1.0-plantnet300K
  ↓
askAI([image, text], "Return ONLY valid JSON")
  → Gemini Vision confirms + enriches diagnosis
  → { disease, scientific, crop, severity, treatment[], urgency, prevention }
  ↓
ragEngine.getDiseaseEntry(disease) → DISEASE_TREATMENT_KB enrichment
ragEngine.isDiseaseWeatherMatch(disease, weather) → weather risk boolean
  ↓
Display result + optional speak() + api.saveScan("leaf", {...})
```

### 8.5 Market Intelligence (SellTab)

```
Selected crop (default: Onion)
  ↓
askAI(prompt, system, enableSearch=true)
  → Gemini Search Grounding → live mandi prices near user state/city
  → JSON { latestPrice, trend%, mandis[], buyers[], recommendation }
  ↓
  fail → cache from localStorage "ks_last_market"
  fail → static fallback from constants/data.js PRICES[crop]
```

Fallback prices are scaled from the static series to preserve relative realism.

### 8.6 Voice Call (ExpertCallPanel)

```
Panel opens → buildGreeting(lang, loc, weather) → doSpeak(greeting, lang)
     ↓
startRecording() → AudioRecorder.start() → Promise<Blob>
     ↓ (silence detected after 1800 ms)
transcribeWithGroq(blob) → { transcript, langInfo }
     ↓
Hinglish detection:
  /[ऀ-ॿ]/.test(t) && /[a-zA-Z]{2,}/.test(t) && Whisper said "hi"|"en"
     ↓
askAI(last-20-turns history + transcript, systemPrompt)
  systemPrompt: location, weather, langRule, "2-3 sentences max, no markdown"
     ↓
doSpeak(reply, lang) → speakText() → Sarvam Bulbul v3 → browser TTS fallback
     ↓
startRecording() ← loop continues until user ends call
```

Conversation history held in `historyRef.current` (ref, not state) to avoid re-renders. Max 20 turns kept.

### 8.7 Notifications

`generateNotifications()` in `App.jsx` runs once per session (guarded by `notifGeneratedRef`):
1. Rain prob > 60% → rain alert (urgent if > 80%)
2. Max temp > 37°C → heat advisory
3. Rain prob < 30% → irrigation reminder
4. Last soil scan with recommendation → crop card
5. Market intelligence CTA
6. AI advisory: `askAI(weather+soil context → JSON {icon,title,body,type})`

---

## 9. Voice Language Detection (Dual-Mode)

### Groq Whisper (ExpertCallPanel)
Whisper returns `language` field. Panel runs additional Hinglish detection:
- Devanagari chars (`/[ऀ-ॿ]/`) AND Latin words (`/[a-zA-Z]{2,}/`) AND Whisper said `"hi"` or `"en"` → Hinglish
- Hinglish TTS forced to `hi-IN / shubh` (best handles mixed script)

### Browser SpeechRecognition (voiceAI.js / AdvisorPanel)
`detectLanguage(text)` uses Unicode range regex for 8 scripts. Devanagari disambiguation uses keyword scoring (Marathi-specific words, `ळ` character unique to Marathi, phrase tiebreakers).

### State-Based Default
`getLangFromState(state)` maps GPS-detected state → language code as initial default before any speech.

---

## 10. Fallback & Resilience Matrix

| Feature | Primary | First Fallback | Second Fallback |
|---|---|---|---|
| AI responses | Backend proxy → Gemini | Direct Gemini (`VITE_GEMINI_KEY`) | Empty string `""` |
| Auth | Firebase Auth + Firestore | localStorage emulator | — |
| Location | GPS `watchPosition` | Manual entry (`LocationModal`) | — |
| Geocoding | Nominatim reverse | `"Your Farm"` / `"Current location"` | — |
| Weather | Open-Meteo | `null` (tabs degrade gracefully) | — |
| NDVI | NASA MODIS REST | Realistic mock (0.48–0.70) | — |
| Soil data | SoilGrids API | Regional estimation by state | — |
| Disease ML | HF primary model | HF backup model | Skip pre-classification |
| Crop recommendation | Gemini JSON | Rule-based from agriculturalKB | Static message |
| Market data | Gemini Search Grounding | `ks_last_market` localStorage | `constants/data.js` PRICES |
| TTS | Sarvam Bulbul v3 | Web SpeechSynthesis API | Silent (no crash) |
| STT | Groq Whisper | (none — loop skips < 1 KB blobs) | — |

---

## 11. Global State Architecture

All state lives in `App.jsx` and flows down as props. No Redux or Zustand.

| State | Type | Notes |
|---|---|---|
| `user` | object\|null | null until auth resolves |
| `tab` | string | `"home"` \| `"land"` \| `"grow"` \| `"sell"` \| `"sustain"` |
| `loc` | object\|null | `{ lat, lon, accuracy, name, state, country, updatedAt, isManual? }` |
| `weather` | object\|null | Raw Open-Meteo API response |
| `scans` | array | Fetched on login, refreshed after save/delete via `fetchScans()` |
| `notifications` | array | Generated once per session from weather + scans |
| `demoMode` | boolean | `DemoCtx` provider wraps entire app |
| `backendAvailable` | boolean | Health-checked on mount; shows banner if offline |
| `lang` | string | `"en"` \| `"hi"` \| `"mr"` — UI language selector |
| `voiceOn` | boolean | Toggles auto-speak in tabs |
| `isManualLoc` | boolean | Suppresses GPS updates when manual location set |

---

## 12. Demo Mode

Triggered by tapping the logo 5× within 900 ms (`demoTapRef` + 900 ms debounce timer).

`useDemoMode()` hook returns `demoMode` boolean. When true each tab skips real API calls and injects from `src/lib/demoData.js`:

| Export | Used In |
|---|---|
| `DEMO_SOIL_SCAN` | LandTab |
| `DEMO_DISEASE` | GrowTab |
| `DEMO_MARKET` | SellTab |

Toggle fires a `showToast` confirming mode change.

---

## 13. Design Patterns & Conventions

- **Inline styles throughout** — no CSS modules or Tailwind. All colors from `constants/theme.js` `C` object (e.g. `C.primary`, `C.p2`, `C.tint`).
- **`parseJSON(raw)`** — strips ` ```json ` fences, then `JSON.parse`. Used everywhere Gemini returns JSON.
- **`ErrorBoundary`** wraps each tab content. Tab `key` changes force fresh boundary per navigation.
- **Toast** system: `useToast()` hook + global `<Toast />` singleton. `showToast(message, type)`.
- **480 px shell** — `maxWidth: 480, margin: "0 auto"` on root div. Design and QA at mobile widths first.
- **Non-ASCII strings** — Devanagari, Tamil, Telugu, emoji throughout. Always edit in UTF-8; do not run encoding conversions on source files.
- **Image imports** — all assets imported at top of `App.jsx` and passed as props to child components. No `public/` folder usage.
- **No comments on what code does** — only non-obvious invariants and workaround notes exist.

---

## 14. Security Notes

- **Gemini key never in browser bundle** when `VITE_BACKEND_URL` is set. All production AI calls route through the Express proxy.
- **CORS**: server allows `localhost:5173`, `localhost:4173`, and `FRONTEND_URL` env var (comma-separated). All other origins rejected with `403`.
- **Rate limiting**: in-memory bucket, 20 req/60s per IP for `/api/ai/chat`. Auth routes: 5/60s (register), 10/60s (login). Buckets auto-purge every 5 min.
- **Emulated auth stores plaintext passwords** in localStorage — local dev only, never production.
- **No `helmet`** or HTTPS enforcement in Express. Render/hosting layer handles TLS.
- **`isDiseaseWeatherMatch`** uses `new Function()` to evaluate `weatherTrigger` expressions from the internal KB. The KB is not user-controlled data — do not expose this path to external input.

---

## 15. Run & Build

### Local (full stack)

```bash
# Terminal 1 — Backend
cd server
npm install
cp .env.example .env   # add GEMINI_API_KEY
npm run dev            # nodemon → http://localhost:5000

# Terminal 2 — Frontend
cd krishisense
npm install
cp .env.example .env   # set VITE_BACKEND_URL=http://localhost:5000
npm run dev            # Vite → http://localhost:5173
```

### Local (frontend only, direct Gemini)

```bash
cd krishisense
# .env: VITE_GEMINI_KEY=<your-key>  (no VITE_BACKEND_URL)
npm run dev
```

### Build & Deploy Frontend

```bash
cd krishisense
npm run build           # → dist/
npm run preview         # local preview of built dist/
firebase deploy         # Firebase Hosting
```

### Lint

```bash
cd krishisense && npm run lint
```

---

## 16. External Service URLs

| Service | URL | Key |
|---|---|---|
| Open-Meteo | `https://api.open-meteo.com/v1/forecast` | None |
| Nominatim | `https://nominatim.openstreetmap.org/reverse` | None |
| NASA MODIS | `https://modis.ornl.gov/rst/api/v1/MOD13Q1/...` | None |
| SoilGrids | `https://rest.isric.org/soilgrids/v2.0/...` | None |
| Hugging Face Inference | `https://api-inference.huggingface.co/models/...` | None (public) |
| Gemini API | `https://generativelanguage.googleapis.com/v1beta/models/...` | `GEMINI_API_KEY` |
| Groq Whisper | `https://api.groq.com/openai/v1/audio/transcriptions` | `VITE_GROQ_KEY` |
| Sarvam TTS | `https://api.sarvam.ai/text-to-speech` | `VITE_SARVAM_KEY` |
| Firebase Auth/Firestore | Firebase SDK | `VITE_FIREBASE_*` |

---

## 17. Known Issues & Caveats

| Issue | Notes |
|---|---|
| `README.md` is default Vite template | Does not describe this app |
| Source files display mojibake in terminal | Non-ASCII comments; UTF-8 only, do not transcode |
| Emulated auth stores plaintext passwords | Local dev only, never production |
| SoilGrids is public but may rate-limit | App degrades gracefully to regional estimation |
| NASA MODIS mock hardcodes `2026-03-22` dates | Static fallback dates in `ndvi.js:84` will become stale |
| Market data is volatile | Search Grounding results change; always treat as approximate |
| `isDiseaseWeatherMatch` uses `new Function()` | Internal KB data only — do not expose to user input |
| Uncommitted changes across many files | See git status; avoid broad reformatting PRs |
| No formal test suite | `package.json` has no `test` script |
| `ExpertCallPanel` requires mic + Groq + Sarvam keys | Silently degrades if keys absent |
| Firestore scans query has no composite index | Sorted client-side to avoid required index deployment |

---

## 18. Adding a New Tab

1. Create `src/tabs/MyTab.jsx`
2. Add entry to `TAB_HEADERS` in `App.jsx:337`
3. Add `{tab === "my" && <MyTab ... />}` in the content section of `App.jsx`
4. Add nav entry to `components/layout/BottomNav.jsx`
5. Wrap expensive data fetches in `useDemoMode()` check and provide a `DEMO_*` payload in `lib/demoData.js`
6. Use `api.saveScan(type, data)` for persistence; call `onScanSaved()` prop to sync `App.jsx` state
