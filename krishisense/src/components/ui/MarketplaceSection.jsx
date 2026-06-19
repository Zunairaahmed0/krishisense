import { useState, useRef, useEffect, useCallback } from "react";
import { Search, MapPin, Phone, MessageSquare, Bookmark, BookmarkCheck, Flag, Trash2, Camera, X } from "lucide-react";
import { C } from "../../constants/theme";
import { api } from "../../lib/api";
import { useToast } from "./Toast";

const CATEGORIES = [
  "Grains & Cereals", "Vegetables", "Fruits", "Spices",
  "Cash Crops", "Pulses & Legumes", "Oilseeds",
];

const CATEGORY_EMOJI = {
  "Grains & Cereals": "🌾",
  "Vegetables": "🥦",
  "Fruits": "🍎",
  "Spices": "🌶️",
  "Cash Crops": "💰",
  "Pulses & Legumes": "🫘",
  "Oilseeds": "🌻",
};

const CROP_PHOTOS = {
  "Onion":   "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=300&q=80",
  "Wheat":   "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&q=80",
  "Tomato":  "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&q=80",
  "Potato":  "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&q=80",
  "Rice":    "https://images.unsplash.com/photo-1536304993881-ff86e6e0a1ef?w=300&q=80",
  "Soybean": "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=300&q=80",
  "Corn":    "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=300&q=80",
  "Cotton":  "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=300&q=80",
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (h < 1) return "Just now";
  if (h < 24) return h + "h ago";
  if (d < 7) return d + "d ago";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const cardPhotoSrc = (l) => {
  if (l.photo) return `data:image/jpeg;base64,${l.photo}`;
  return CROP_PHOTOS[l.crop] || null;
};

const waText = (l) => encodeURIComponent(
  `Hi, I saw your listing on KrishiSense. I'm interested in buying ${l.qty} ${l.unit} of ${l.crop} at ₹${l.price}/${l.unit}. Please confirm availability.`
);

export default function MarketplaceSection({ user, loc, lang }) {
  const { showToast } = useToast();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("browse");
  const [selectedListing, setSelectedListing] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortMode, setSortMode] = useState("latest");

  const [formCrop, setFormCrop] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formUnit, setFormUnit] = useState("quintal");
  const [formCategory, setFormCategory] = useState("Grains & Cereals");
  const [formContact, setFormContact] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formPhotoB64, setFormPhotoB64] = useState(null);
  const [formPhotoPreview, setFormPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const photoRef = useRef();

  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ks_saved_listings") || "[]"); } catch { return []; }
  });

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchAllListings();
      setListings(data);
    } catch (e) {
      console.warn("[marketplace] fetch error:", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  useEffect(() => {
    if (loc?.name) setFormLocation(`${loc.name}, ${loc.state || ""}`.trim().replace(/,\s*$/, ""));
  }, [loc]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, 400, 300);
        const ratio = Math.max(400 / img.width, 300 / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        ctx.drawImage(img, (400 - w) / 2, (300 - h) / 2, w, h);
        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        setFormPhotoB64(compressed.split(",")[1]);
        setFormPhotoPreview(compressed);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.saveMarketListing({
        crop: formCrop.trim(),
        qty: formQty,
        unit: formUnit,
        price: formPrice,
        category: formCategory,
        location: formLocation || (loc ? `${loc.name}, ${loc.state}` : "India"),
        contactNumber: formContact,
        photo: formPhotoB64 || null,
        sellerName: user?.fullName || "Farmer",
      });
      showToast("Crop listed successfully ✓", "success");
      setFormCrop(""); setFormQty(""); setFormPrice(""); setFormContact("");
      setFormUnit("quintal"); setFormCategory("Grains & Cereals");
      setFormPhotoB64(null); setFormPhotoPreview(null);
      setView("my");
      fetchListings();
    } catch (e) {
      showToast(e.message || "Failed to list crop", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (listingId) => {
    if (!user?.uid) return;
    try {
      await api.deleteMarketListing(listingId, user.uid);
      showToast("Listing removed", "success");
      fetchListings();
    } catch (e) {
      showToast("Failed to delete listing", "error");
    }
  };

  const toggleSave = (id) => {
    const next = saved.includes(id) ? saved.filter(s => s !== id) : [...saved, id];
    setSaved(next);
    localStorage.setItem("ks_saved_listings", JSON.stringify(next));
  };

  const myListings = listings.filter(l => l.sellerId === user?.uid);

  const filteredListings = listings
    .filter(l => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || l.crop?.toLowerCase().includes(q) || l.location?.toLowerCase().includes(q);
      const matchCat = filterCategory === "All" || l.category === filterCategory;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortMode === "price-low")  return Number(a.price) - Number(b.price);
      if (sortMode === "price-high") return Number(b.price) - Number(a.price);
      if (sortMode === "qty")        return Number(b.qty) - Number(a.qty);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const tabStyle = (active) => ({
    flex: 1, padding: "8px 4px", borderRadius: 8, border: "none",
    background: active ? C.p2 : "transparent",
    color: active ? "white" : C.txt2,
    fontSize: 11, fontWeight: 700, cursor: "pointer",
  });

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 10,
    border: `1px solid ${C.brd}`, background: C.tint,
    color: C.txt, fontSize: 13, boxSizing: "border-box", outline: "none",
  };

  const formLabelStyle = { fontSize: 12, fontWeight: 700, color: C.txt2, marginBottom: 4 };

  const canSubmit = formCrop.trim() && formQty && formPrice && formContact;

  return (
    <div style={{ marginTop: 8 }}>
      {/* Header */}
      <div style={{ padding: "0 14px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.txt }}>🏪 Direct Farmer Trade</div>
          <button onClick={fetchListings} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", color: C.mut, fontSize: 11, fontWeight: 600 }}>↻ Refresh</button>
        </div>
        <div style={{ fontSize: 11, color: C.mut }}>{myListings.length} listed by you · {listings.length} total available</div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 4, margin: "0 14px 12px", background: C.tint, padding: 4, borderRadius: 10 }}>
        <button style={tabStyle(view === "browse")} onClick={() => setView("browse")}>Browse Crops</button>
        <button style={tabStyle(view === "list")} onClick={() => setView("list")}>List My Crop</button>
        <button style={tabStyle(view === "my")} onClick={() => setView("my")}>My Listings</button>
      </div>

      {/* ── BROWSE ───────────────────────────────────────── */}
      {view === "browse" && (
        <div>
          {/* Search bar */}
          <div style={{ margin: "0 14px 8px", display: "flex", alignItems: "center", gap: 8, background: C.surface, border: `1px solid ${C.brd}`, borderRadius: 10, padding: "8px 12px" }}>
            <Search size={14} color={C.mut} style={{ flexShrink: 0 }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search crops or location..."
              style={{ flex: 1, border: "none", background: "none", outline: "none", fontSize: 13, color: C.txt }}
            />
          </div>

          {/* Category chips */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "0 14px 10px", scrollbarWidth: "none" }}>
            {["All", ...CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setFilterCategory(cat)} style={{
                flexShrink: 0, padding: "5px 12px", borderRadius: 20,
                border: `1px solid ${filterCategory === cat ? C.p2 : C.brd}`,
                background: filterCategory === cat ? C.tint : C.surface,
                color: filterCategory === cat ? C.p2 : C.mut,
                fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              }}>
                {cat !== "All" && CATEGORY_EMOJI[cat] ? `${CATEGORY_EMOJI[cat]} ` : ""}{cat}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div style={{ margin: "0 14px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: C.mut }}>Sort:</span>
            <select value={sortMode} onChange={e => setSortMode(e.target.value)} style={{ border: `1px solid ${C.brd}`, borderRadius: 8, padding: "4px 8px", fontSize: 11, color: C.txt, background: C.surface, cursor: "pointer", outline: "none" }}>
              <option value="latest">Latest</option>
              <option value="price-low">Price: Low → High</option>
              <option value="price-high">Price: High → Low</option>
              <option value="qty">Qty: Most</option>
            </select>
          </div>

          {loading && (
            <div style={{ textAlign: "center", padding: "24px 0", color: C.mut, fontSize: 13 }}>Loading listings...</div>
          )}

          {!loading && filteredListings.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 14px", color: C.mut }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🌱</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>No crops listed yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Be the first — tap "List My Crop" above</div>
            </div>
          )}

          {filteredListings.map(l => {
            const photo = cardPhotoSrc(l);
            const isMine = l.sellerId === user?.uid;
            const isSaved = saved.includes(l.id);
            return (
              <div key={l.id} style={{ margin: "0 14px 14px", borderRadius: 14, border: `1px solid ${C.brd}`, background: C.surface, overflow: "hidden", boxShadow: C.shadow }}>
                {/* Photo */}
                <div onClick={() => setSelectedListing(l)} style={{ height: 160, background: C.tint, cursor: "pointer", position: "relative", overflow: "hidden" }}>
                  {photo ? (
                    <img src={photo} alt={l.crop} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
                      {CATEGORY_EMOJI[l.category] || "🌾"}
                    </div>
                  )}
                  <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(27,94,32,0.88)", color: "white", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 12 }}>
                    {l.category}
                  </div>
                </div>
                {/* Card body */}
                <div onClick={() => setSelectedListing(l)} style={{ padding: "10px 12px 4px", cursor: "pointer" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.txt, marginBottom: 4 }}>{l.crop}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.mut, marginBottom: 6 }}>
                    <MapPin size={11} color={C.p2} style={{ flexShrink: 0 }} />
                    {l.location || "India"} · 🌾 {l.qty} {l.unit}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingBottom: 8 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#2E7D32" }}>
                      ₹{l.price}<span style={{ fontSize: 12, fontWeight: 400, color: C.mut }}>/{l.unit}</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.mut }}>{l.sellerName} · {timeAgo(l.createdAt)}</div>
                  </div>
                </div>
                {/* Action row */}
                <div style={{ display: "flex", gap: 6, padding: "8px 12px 10px", borderTop: `1px solid ${C.brd}` }}>
                  <a href={`tel:${l.contactNumber}`} style={{ flex: 1, padding: "7px 4px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.tint, color: C.p2, fontSize: 11, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                    <Phone size={11} /> Call
                  </a>
                  <a href={`https://wa.me/${(l.contactNumber || "").replace(/\D/g, "")}?text=${waText(l)}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: "7px 4px", borderRadius: 8, border: `1px solid ${C.brd}`, background: "#E8F5E9", color: "#2E7D32", fontSize: 11, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                    <MessageSquare size={11} /> WhatsApp
                  </a>
                  {isMine ? (
                    <button onClick={() => handleDelete(l.id)} style={{ flex: 1, padding: "7px 4px", borderRadius: 8, border: `1px solid #FFCDD2`, background: "#FFF5F5", color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                      <Trash2 size={11} /> Delete
                    </button>
                  ) : (
                    <>
                      <button onClick={() => toggleSave(l.id)} style={{ flex: 1, padding: "7px 4px", borderRadius: 8, border: `1px solid ${C.brd}`, background: isSaved ? C.tint : C.surface, color: isSaved ? C.p2 : C.mut, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                        {isSaved ? <BookmarkCheck size={11} /> : <Bookmark size={11} />} Save
                      </button>
                      <button onClick={() => showToast("Reported for review", "info")} style={{ flex: 1, padding: "7px 4px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.surface, color: C.mut, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                        <Flag size={11} /> Report
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── LIST FORM ─────────────────────────────────────── */}
      {view === "list" && (
        <div style={{ margin: "0 14px 24px", borderRadius: 14, border: `1px solid ${C.brd}`, background: C.surface, padding: "16px 14px", boxShadow: C.shadow }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.txt, marginBottom: 16 }}>➕ List Your Crop for Sale</div>

          {/* Category */}
          <div style={formLabelStyle}>Category</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setFormCategory(cat)} style={{
                padding: "5px 11px", borderRadius: 20,
                border: `1px solid ${formCategory === cat ? C.p2 : C.brd}`,
                background: formCategory === cat ? C.tint : "transparent",
                color: formCategory === cat ? C.p2 : C.mut,
                fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}>
                {CATEGORY_EMOJI[cat]} {cat}
              </button>
            ))}
          </div>

          {/* Crop name */}
          <div style={formLabelStyle}>Crop Name *</div>
          <input value={formCrop} onChange={e => setFormCrop(e.target.value)} placeholder="e.g. Onion, Wheat, Tomato" style={{ ...inputStyle, marginBottom: 12 }} />

          {/* Qty + Unit */}
          <div style={formLabelStyle}>Quantity *</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input type="number" value={formQty} onChange={e => setFormQty(e.target.value)} placeholder="e.g. 50" style={{ ...inputStyle, width: "auto", flex: 1 }} />
            <select value={formUnit} onChange={e => setFormUnit(e.target.value)} style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.tint, color: C.txt, fontSize: 13, cursor: "pointer", outline: "none" }}>
              <option value="quintal">quintal</option>
              <option value="kg">kg</option>
              <option value="tonne">tonne</option>
            </select>
          </div>

          {/* Price */}
          <div style={formLabelStyle}>Price (₹/{formUnit}) *</div>
          <input type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)} placeholder="e.g. 2200" style={{ ...inputStyle, marginBottom: 12 }} />

          {/* Location */}
          <div style={formLabelStyle}>Location</div>
          <input value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="City, State" style={{ ...inputStyle, marginBottom: 12 }} />

          {/* Contact */}
          <div style={formLabelStyle}>Contact Number *</div>
          <input type="tel" value={formContact} onChange={e => setFormContact(e.target.value)} placeholder="10-digit mobile number" maxLength={10} style={{ ...inputStyle, marginBottom: 12 }} />

          {/* Photo */}
          <div style={formLabelStyle}>Photo (optional)</div>
          <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoSelect} />
          {formPhotoPreview ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <img src={formPhotoPreview} alt="preview" style={{ width: 80, height: 60, borderRadius: 8, objectFit: "cover", border: `1px solid ${C.brd}` }} />
              <button onClick={() => { setFormPhotoB64(null); setFormPhotoPreview(null); }} style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.surface, color: C.red, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <X size={11} /> Remove
              </button>
            </div>
          ) : (
            <button onClick={() => photoRef.current?.click()} style={{ width: "100%", padding: 14, borderRadius: 10, border: `2px dashed ${C.brd}`, background: C.tint, color: C.mut, fontSize: 12, fontWeight: 600, cursor: "pointer", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Camera size={14} /> Add crop photo (optional)
            </button>
          )}

          <button onClick={handleSubmit} disabled={submitting || !canSubmit} style={{
            width: "100%", padding: 13, borderRadius: 12, border: "none",
            background: canSubmit ? "linear-gradient(135deg, #2E7D32, #388E3C)" : C.brd,
            color: "white", fontSize: 14, fontWeight: 700, cursor: canSubmit ? "pointer" : "not-allowed",
            opacity: submitting ? 0.7 : 1,
          }}>
            {submitting ? "Listing..." : "List My Crop →"}
          </button>
        </div>
      )}

      {/* ── MY LISTINGS ──────────────────────────────────── */}
      {view === "my" && (
        <div style={{ padding: "0 14px 24px" }}>
          {myListings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: C.mut }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🌱</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>No crops listed yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Switch to 'List My Crop' to create your first listing</div>
              <button onClick={() => setView("list")} style={{ marginTop: 14, padding: "9px 20px", borderRadius: 10, border: "none", background: C.p2, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                + List My Crop
              </button>
            </div>
          ) : myListings.map(l => (
            <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: `1px solid ${C.brd}` }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>{CATEGORY_EMOJI[l.category] || "🌾"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.txt }}>{l.crop}</div>
                <div style={{ fontSize: 11, color: C.mut }}>{l.qty} {l.unit} · ₹{l.price}/{l.unit} · {timeAgo(l.createdAt)}</div>
                <div style={{ fontSize: 11, color: C.mut }}>{l.location}</div>
              </div>
              <button onClick={() => handleDelete(l.id)} style={{ flexShrink: 0, padding: "6px 10px", borderRadius: 8, border: `1px solid #FFCDD2`, background: "#FFF5F5", color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <Trash2 size={11} /> Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail modal ─────────────────────────────────── */}
      {selectedListing && (() => {
        const l = selectedListing;
        const photo = cardPhotoSrc(l);
        const isMine = l.sellerId === user?.uid;
        const isSaved = saved.includes(l.id);
        return (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
            onClick={() => setSelectedListing(null)}
          >
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
            <div onClick={e => e.stopPropagation()} style={{ position: "relative", background: "#fff", borderRadius: "20px 20px 0 0", maxHeight: "88vh", overflowY: "auto" }}>
              {photo ? (
                <img src={photo} alt={l.crop} style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: "20px 20px 0 0", display: "block" }} />
              ) : (
                <div style={{ height: 160, background: C.tint, borderRadius: "20px 20px 0 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56 }}>
                  {CATEGORY_EMOJI[l.category] || "🌾"}
                </div>
              )}
              <button onClick={() => setSelectedListing(null)} style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.45)", color: "white", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>×</button>
              <div style={{ padding: "16px 18px 32px" }}>
                <div style={{ fontSize: 11, color: C.p2, fontWeight: 700, marginBottom: 4 }}>{l.category}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.txt, marginBottom: 4 }}>{l.crop}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#2E7D32", marginBottom: 10 }}>
                  ₹{l.price}<span style={{ fontSize: 13, color: C.mut, fontWeight: 400 }}>/{l.unit}</span>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: C.txt2, marginBottom: 4, flexWrap: "wrap" }}>
                  <span>🌾 {l.qty} {l.unit}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={11} color={C.p2} />{l.location}</span>
                </div>
                <div style={{ fontSize: 12, color: C.mut, marginBottom: 16 }}>Listed by {l.sellerName} · {timeAgo(l.createdAt)}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <a href={`tel:${l.contactNumber}`} style={{ flex: 1, padding: "11px 6px", borderRadius: 10, border: "none", background: C.p2, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                    <Phone size={13} /> Call Farmer
                  </a>
                  <a href={`https://wa.me/${(l.contactNumber || "").replace(/\D/g, "")}?text=${waText(l)}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: "11px 6px", borderRadius: 10, border: "none", background: "#25D366", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                    <MessageSquare size={13} /> WhatsApp
                  </a>
                  {!isMine && (
                    <button onClick={() => toggleSave(l.id)} style={{ padding: "11px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: isSaved ? C.tint : C.surface, color: isSaved ? C.p2 : C.mut, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center" }}>
                      {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
