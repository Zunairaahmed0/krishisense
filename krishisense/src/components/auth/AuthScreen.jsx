import { useState, useEffect, useRef } from "react";
import { Globe, Leaf, Smartphone, KeyRound, MessageSquare, ArrowLeft, RefreshCw, AlertTriangle, Check } from "lucide-react";
import { C } from "../../constants/theme";
import { api } from "../../lib/api";
import { speak } from "../../lib/speech";
import Spinner from "../ui/Spinner";

export default function AuthScreen({ onAuthSuccess, voiceOn = true }) {
  // Method chooser: null = show chooser, 'otp' = phone OTP flow, 'email' = email/password
  const [authMethod, setAuthMethod] = useState(null);

  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lang, setLang] = useState("en");

  // OTP flow states
  const [isOtpFlow, setIsOtpFlow] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpConfirmResult, setOtpConfirmResult] = useState(null);

  // Name step — shown after OTP is verified
  const [isNameStep, setIsNameStep] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [nameInput, setNameInput] = useState("");

  const otpInputsRef = useRef([]);

  // Voice welcome on mount
  useEffect(() => {
    if (!voiceOn) return;
    const timer = setTimeout(() => {
      speak(
        lang === "hi"
          ? "कृषिसेंस में आपका स्वागत है।"
          : lang === "mr"
          ? "कृषिसेन्स मध्ये आपले स्वागत आहे."
          : "Welcome to KrishiSense.",
        lang
      );
    }, 600);
    return () => clearTimeout(timer);
  }, [lang]);

  // Resend OTP countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => setResendTimer((p) => p - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const getPasswordStrength = () => {
    if (!password) return { label: "", color: "transparent", width: "0%", desc: "" };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 2)
      return { label: lang === "hi" ? "कमजोर" : "Weak", color: C.red, width: "33%", desc: "Enter at least 6 characters" };
    if (score <= 4)
      return { label: lang === "hi" ? "मध्यम" : "Medium", color: C.amber, width: "66%", desc: "Add numbers or special symbols" };
    return { label: lang === "hi" ? "मजबूत" : "Strong 💪", color: C.p2, width: "100%", desc: "Excellent security level!" };
  };

  const handleRequestOTP = async () => {
    if (!identifier.trim()) {
      setError("Please enter a valid phone number.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let phone = identifier.trim();
      if (!phone.startsWith("+")) phone = "+91" + phone;
      if (voiceOn) speak(lang === "hi" ? "सत्यापन कोड भेजा जा रहा है" : "Sending SMS verification code...", lang);
      const confirmResult = await api.sendPhoneOTP(phone, "recaptcha-container");
      setOtpConfirmResult(confirmResult);
      setIsOtpFlow(true);
      setResendTimer(60);
      setTimeout(() => { if (otpInputsRef.current[0]) otpInputsRef.current[0].focus(); }, 300);
    } catch (err) {
      setError(err.message || "Failed to send SMS OTP.");
      if (voiceOn) speak(err.message || "Failed to trigger verification code.", lang);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault();
    const otpCode = otpDigits.join("");
    if (otpCode.length < 6) { setError("Please enter the complete 6-digit code."); return; }
    setLoading(true);
    setError("");
    try {
      const userProfile = await otpConfirmResult.confirm(otpCode);
      // Don't go home yet — ask for the user's name first
      setVerifiedUser(userProfile);
      setIsNameStep(true);
    } catch (err) {
      setError(err.message || "Invalid OTP verification code.");
      if (voiceOn) speak(err.message || "Incorrect verification code.", lang);
      setOtpDigits(["", "", "", "", "", ""]);
      if (otpInputsRef.current[0]) otpInputsRef.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) { setError("Please enter your name."); return; }
    const fullProfile = { ...verifiedUser, fullName: nameInput.trim() };
    if (voiceOn) speak(`Welcome ${nameInput.trim()} to KrishiSense!`, lang);
    onAuthSuccess(fullProfile);
  };

  const handleOtpDigitChange = (idx, value) => {
    if (/[^0-9]/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[idx] = value.slice(-1);
    setOtpDigits(newDigits);
    if (value && idx < 5 && otpInputsRef.current[idx + 1]) otpInputsRef.current[idx + 1].focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      const prevInput = otpInputsRef.current[idx - 1];
      if (prevInput) {
        prevInput.focus();
        const newDigits = [...otpDigits];
        newDigits[idx - 1] = "";
        setOtpDigits(newDigits);
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pasteData)) return;
    setOtpDigits(pasteData.split(""));
    if (otpInputsRef.current[5]) otpInputsRef.current[5].focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) { setError("Please fill out all fields."); return; }
    setLoading(true);
    setError("");
    try {
      let userProfile;
      if (isLogin) {
        userProfile = await api.login(identifier.trim(), password);
        if (voiceOn) speak(lang === "hi" ? "लॉगिन सफल रहा!" : "Login successful!", lang);
      } else {
        if (!fullName.trim()) { setError("Full name is required for registration."); setLoading(false); return; }
        userProfile = await api.register(identifier.trim(), fullName, password);
        if (voiceOn) speak(lang === "hi" ? "पंजीकरण सफल!" : "Registration complete! Welcome.", lang);
      }
      onAuthSuccess(userProfile);
    } catch (err) {
      setError(err.message || "Authentication failed.");
      if (voiceOn) speak(err.message || "Failed to authenticate.", lang);
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = getPasswordStrength();

  const inputStyle = {
    padding: "12px 14px",
    borderRadius: 12,
    border: `1.5px solid ${C.brd}`,
    background: "rgba(255,255,255,0.6)",
    color: C.txt,
    fontSize: 13,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "all 0.2s ease",
  };

  const errorBox = error ? (
    <div style={{ background: "#FFEBEE", border: "1px solid #FFCDD2", color: C.red, padding: "10px 14px", borderRadius: 12, fontSize: 11, fontWeight: 600, marginBottom: 16, textAlign: "left", display: "flex", alignItems: "center", gap: 6 }}>
      <AlertTriangle size={13} color={C.red} /><span>{error}</span>
    </div>
  ) : null;

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg, #f0f7f3 0%, #e8f3ec 50%, #f6f0e6 100%)",
      padding: "24px 16px",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background blobs */}
      <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,195,74,0.18) 0%, transparent 70%)", top: "-50px", left: "-50px", zIndex: 1 }} />
      <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(76,175,80,0.14) 0%, transparent 70%)", bottom: "-80px", right: "-60px", zIndex: 1 }} />

      {/* Language selector */}
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 10, display: "flex", gap: 6, alignItems: "center" }}>
        <Globe size={13} color={C.mut} />
        <select value={lang} onChange={e => setLang(e.target.value)} style={{ padding: "4px 8px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.surface, color: C.p2, fontSize: 11, fontWeight: 800, cursor: "pointer", outline: "none" }}>
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
          <option value="mr">मराठी</option>
        </select>
      </div>

      {/* Glass card */}
      <div style={{
        width: "100%",
        maxWidth: 400,
        background: "rgba(255, 255, 255, 0.72)",
        backdropFilter: "blur(20px)",
        borderRadius: 24,
        border: "1px solid rgba(255, 255, 255, 0.45)",
        boxShadow: "0 20px 40px rgba(18, 60, 44, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
        padding: "32px 24px",
        zIndex: 5,
        textAlign: "center"
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 24 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg, ${C.p2}, ${C.p4})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 14px ${C.gGlow}` }}>
            <Leaf size={22} color="white" />
          </div>
          <div style={{ textAlign: "left" }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: C.primary, letterSpacing: -0.6 }}>KrishiSense</h1>
            <p style={{ fontSize: 10, color: C.mut, fontWeight: 600 }}>AI Assistant for Farmers</p>
          </div>
        </div>

        <div id="recaptcha-container" style={{ position: "absolute", top: -9999, left: -9999 }} />

        {/* ── METHOD CHOOSER ── */}
        {authMethod === null && (
          <div>
            <p style={{ fontSize: 12, color: C.txt2, marginBottom: 24, lineHeight: 1.6 }}>
              {lang === "hi" ? "लॉगिन का तरीका चुनें" : lang === "mr" ? "लॉगिन पद्धत निवडा" : "Choose how you'd like to sign in"}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* OTP option */}
              <button
                onClick={() => { setAuthMethod("otp"); setError(""); setIdentifier(""); }}
                style={{ padding: "18px 20px", borderRadius: 16, border: `2px solid ${C.sky}`, background: "rgba(14,165,233,0.06)", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left", transition: "all 0.2s ease", width: "100%" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(14,165,233,0.14)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(14,165,233,0.06)"}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${C.sky}, ${C.blue})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Smartphone size={20} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.primary }}>
                    {lang === "hi" ? "OTP से लॉगिन" : lang === "mr" ? "OTP ने लॉगिन" : "Login with OTP"}
                  </div>
                  <div style={{ fontSize: 11, color: C.mut, marginTop: 2 }}>
                    {lang === "hi" ? "मोबाइल नंबर पर कोड भेजें" : "Get a code on your phone — quick & secure"}
                  </div>
                </div>
                <span style={{ color: C.sky, fontSize: 20, fontWeight: 900 }}>›</span>
              </button>

              {/* Email / Password option */}
              <button
                onClick={() => { setAuthMethod("email"); setError(""); setIdentifier(""); }}
                style={{ padding: "18px 20px", borderRadius: 16, border: `2px solid ${C.p2}`, background: "rgba(22,134,75,0.06)", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left", transition: "all 0.2s ease", width: "100%" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(22,134,75,0.14)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(22,134,75,0.06)"}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${C.primary}, ${C.p3})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <KeyRound size={20} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.primary }}>
                    {lang === "hi" ? "Email / पासवर्ड से" : lang === "mr" ? "Email / पासवर्ड ने" : "Email & Password"}
                  </div>
                  <div style={{ fontSize: 11, color: C.mut, marginTop: 2 }}>
                    {lang === "hi" ? "ईमेल या यूज़रनेम से लॉगिन करें" : "Sign in or register with your email"}
                  </div>
                </div>
                <span style={{ color: C.p2, fontSize: 20, fontWeight: 900 }}>›</span>
              </button>
            </div>

            <div style={{ marginTop: 24, fontSize: 10, color: C.mut, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <span>🛡️</span>
              <span>End-to-End Cryptographically Secured</span>
            </div>
          </div>
        )}

        {/* ── OTP FLOW ── */}
        {authMethod === "otp" && (
          <div>
            {/* Step 3: Name entry after OTP verified */}
            {isNameStep ? (
              <div>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: C.primary, marginBottom: 6 }}>
                  {lang === "hi" ? "आपका नाम क्या है?" : lang === "mr" ? "तुमचे नाव काय आहे?" : "What's your name?"}
                </h2>
                <p style={{ fontSize: 12, color: C.txt2, marginBottom: 24, lineHeight: 1.5 }}>
                  {lang === "hi" ? "हम आपको व्यक्तिगत रूप से संबोधित करेंगे।" : "We'll use this to personalise your KrishiSense experience."}
                </p>

                {errorBox}

                <form onSubmit={handleNameSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <input
                    type="text"
                    autoFocus
                    required
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    placeholder={lang === "hi" ? "जैसे: रमेश कुमार" : "e.g. Ramesh Kumar"}
                    style={{ ...inputStyle, fontSize: 15, fontWeight: 600, textAlign: "center" }}
                    onFocus={e => e.target.style.borderColor = C.p2}
                    onBlur={e => e.target.style.borderColor = C.brd}
                  />
                  <button
                    type="submit"
                    style={{ padding: 14, borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${C.primary}, ${C.p3})`, color: "white", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: `0 8px 24px rgba(22,134,75,0.18)`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    <span>{lang === "hi" ? "KrishiSense में प्रवेश करें" : lang === "mr" ? "KrishiSense मध्ये प्रवेश करा" : "Enter KrishiSense"}</span>
                    <Leaf size={16} color="white" />
                  </button>
                </form>
              </div>

            /* Step 2: OTP digit grid */
            ) : isOtpFlow ? (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: C.primary, marginTop: 4, marginBottom: 8 }}>
                  {lang === "hi" ? "सत्यापन कोड दर्ज करें" : lang === "mr" ? "सत्यापन कोड प्रविष्ट करा" : "Enter Verification Code"}
                </h2>
                <p style={{ fontSize: 12, color: C.txt2, marginBottom: 24, lineHeight: 1.5 }}>
                  {lang === "hi" ? `हमने +91${identifier} पर 6-अंकीय कोड भेजा है।` : `6-digit SMS code sent to +91${identifier}`}
                </p>

                {errorBox}

                <form onSubmit={handleVerifyOTP}>
                  <div onPaste={handleOtpPaste} style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 24 }}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={el => otpInputsRef.current[idx] = el}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                        style={{ width: "44px", height: "52px", borderRadius: "12px", border: `2.5px solid ${digit ? C.p2 : C.brd}`, background: "rgba(255,255,255,0.8)", color: C.primary, fontSize: "20px", fontWeight: "900", textAlign: "center", outline: "none", transition: "all 0.25s ease", boxShadow: digit ? `0 4px 12px ${C.gGlow}` : "none" }}
                        onFocus={e => { e.target.style.borderColor = C.p2; e.target.style.transform = "scale(1.06)"; }}
                        onBlur={e => { e.target.style.borderColor = digit ? C.p2 : C.brd; e.target.style.transform = "scale(1)"; }}
                      />
                    ))}
                  </div>

                  <button type="submit" disabled={loading} style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${C.primary}, ${C.p3})`, color: "white", fontSize: 14, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", boxShadow: `0 8px 24px rgba(22,134,75,0.18)`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
                    {loading ? <Spinner size={18} color="white" /> : <><span>{lang === "hi" ? "कोड सत्यापित करें" : "Verify Code"}</span><Check size={16} color="white" /></>}
                  </button>
                </form>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button onClick={() => { setIsOtpFlow(false); setOtpDigits(["", "", "", "", "", ""]); setError(""); }} style={{ background: "none", border: "none", color: C.mut, fontSize: 11, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
                    <ArrowLeft size={13} /> {lang === "hi" ? "नंबर बदलें" : "Change Number"}
                  </button>
                  {resendTimer > 0 ? (
                    <span style={{ fontSize: 11, color: C.mut, fontWeight: 600 }}>Resend in <b>{resendTimer}s</b></span>
                  ) : (
                    <button onClick={handleRequestOTP} style={{ background: "none", border: "none", color: C.p2, fontSize: 11, fontWeight: 800, cursor: "pointer", textDecoration: "underline" }}>
                      <RefreshCw size={12} /> {lang === "hi" ? "दोबारा भेजें" : "Resend Code"}
                    </button>
                  )}
                </div>
              </div>

            /* Step 1: Phone number entry */
            ) : (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: C.primary, marginTop: 4, marginBottom: 8 }}>
                  {lang === "hi" ? "मोबाइल नंबर दर्ज करें" : lang === "mr" ? "मोबाइल नंबर प्रविष्ट करा" : "Enter Your Phone Number"}
                </h2>
                <p style={{ fontSize: 12, color: C.txt2, marginBottom: 24, lineHeight: 1.5 }}>
                  {lang === "hi" ? "हम आपके नंबर पर एक OTP भेजेंगे।" : "We'll send a one-time verification code via SMS."}
                </p>

                {errorBox}

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Phone input with +91 prefix */}
                  <div style={{ display: "flex", borderRadius: 12, border: `1.5px solid ${C.sky}`, overflow: "hidden", background: "rgba(255,255,255,0.6)" }}>
                    <div style={{ padding: "12px 14px", background: "rgba(14,165,233,0.08)", color: C.sky, fontWeight: 800, fontSize: 14, borderRight: `1px solid ${C.sky}`, whiteSpace: "nowrap", display: "flex", alignItems: "center" }}>+91</div>
                    <input
                      type="tel"
                      autoFocus
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                      placeholder="9876543210"
                      style={{ flex: 1, padding: "12px 14px", border: "none", background: "transparent", color: C.txt, fontSize: 16, fontWeight: 600, outline: "none", letterSpacing: 1.5 }}
                    />
                  </div>

                  <button onClick={handleRequestOTP} disabled={loading || identifier.length < 10} style={{ padding: 14, borderRadius: 12, border: "none", background: identifier.length < 10 ? "#ccc" : `linear-gradient(135deg, ${C.sky}, ${C.blue})`, color: "white", fontSize: 14, fontWeight: 800, cursor: loading || identifier.length < 10 ? "not-allowed" : "pointer", boxShadow: identifier.length >= 10 ? `0 8px 24px rgba(14,165,233,0.18)` : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s ease" }}>
                    {loading ? <Spinner size={18} color="white" /> : <><span>{lang === "hi" ? "OTP भेजें" : lang === "mr" ? "OTP पाठवा" : "Send OTP"}</span><MessageSquare size={16} color="white" /></>}
                  </button>

                  <button onClick={() => { setAuthMethod(null); setIdentifier(""); setError(""); }} style={{ background: "none", border: "none", color: C.mut, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    ← {lang === "hi" ? "वापस जाएं" : "Back to options"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── EMAIL / PASSWORD FLOW ── */}
        {authMethod === "email" && (
          <div>
            <p style={{ fontSize: 12, color: C.txt2, marginBottom: 20, lineHeight: 1.5 }}>
              {isLogin
                ? (lang === "hi" ? "सुरक्षित लॉगिन करें।" : "Secure login for your farm account.")
                : (lang === "hi" ? "नया खाता बनाएं।" : "Create your KrishiSense account.")}
            </p>

            {/* Sign In / Register tabs */}
            <div style={{ display: "flex", background: "#e8edea", borderRadius: 14, padding: 4, marginBottom: 20 }}>
              <button type="button" onClick={() => { setIsLogin(true); setError(""); }} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 10, background: isLogin ? C.surface : "transparent", color: isLogin ? C.p2 : C.mut, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.25s ease", boxShadow: isLogin ? "0 4px 10px rgba(18,60,44,0.06)" : "none" }}>
                {lang === "hi" ? "लॉगिन" : "Sign In"}
              </button>
              <button type="button" onClick={() => { setIsLogin(false); setError(""); }} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 10, background: !isLogin ? C.surface : "transparent", color: !isLogin ? C.p2 : C.mut, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.25s ease", boxShadow: !isLogin ? "0 4px 10px rgba(18,60,44,0.06)" : "none" }}>
                {lang === "hi" ? "रजिस्टर" : "Register"}
              </button>
            </div>

            {errorBox}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {!isLogin && (
                <div style={{ display: "flex", flexDirection: "column", textAlign: "left", gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: C.p3, letterSpacing: 0.5 }}>{lang === "hi" ? "पूरा नाम" : "FULL NAME"}</label>
                  <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ramesh Kumar" style={inputStyle} onFocus={e => e.target.style.borderColor = C.p2} onBlur={e => e.target.style.borderColor = C.brd} />
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", textAlign: "left", gap: 4 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: C.p3, letterSpacing: 0.5 }}>{lang === "hi" ? "ईमेल / यूज़रनेम" : "EMAIL / USERNAME"}</label>
                <input type="text" required value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="farmer@domain.com" style={inputStyle} onFocus={e => e.target.style.borderColor = C.p2} onBlur={e => e.target.style.borderColor = C.brd} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", textAlign: "left", gap: 4 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: C.p3, letterSpacing: 0.5 }}>{lang === "hi" ? "पासवर्ड" : "PASSWORD"}</label>
                <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} onFocus={e => e.target.style.borderColor = C.p2} onBlur={e => e.target.style.borderColor = C.brd} />
                {!isLogin && password && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 9, color: C.mut, fontWeight: 600 }}>{pwStrength.desc}</span>
                      <span style={{ fontSize: 9, color: pwStrength.color, fontWeight: 800 }}>{pwStrength.label}</span>
                    </div>
                    <div style={{ height: 4, width: "100%", background: "rgba(18,60,44,0.06)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: pwStrength.width, background: pwStrength.color, transition: "all 0.3s ease" }} />
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading} style={{ padding: 14, borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${C.primary}, ${C.p3})`, color: "white", fontSize: 14, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", boxShadow: `0 8px 24px rgba(22,134,75,0.18)`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {loading ? <Spinner size={18} color="white" /> : <><span>{isLogin ? (lang === "hi" ? "सुरक्षित प्रवेश" : "Sign In Securely") : (lang === "hi" ? "खाता बनाएं" : "Register Account")}</span><KeyRound size={16} color="white" /></>}
              </button>
            </form>

            <button onClick={() => { setAuthMethod(null); setIdentifier(""); setPassword(""); setFullName(""); setError(""); }} style={{ background: "none", border: "none", color: C.mut, fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 16 }}>
              ← {lang === "hi" ? "वापस जाएं" : "Back to options"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
