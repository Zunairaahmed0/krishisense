import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Compass, ArrowRight, X, Loader2 } from "lucide-react";
import { C } from "../../constants/theme";
import Card from "./Card";
import Badge from "./Badge";

export default function LocationModal({ isOpen, onClose, onSelectLocation, onResetToGPS, isManual, currentLoc, lang }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Coordinates manual input states
  const [manualLat, setManualLat] = useState("");
  const [manualLon, setManualLon] = useState("");
  const [customName, setCustomName] = useState("");

  const searchTimeoutRef = useRef(null);

  // Multilingual translations
  const tMap = {
    en: {
      title: "Select Farm Location",
      searchPlaceholder: "Search city, town, or village...",
      manualTitle: "Or Enter Coordinates Manually",
      latLabel: "Latitude",
      lonLabel: "Longitude",
      nameLabel: "Location Name (e.g. My Farm)",
      applyBtn: "Apply Coordinates",
      useGps: "Use My Current GPS Position",
      gpsActive: "GPS Auto-Tracking Active",
      gpsManual: "Manual Override Active",
      noResults: "No locations found.",
      searching: "Searching matches...",
      coordinateError: "Please enter valid coordinates (-90 to 90 for Lat, -180 to 180 for Lon).",
      nameRequired: "Please enter a location name.",
    },
    hi: {
      title: "खेत का स्थान चुनें",
      searchPlaceholder: "शहर, कस्बा या गांव खोजें...",
      manualTitle: "या मैन्युअल रूप से निर्देशांक दर्ज करें",
      latLabel: "अक्षांश (Latitude)",
      lonLabel: "देशांतर (Longitude)",
      nameLabel: "स्थान का नाम (जैसे: मेरा खेत)",
      applyBtn: "निर्देशांक लागू करें",
      useGps: "मेरे वर्तमान जीपीएस स्थान का उपयोग करें",
      gpsActive: "जीपीएस ऑटो-ट्रैकिंग सक्रिय",
      gpsManual: "मैन्युअल नियंत्रण सक्रिय",
      noResults: "कोई स्थान नहीं मिला।",
      searching: "खोज रहे हैं...",
      coordinateError: "कृपया वैध निर्देशांक दर्ज करें (अक्षांश -90 से 90, देशांतर -180 से 180)।",
      nameRequired: "कृपया स्थान का नाम दर्ज करें।",
    },
    mr: {
      title: "शेत स्थान निवडा",
      searchPlaceholder: "शहर, गाव किंवा परिसर शोधा...",
      manualTitle: "किंवा स्वतः अक्षांश-रेखांश प्रविष्ट करा",
      latLabel: "अक्षांश (Latitude)",
      lonLabel: "रेखांश (Longitude)",
      nameLabel: "ठिकाणाचे नाव (उदा: माझे शेत)",
      applyBtn: "अक्षांश-रेखांश लागू करा",
      useGps: "माझे चालू जीपीएस स्थान वापरा",
      gpsActive: "जीपीएस ऑटो-ट्रॅकिंग सक्रिय",
      gpsManual: "मॅन्युअल नियंत्रण सक्रिय",
      noResults: "ठिकाण सापडले नाही.",
      searching: "शोधत आहे...",
      coordinateError: "कृपया वैध अक्षांश-रेखांश प्रविष्ट करा (अक्षांश -90 ते 90, रेखांश -180 ते 180).",
      nameRequired: "कृपया ठिकाणाचे नाव प्रविष्ट करा।",
    },
    pa: {
      title: "ਖੇਤ ਦਾ ਟਿਕਾਣਾ ਚੁਣੋ",
      searchPlaceholder: "ਸ਼ਹਿਰ, ਕਸਬਾ ਜਾਂ ਪਿੰਡ ਖੋਜੋ...",
      manualTitle: "ਜਾਂ ਕੋਆਰਡੀਨੇਟ ਹੱਥੀਂ ਦਾਖਲ ਕਰੋ",
      latLabel: "ਅਕਸ਼ਾਂਸ਼ (Latitude)",
      lonLabel: "ਦੇਸ਼ਾਂਤਰ (Longitude)",
      nameLabel: "ਟਿਕਾਣੇ ਦਾ ਨਾਮ (ਜਿਵੇਂ: ਮੇਰਾ ਖੇਤ)",
      applyBtn: "ਕੋਆਰਡੀਨੇਟ ਲਾਗੂ ਕਰੋ",
      useGps: "ਮੇਰੀ ਮੌਜੂਦਾ GPS ਸਥਿਤੀ ਵਰਤੋ",
      gpsActive: "GPS ਆਟੋ-ਟ੍ਰੈਕਿੰਗ ਸਰਗਰਮ",
      gpsManual: "ਮੈਨੂਅਲ ਨਿਯੰਤਰਣ ਸਰਗਰਮ",
      noResults: "ਕੋਈ ਟਿਕਾਣਾ ਨਹੀਂ ਮਿਲਿਆ।",
      searching: "ਖੋਜ ਰਹੇ ਹਾਂ...",
      coordinateError: "ਕਿਰਪਾ ਕਰਕੇ ਸਹੀ ਕੋਆਰਡੀਨੇਟ ਦਾਖਲ ਕਰੋ।",
      nameRequired: "ਕਿਰਪਾ ਕਰਕੇ ਟਿਕਾਣੇ ਦਾ ਨਾਮ ਦਾਖਲ ਕਰੋ।",
    },
    ta: {
      title: "பண்ணை இடத்தை தேர்ந்தெடுங்கள்",
      searchPlaceholder: "நகரம், நகர்ப்புறம் அல்லது கிராமம் தேடுங்கள்...",
      manualTitle: "அல்லது கோர்டினேட்களை கைமுறையாக உள்ளிடுங்கள்",
      latLabel: "அட்சரேகை (Latitude)",
      lonLabel: "தீர்க்கரேகை (Longitude)",
      nameLabel: "இடத்தின் பெயர் (எ.கா: என் பண்ணை)",
      applyBtn: "கோர்டினேட்களை பயன்படுத்து",
      useGps: "என் தற்போதைய GPS இடத்தை பயன்படுத்து",
      gpsActive: "GPS தானியங்கி கண்காணிப்பு செயல்பாட்டில்",
      gpsManual: "கைமுறை கட்டுப்பாடு செயல்பாட்டில்",
      noResults: "இடங்கள் எதுவும் கிடைக்கவில்லை.",
      searching: "தேடுகிறோம்...",
      coordinateError: "சரியான கோர்டினேட்களை உள்ளிடுங்கள்.",
      nameRequired: "இடத்தின் பெயரை உள்ளிடுங்கள்.",
    },
    te: {
      title: "పొలం స్థానాన్ని ఎంచుకోండి",
      searchPlaceholder: "నగరం, పట్టణం లేదా గ్రామాన్ని వెతకండి...",
      manualTitle: "లేదా కోఆర్డినేట్‌లను మాన్యువల్‌గా నమోదు చేయండి",
      latLabel: "అక్షాంశం (Latitude)",
      lonLabel: "రేఖాంశం (Longitude)",
      nameLabel: "స్థాన పేరు (ఉదా: నా పొలం)",
      applyBtn: "కోఆర్డినేట్‌లు వర్తింపజేయి",
      useGps: "నా ప్రస్తుత GPS స్థానాన్ని ఉపయోగించు",
      gpsActive: "GPS ఆటో-ట్రాకింగ్ సక్రియంగా ఉంది",
      gpsManual: "మాన్యువల్ నియంత్రణ సక్రియంగా ఉంది",
      noResults: "స్థానాలు కనుగొనబడలేదు.",
      searching: "వెతుకుతున్నాము...",
      coordinateError: "దయచేసి సరైన కోఆర్డినేట్‌లు నమోదు చేయండి.",
      nameRequired: "దయచేసి స్థాన పేరు నమోదు చేయండి.",
    },
  };
  const t = tMap[lang] || tMap.en;

  // Trigger Nominatim Search on Query Input
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setSearching(true);
    setErrorMsg("");

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Query Nominatim API with priority in India (countrycodes=in)
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&addressdetails=1&countrycodes=in`;
        const res = await fetch(url, {
          headers: {
            "Accept-Language": ["hi","mr","pa","ta","te"].includes(lang) ? lang : "en"
          }
        });
        if (!res.ok) throw new Error("Search geocoding failed");
        const data = await res.json();
        
        const mapped = data.map(item => {
          const addr = item.address;
          const name = addr.village || addr.town || addr.city || addr.suburb || item.name || "Unknown Place";
          const state = addr.state || addr.region || "";
          const country = addr.country || "";
          return {
            name,
            state,
            country,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            displayName: item.display_name
          };
        });

        setResults(mapped);
      } catch (err) {
        console.warn("Nominatim Geocoding error:", err);
        setErrorMsg("Failed to connect to location service.");
      } finally {
        setSearching(false);
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery, lang]);

  const handleApplyCoordinates = (e) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    
    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lon) || lon < -180 || lon > 180) {
      alert(t.coordinateError);
      return;
    }

    if (!customName.trim()) {
      alert(t.nameRequired);
      return;
    }

    onSelectLocation({
      name: customName.trim(),
      state: "Custom Coordinate",
      country: "",
      lat,
      lon
    });
    onClose();
  };

  const selectPlace = (place) => {
    onSelectLocation(place);
    onClose();
  };

  const handleResetClick = () => {
    onResetToGPS();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(9, 29, 21, 0.65)",
      backdropFilter: "blur(6px)",
      zIndex: 99999,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      animation: "fadeIn 0.25s ease-out"
    }}>
      <div style={{
        background: C.bg,
        width: "100%",
        maxWidth: 480,
        maxHeight: "90vh",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflowY: "auto",
        position: "relative",
        boxShadow: "0 -10px 40px rgba(0,0,0,0.2)",
        animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        {/* Handle Drag Bar */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 6px" }}>
          <div style={{ width: 42, height: 5, borderRadius: 3, background: "#E0E0E0" }} />
        </div>

        {/* Modal Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 20px 14px",
          borderBottom: `1px solid ${C.brd}`
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: C.txt, margin: 0 }}>{t.title}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: isManual ? C.amber : C.p3 }} />
              <span style={{ fontSize: 10, color: C.mut, fontWeight: 600 }}>
                {isManual ? t.gpsManual : t.gpsActive}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "none",
              background: C.surface,
              color: C.txt2,
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {/* Active GPS status & restore bar */}
          <button
            onClick={handleResetClick}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 14,
              background: isManual ? C.tint : C.surface,
              border: isManual ? `1px solid ${C.p3}` : `1px dashed ${C.brd}`,
              color: isManual ? C.primary : C.mut,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 16,
              transition: "all 0.2s ease"
            }}
          >
            <Compass size={16} className={isManual ? "" : "spin-slow"} style={{ color: isManual ? C.p3 : C.mut }} />
            {t.useGps}
          </button>

          {/* Search geocoding field */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            <Search size={18} color={C.mut} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{
                width: "100%",
                padding: "14px 14px 14px 40px",
                borderRadius: 14,
                border: `1.5px solid ${C.brd}`,
                background: C.surface,
                color: C.txt,
                fontSize: 13,
                outline: "none",
                transition: "border-color 0.2s ease"
              }}
              onFocus={e => e.target.style.borderColor = C.p3}
              onBlur={e => e.target.style.borderColor = C.brd}
            />
            {searching && (
              <Loader2 size={16} color={C.p3} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", animation: "spin 1s linear infinite" }} />
            )}
          </div>

          {/* Search results mapping */}
          {errorMsg && (
            <div style={{ fontSize: 11, color: C.red, marginBottom: 12, textAlign: "center" }}>{errorMsg}</div>
          )}

          {searching && (
            <div style={{ fontSize: 11, color: C.mut, marginBottom: 12, paddingLeft: 8 }}>{t.searching}</div>
          )}

          {results.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {results.map((place, idx) => (
                <div
                  key={idx}
                  onClick={() => selectPlace(place)}
                  style={{
                    background: C.surface,
                    borderRadius: 12,
                    border: `1.5px solid ${C.brd}`,
                    padding: "10px 12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.p3}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.brd}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: C.tint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <MapPin size={14} color={C.p2} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.txt }}>
                        {place.name}
                      </div>
                      <div style={{ fontSize: 10, color: C.mut, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {place.state ? `${place.state}, ` : ""}{place.country}
                      </div>
                    </div>
                  </div>
                  <Badge text={`${place.lat.toFixed(2)}, ${place.lon.toFixed(2)}`} color={C.p3} />
                </div>
              ))}
            </div>
          )}

          {searchQuery.length >= 3 && !searching && results.length === 0 && (
            <Card style={{ padding: "14px 12px", textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: C.mut }}>{t.noResults}</div>
            </Card>
          )}

          {/* Coordinate entry form */}
          <div style={{
            borderTop: `1px solid ${C.brd}`,
            paddingTop: 16,
            marginTop: 16
          }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: C.txt, marginBottom: 12 }}>{t.manualTitle}</h3>
            <form onSubmit={handleApplyCoordinates} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label htmlFor="manual-lat" style={{ fontSize: 9, color: C.mut, fontWeight: 600, display: "block", marginBottom: 4 }}>{t.latLabel}</label>
                  <input
                    id="manual-lat"
                    type="number"
                    step="0.0001"
                    min="-90"
                    max="90"
                    placeholder="e.g. 19.8762"
                    value={manualLat}
                    onChange={e => setManualLat(e.target.value)}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 10,
                      border: `1.5px solid ${C.brd}`,
                      background: C.surface,
                      color: C.txt,
                      fontSize: 12,
                      outline: "none"
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="manual-lon" style={{ fontSize: 9, color: C.mut, fontWeight: 600, display: "block", marginBottom: 4 }}>{t.lonLabel}</label>
                  <input
                    id="manual-lon"
                    type="number"
                    step="0.0001"
                    min="-180"
                    max="180"
                    placeholder="e.g. 75.3421"
                    value={manualLon}
                    onChange={e => setManualLon(e.target.value)}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 10,
                      border: `1.5px solid ${C.brd}`,
                      background: C.surface,
                      color: C.txt,
                      fontSize: 12,
                      outline: "none"
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="custom-name" style={{ fontSize: 9, color: C.mut, fontWeight: 600, display: "block", marginBottom: 4 }}>{t.nameLabel}</label>
                <input
                  id="custom-name"
                  type="text"
                  placeholder="e.g. Lasalgaon Farm"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 10,
                    border: `1.5px solid ${C.brd}`,
                    background: C.surface,
                    color: C.txt,
                    fontSize: 12,
                    outline: "none"
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  background: C.primary,
                  color: "white",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  marginTop: 4
                }}
              >
                {t.applyBtn} <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
