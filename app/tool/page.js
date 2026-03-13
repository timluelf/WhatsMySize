'use client';

import { useState, useMemo, useEffect } from 'react';
import { BRANDS, BRAND_LIST, BRAND_KEYS, CATEGORIES } from '@/lib/brands';
import { estBust, estHip, predict, willFit, getMFromKnown } from '@/lib/engine';
import { encodeFitId, decodeFitId, isValidFitId } from '@/lib/fitid';

const VIBES_F = ["Petite", "Athletic", "Curvy", "Slim", "Busty", "Plus", "Tall", "Average"];
const VIBES_M = ["Athletic", "Slim", "Stocky", "Tall", "Average", "Broad", "Lean", "Plus"];

const THEMES = {
  female: {
    accent: '#D4789C', accentHover: '#B5567A',
    cardGradient: 'linear-gradient(135deg, #D4789C 0%, #B5567A 50%, #D4789C 100%)',
    cardShadow: '0 8px 32px rgba(212,120,156,.3)', cardIdColor: '#FFF176',
    pillActiveBg: '#ec4899', pillActiveText: '#fff', chipActiveBg: '#ec4899',
    btnBg: '#ec4899', btnHoverBg: '#db2777', sizeColor: '#D4789C',
    checkBtnBg: '#fce7f3', checkBtnText: '#D4789C', focusBorder: '#f9a8d4',
    brandLinkColor: '#D4789C',
  },
  male: {
    accent: '#475569', accentHover: '#334155',
    cardGradient: 'linear-gradient(135deg, #334155 0%, #1e293b 50%, #334155 100%)',
    cardShadow: '0 8px 32px rgba(51,65,85,.35)', cardIdColor: '#67E8F9',
    pillActiveBg: '#334155', pillActiveText: '#fff', chipActiveBg: '#334155',
    btnBg: '#334155', btnHoverBg: '#1e293b', sizeColor: '#334155',
    checkBtnBg: '#f1f5f9', checkBtnText: '#475569', focusBorder: '#94a3b8',
    brandLinkColor: '#475569',
  },
};

function genderConfLabel(c) {
  if (c >= 90) return { text: "Excellent match", cls: 'text-emerald-700' };
  if (c >= 80) return { text: "Great match", cls: 'text-green-600' };
  if (c >= 70) return { text: "Good match", cls: 'text-lime-600' };
  if (c >= 60) return { text: "Decent match", cls: 'text-amber-600' };
  return { text: "Rough match", cls: 'text-red-500' };
}

// ── Shared UI ──
function Pill({ children, active, onClick, theme }) {
  const style = active ? { background: theme.pillActiveBg, color: theme.pillActiveText, borderColor: theme.pillActiveBg } : {};
  return (
    <button onClick={onClick}
      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer border ${active ? '' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
      style={style}>{children}</button>
  );
}

function Field({ label, value, onChange, placeholder, theme, type = "number", small = false }) {
  return (
    <div className={small ? "mb-3" : "mb-4"}>
      <label className="block text-xs font-semibold text-text-secondary mb-1.5 tracking-wide">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full bg-cream-200 border-[1.5px] border-cream-300 rounded-card px-4 ${small ? 'py-2.5 text-sm' : 'py-3 text-[15px]'} text-text font-body outline-none transition-colors`}
        onFocus={e => e.target.style.borderColor = theme.focusBorder}
        onBlur={e => e.target.style.borderColor = ''} />
    </div>
  );
}

function Sel({ label, value, onChange, options, theme }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-text-secondary mb-1.5 tracking-wide">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-cream-200 border-[1.5px] border-cream-300 rounded-card px-4 py-3 text-text font-body text-[15px] outline-none cursor-pointer transition-colors"
        onFocus={e => e.target.style.borderColor = theme.focusBorder}
        onBlur={e => e.target.style.borderColor = ''}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

// ══════════════════════════════════════════
// MAIN TOOL
// ══════════════════════════════════════════
export default function ToolPage() {
  const [gender, setGender] = useState("female");
  const [mode, setMode] = useState("measure");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [waistM, setWaistM] = useState("");
  const [kTopBrand, setKTopBrand] = useState("");
  const [kTopSize, setKTopSize] = useState("");
  const [kBotBrand, setKBotBrand] = useState("");
  const [kBotSize, setKBotSize] = useState("");
  const [vibe, setVibe] = useState("");
  const [results, setResults] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check fit
  const [chkBrand, setChkBrand] = useState("");
  const [chkCat, setChkCat] = useState("tops");
  const [chkSize, setChkSize] = useState("");
  const [chkRes, setChkRes] = useState(null);

  // Fit ID lookup
  const [lookupId, setLookupId] = useState("");
  const [lookupError, setLookupError] = useState("");

  // Refinements (optional extra measurements)
  const [showRefine, setShowRefine] = useState(false);
  const [chest, setChest] = useState("");
  const [inseam, setInseam] = useState("");
  const [shoulder, setShoulder] = useState("");

  // Feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [fbBrand, setFbBrand] = useState("");
  const [fbCat, setFbCat] = useState("tops");
  const [fbSize, setFbSize] = useState("");
  const [fbRating, setFbRating] = useState("");
  const [fbSubmitted, setFbSubmitted] = useState(false);

  const t = THEMES[gender];
  const vibes = gender === "female" ? VIBES_F : VIBES_M;
  const phHeight = gender === "female" ? "e.g. 65" : "e.g. 70";
  const phWeight = gender === "female" ? "e.g. 140" : "e.g. 185";
  const phWaist = gender === "female" ? "e.g. 28" : "e.g. 33";

  const topOpts = useMemo(() => {
    if (!kTopBrand) return [];
    const b = BRANDS[kTopBrand]; const a = gender === "male" ? b?.mTops : b?.wTops;
    return a ? a.map(x => ({ v: x.s, l: x.s })) : [];
  }, [kTopBrand, gender]);

  const botOpts = useMemo(() => {
    if (!kBotBrand) return [];
    const b = BRANDS[kBotBrand]; const a = gender === "male" ? b?.mBot : b?.wBot;
    return a ? a.map(x => ({ v: x.s, l: x.s })) : [];
  }, [kBotBrand, gender]);

  const chkOpts = useMemo(() => {
    if (!chkBrand) return [];
    const b = BRANDS[chkBrand];
    const a = gender === "male" ? (chkCat === "tops" ? b?.mTops : b?.mBot) : (chkCat === "tops" ? b?.wTops : b?.wBot);
    return a ? a.map(x => ({ v: x.s, l: x.s })) : [];
  }, [chkBrand, chkCat, gender]);

  const fbOpts = useMemo(() => {
    if (!fbBrand) return [];
    const b = BRANDS[fbBrand];
    const a = gender === "male" ? (fbCat === "tops" ? b?.mTops : b?.mBot) : (fbCat === "tops" ? b?.wTops : b?.wBot);
    return a ? a.map(x => ({ v: x.s, l: x.s })) : [];
  }, [fbBrand, fbCat, gender]);

  const bOpts = useMemo(() => [
    { v: "", l: "Select brand..." },
    ...BRAND_KEYS.filter(k => gender === "male" ? !!BRANDS[k]?.mTops : !!BRANDS[k]?.wTops).map(k => ({ v: k, l: BRANDS[k].name }))
  ], [gender]);

  const bOptsBot = useMemo(() => [
    { v: "", l: "Select brand..." },
    ...BRAND_KEYS.filter(k => gender === "male" ? !!BRANDS[k]?.mBot : !!BRANDS[k]?.wBot).map(k => ({ v: k, l: BRANDS[k].name }))
  ], [gender]);

  const bOptsAll = useMemo(() => [
    { v: "", l: "Select brand..." },
    ...BRAND_KEYS.filter(k => {
      const b = BRANDS[k];
      return gender === "male" ? (!!b?.mTops || !!b?.mBot) : (!!b?.wTops || !!b?.wBot);
    }).map(k => ({ v: k, l: BRANDS[k].name }))
  ], [gender]);

  // Build measurements object from current state
  function buildMeasurements() {
    const hVal = parseFloat(height);
    const wVal = parseFloat(weight);
    const waVal = parseFloat(waistM);
    const chVal = parseFloat(chest);
    let m = { bust: null, waist: null, hip: null };

    if (mode === "measure" || results) {
      // Use direct chest if provided, otherwise estimate
      if (chVal) { m.bust = chVal; }
      else if (hVal && wVal) { m.bust = estBust(hVal, wVal, gender); }
      if (waVal) { m.waist = waVal; m.hip = estHip(waVal, gender); }
    } else {
      if (kTopBrand && kTopSize) {
        const tm = getMFromKnown(BRANDS[kTopBrand], "tops", kTopSize, gender);
        if (tm) { m.bust = tm.bust; if (tm.waist) m.waist = tm.waist; }
      }
      if (kBotBrand && kBotSize) {
        const bm = getMFromKnown(BRANDS[kBotBrand], "bottoms", kBotSize, gender);
        if (bm) { if (bm.waist) m.waist = bm.waist; if (bm.hip) m.hip = bm.hip; }
      }
    }
    return m;
  }

  function runPredictions(m, heightIn) {
    const preds = BRAND_LIST.map(b => {
      const tA = gender === "male" ? b.mTops : b.wTops;
      const bA = gender === "male" ? b.mBot : b.wBot;
      const brandInfo = { hasTall: b.hasTall, tallCats: b.tallCats, tallNote: b.tallNote };
      return {
        brand: b,
        top: predict(tA, m, false, heightIn, gender, brandInfo),
        bot: predict(bA, m, true, heightIn, gender, brandInfo),
      };
    }).filter(p => p.top.s !== "N/A" || p.bot.s !== "N/A");
    preds.sort((a, b) => Math.max(b.top.conf, b.bot.conf) - Math.max(a.top.conf, a.bot.conf));
    return preds;
  }

  function run() {
    const m = buildMeasurements();
    if (!m.bust && !m.waist && !m.hip) return;
    const heightIn = parseFloat(height) || null;
    const preds = runPredictions(m, heightIn);
    setResults({ m, preds, heightIn });
    setShowAll(false); setChkRes(null);
  }

  // Recalculate when refinements change
  function recalculate() {
    const m = buildMeasurements();
    if (!m.bust && !m.waist && !m.hip) return;
    const heightIn = parseFloat(height) || null;
    const preds = runPredictions(m, heightIn);
    setResults({ m, preds, heightIn });
  }

  // Fit ID lookup
  function handleLookup() {
    const trimmed = lookupId.trim();
    if (!trimmed) { setLookupError("Enter a Fit ID"); return; }
    const profile = decodeFitId(trimmed);
    if (!profile) { setLookupError("Invalid Fit ID. Check the code and try again."); return; }
    setLookupError("");
    // Restore profile
    setGender(profile.gender);
    if (profile.height) setHeight(String(profile.height));
    if (profile.weight) setWeight(String(profile.weight));
    if (profile.waist) setWaistM(String(profile.waist));
    if (profile.vibe) setVibe(profile.vibe);
    if (profile.chest) setChest(String(profile.chest));
    if (profile.inseam) setInseam(String(profile.inseam));
    if (profile.shoulder) setShoulder(String(profile.shoulder));
    setMode("measure");
    // Fire gender change for nav
    window.dispatchEvent(new CustomEvent('genderchange', { detail: profile.gender }));
    // Run after state settles
    setTimeout(() => {
      const hVal = profile.height, wVal = profile.weight, waVal = profile.waist, chVal = profile.chest;
      let m = { bust: null, waist: null, hip: null };
      if (chVal) { m.bust = chVal; }
      else if (hVal && wVal) { m.bust = estBust(hVal, wVal, profile.gender); }
      if (waVal) { m.waist = waVal; m.hip = estHip(waVal, profile.gender); }
      if (!m.bust && !m.waist && !m.hip) return;
      const preds = BRAND_LIST.map(b => {
        const tA = profile.gender === "male" ? b.mTops : b.wTops;
        const bA = profile.gender === "male" ? b.mBot : b.wBot;
        const bi = { hasTall: b.hasTall, tallCats: b.tallCats, tallNote: b.tallNote };
        return { brand: b, top: predict(tA, m, false, hVal, profile.gender, bi), bot: predict(bA, m, true, hVal, profile.gender, bi) };
      }).filter(p => p.top.s !== "N/A" || p.bot.s !== "N/A");
      preds.sort((a, b) => Math.max(b.top.conf, b.bot.conf) - Math.max(a.top.conf, a.bot.conf));
      setResults({ m, preds, heightIn: hVal });
    }, 50);
  }

  function switchGender(g) {
    setGender(g);
    setKTopBrand(""); setKBotBrand(""); setKTopSize(""); setKBotSize("");
    setVibe(""); setResults(null); setChest(""); setInseam(""); setShoulder("");
    window.dispatchEvent(new CustomEvent('genderchange', { detail: g }));
  }

  // Generate the encoded Fit ID
  const fitId = useMemo(() => {
    if (!results) return null;
    return encodeFitId({
      g: gender,
      h: parseFloat(height) || null,
      w: parseFloat(weight) || null,
      wa: parseFloat(waistM) || null,
      v: vibe || null,
      chest: parseFloat(chest) || null,
      inseam: parseFloat(inseam) || null,
      shoulder: parseFloat(shoulder) || null,
    });
  }, [results, gender, height, weight, waistM, vibe, chest, inseam, shoulder]);

  const canRun = mode === "measure" ? ((height && weight) || waistM) : (kTopBrand && kTopSize) || (kBotBrand && kBotSize);
  const topResultsArr = results ? results.preds.slice(0, 5) : [];
  const restResults = results ? results.preds.slice(5) : [];

  const grouped = useMemo(() => {
    if (!results) return {};
    const all = showAll ? results.preds : topResultsArr;
    const g = {};
    all.forEach(p => { const c = p.brand.cat; if (!g[c]) g[c] = []; g[c].push(p); });
    return g;
  }, [results, showAll]);

  // ═══════════ FORM VIEW ═══════════
  if (!results) {
    return (
      <div className="pt-24 pb-16 px-5 max-w-lg mx-auto">
        <h1 className="font-display text-3xl mb-1 text-center">Find your perfect size</h1>
        <p className="text-text-secondary text-sm mb-6 text-center">{BRAND_LIST.length} brands. Takes 20 seconds.</p>

        {/* Gender */}
        <div className="flex gap-2 justify-center mb-5">
          {["female", "male"].map(g => (
            <Pill key={g} active={gender === g} onClick={() => switchGender(g)} theme={THEMES[g]}>
              {g === "female" ? "Women's" : "Men's"}
            </Pill>
          ))}
        </div>

        {/* Mode */}
        <div className="flex gap-2 justify-center mb-6">
          {[{ k: "measure", l: "My measurements" }, { k: "known", l: "I know my size" }].map(m => (
            <Pill key={m.k} active={mode === m.k} onClick={() => setMode(m.k)} theme={t}>{m.l}</Pill>
          ))}
        </div>

        <div className="bg-white border rounded-2xl p-6 transition-all duration-300" style={{ borderColor: `${t.accent}25` }}>
          {mode === "measure" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Height (inches)" value={height} onChange={setHeight} placeholder={phHeight} theme={t} />
                <Field label="Weight (lbs)" value={weight} onChange={setWeight} placeholder={phWeight} theme={t} />
              </div>
              <Field label="Waist (inches)" value={waistM} onChange={setWaistM} placeholder={phWaist} theme={t} />
              <p className="text-xs text-text-muted leading-relaxed">
                Height + weight estimates {gender === "female" ? "bust" : "chest"}. Waist predicts bottoms.{' '}
                <strong className="text-text-secondary">Height is critical for bottoms</strong> — it determines length.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-sm mb-3">What top fits you well?</p>
              <Sel label="Brand" value={kTopBrand} onChange={v => { setKTopBrand(v); setKTopSize(""); }} options={bOpts} theme={t} />
              {kTopBrand && <Sel label="Your size" value={kTopSize} onChange={setKTopSize} options={[{ v: "", l: "Select..." }, ...topOpts]} theme={t} />}
              <p className="font-semibold text-sm mb-3 mt-4">What bottoms fit you well?</p>
              <Sel label="Brand" value={kBotBrand} onChange={v => { setKBotBrand(v); setKBotSize(""); }} options={bOptsBot} theme={t} />
              {kBotBrand && <Sel label="Your size" value={kBotSize} onChange={setKBotSize} options={[{ v: "", l: "Select..." }, ...botOpts]} theme={t} />}
              <p className="text-xs text-text-muted mt-2">Fill in at least one. Both = better results.</p>
              <div className="mt-4">
                <Field label="Your height (inches, optional — improves bottoms)" value={height} onChange={setHeight} placeholder={phHeight} theme={t} />
              </div>
            </>
          )}

          <button onClick={run} disabled={!canRun}
            className="w-full mt-5 py-4 rounded-2xl font-semibold text-base text-white transition-all"
            style={canRun ? { background: t.btnBg, cursor: 'pointer' } : { background: '#d1d5db', color: '#9ca3af', cursor: 'not-allowed' }}
            onMouseEnter={e => { if (canRun) e.target.style.background = t.btnHoverBg; }}
            onMouseLeave={e => { if (canRun) e.target.style.background = t.btnBg; }}>
            Get My Sizes
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-cream-300" />
          <span className="text-xs text-text-muted font-medium">or load an existing profile</span>
          <div className="flex-1 h-px bg-cream-300" />
        </div>

        {/* Fit ID Lookup */}
        <div className="bg-white border border-cream-300 rounded-2xl p-4">
          <p className="font-semibold text-sm mb-1">Have a Fit ID?</p>
          <p className="text-text-muted text-xs mb-3">Enter it to load your profile instantly — great for gift shopping</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={lookupId}
              onChange={e => { setLookupId(e.target.value); setLookupError(""); }}
              placeholder="FIT-..."
              className="flex-1 bg-cream-200 border-[1.5px] border-cream-300 rounded-xl px-3 py-2.5 text-sm font-mono text-text outline-none transition-colors"
              onFocus={e => e.target.style.borderColor = t.focusBorder}
              onBlur={e => e.target.style.borderColor = ''}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
            />
            <button onClick={handleLookup}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ background: t.btnBg }}
              onMouseEnter={e => e.target.style.background = t.btnHoverBg}
              onMouseLeave={e => e.target.style.background = t.btnBg}>
              Load
            </button>
          </div>
          {lookupError && <p className="text-red-500 text-xs mt-2">{lookupError}</p>}
        </div>
      </div>
    );
  }

  // ═══════════ RESULTS VIEW ═══════════
  return (
    <div className="pt-20 pb-10 px-4 max-w-lg mx-auto">
      {/* Fit ID Card */}
      <div onClick={() => setResults(null)}
        className="rounded-3xl p-6 mb-7 cursor-pointer relative overflow-hidden"
        style={{ background: t.cardGradient, boxShadow: t.cardShadow }}>
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-5 -left-5 w-20 h-20 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-[.15em] font-semibold">Your Fit ID</p>
              <p className="font-mono text-lg font-bold mt-1 tracking-wide break-all" style={{ color: t.cardIdColor }}>{fitId}</p>
              {vibe && (
                <div className="inline-flex items-center gap-1 mt-1.5 bg-white/10 rounded-full px-3 py-1">
                  <span className="text-xs text-white/85 font-medium">{vibe}</span>
                </div>
              )}
              <p className="text-[10px] text-white/40 mt-2">Save this code to reload your profile anytime</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <button onClick={e => {
                  e.stopPropagation();
                  navigator.clipboard?.writeText(fitId);
                  setCopied(true); setTimeout(() => setCopied(false), 2000);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold backdrop-blur-sm transition-all bg-white/10 border border-white/15 text-white/85 hover:bg-white/20"
                style={copied ? { background: `${t.cardIdColor}33`, borderColor: `${t.cardIdColor}66`, color: t.cardIdColor } : {}}>
                {copied ? "Copied!" : "Copy ID"}
              </button>
              <p className="text-[10px] text-white/35">Tap card to edit</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Refine Measurements ── */}
      <div className="bg-white border rounded-2xl mb-5 overflow-hidden" style={{ borderColor: `${t.accent}20` }}>
        <button onClick={() => setShowRefine(!showRefine)}
          className="w-full p-4 flex justify-between items-center text-left">
          <div>
            <p className="font-semibold text-sm">Refine your profile</p>
            <p className="text-text-muted text-xs">Add chest, inseam, or shoulder for better accuracy</p>
          </div>
          <span className={`text-text-muted transition-transform ${showRefine ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {showRefine && (
          <div className="px-4 pb-4 border-t border-cream-200 pt-3">
            {/* Body type */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-text-secondary mb-2 tracking-wide">Body type</label>
              <div className="flex gap-1.5 flex-wrap">
                {vibes.map(v => (
                  <button key={v} onClick={() => setVibe(vibe === v ? "" : v)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border"
                    style={vibe === v
                      ? { background: t.chipActiveBg, color: '#fff', borderColor: t.chipActiveBg }
                      : { background: '#F5F0E8', color: '#6B6560', borderColor: '#E8E0D4' }
                    }>{v}</button>
                ))}
              </div>
            </div>
            {/* Extra measurements */}
            <div className="grid grid-cols-3 gap-2">
              <Field label={gender === "female" ? "Bust (in)" : "Chest (in)"} value={chest} onChange={setChest} placeholder="e.g. 42" theme={t} small />
              <Field label="Inseam (in)" value={inseam} onChange={setInseam} placeholder="e.g. 34" theme={t} small />
              <Field label="Shoulder (in)" value={shoulder} onChange={setShoulder} placeholder="e.g. 19" theme={t} small />
            </div>
            <button onClick={recalculate}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: t.checkBtnBg, color: t.checkBtnText }}>
              Update results
            </button>
            <p className="text-[10px] text-text-muted mt-2 text-center">Everything here gets saved in your Fit ID automatically</p>
          </div>
        )}
      </div>

      {/* Results header */}
      <h2 className="font-display text-2xl mb-1">Your sizes</h2>
      <p className="text-text-secondary text-sm mb-5">
        {gender === "female" ? "Women's" : "Men's"} · Top {showAll ? results.preds.length : Math.min(5, results.preds.length)} matches
      </p>

      {/* Grouped results */}
      {Object.entries(grouped).map(([catKey, preds]) => (
        <div key={catKey} className="mb-5">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{CATEGORIES[catKey] || catKey}</p>
          <div className="grid gap-2">
            {preds.map(({ brand: b, top, bot }) => {
              const fitColor = b.big ? 'text-amber-600' : b.small ? 'text-blue-600' : 'text-emerald-600';
              const fitText = b.big ? 'Runs Big' : b.small ? 'Runs Small' : 'TTS';
              return (
                <div key={b.slug} className="bg-white border rounded-2xl p-4" style={{ borderColor: `${t.accent}18` }}>
                  <div className="flex justify-between items-center mb-2.5">
                    <div className="flex items-center gap-2">
                      <a href={`/brands/${b.slug}`} className="font-semibold text-sm hover:opacity-70 transition-opacity" style={{ color: t.brandLinkColor }}>{b.name}</a>
                      <span className={`text-[10px] font-semibold ${fitColor}`}>{fitText}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {top.s !== "N/A" && (
                      <div className="bg-cream-200 rounded-xl px-3 py-2.5">
                        <p className="text-[10px] text-text-muted mb-0.5">Tops</p>
                        <p className="text-lg font-bold" style={{ color: t.sizeColor }}>{top.s}</p>
                        {(() => { const cl = genderConfLabel(top.conf); return <p className={`text-[10px] ${cl.cls}`}>{cl.text} · {top.conf}%</p>; })()}
                        {top.note && <p className="text-[9px] text-amber-600 mt-1">{top.note}</p>}
                      </div>
                    )}
                    {bot.s !== "N/A" && (
                      <div className="bg-cream-200 rounded-xl px-3 py-2.5">
                        <p className="text-[10px] text-text-muted mb-0.5">Bottoms</p>
                        <p className="text-lg font-bold" style={{ color: t.sizeColor }}>{bot.s}</p>
                        {(() => { const cl = genderConfLabel(bot.conf); return <p className={`text-[10px] ${cl.cls}`}>{cl.text} · {bot.conf}%</p>; })()}
                        {bot.note && <p className="text-[9px] text-amber-600 mt-1">{bot.note}</p>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Show more */}
      {!showAll && restResults.length > 0 && (
        <button onClick={() => setShowAll(true)}
          className="w-full bg-white border rounded-2xl p-3.5 text-sm font-semibold text-text-secondary hover:opacity-80 transition-all mb-5"
          style={{ borderColor: `${t.accent}20` }}>
          Show {restResults.length} more brands
        </button>
      )}

      {/* Will this fit? */}
      <div className="bg-white border rounded-2xl p-5 mt-2" style={{ borderColor: `${t.accent}20` }}>
        <p className="font-semibold text-[15px] mb-1">Will this fit me?</p>
        <p className="text-text-secondary text-xs mb-4">Check a specific brand + size</p>
        <Sel label="Brand" value={chkBrand} onChange={v => { setChkBrand(v); setChkSize(""); setChkRes(null); }} options={bOptsAll} theme={t} />
        <Sel label="Category" value={chkCat} onChange={v => { setChkCat(v); setChkSize(""); setChkRes(null); }} options={[{ v: "tops", l: "Tops" }, { v: "bottoms", l: "Bottoms" }]} theme={t} />
        {chkBrand && <Sel label="Size" value={chkSize} onChange={v => { setChkSize(v); setChkRes(null); }} options={[{ v: "", l: "Select..." }, ...chkOpts]} theme={t} />}
        <button onClick={() => {
            if (!chkBrand || !chkSize || !results) return;
            const b = BRANDS[chkBrand];
            const arr = gender === "male" ? (chkCat === "tops" ? b.mTops : b.mBot) : (chkCat === "tops" ? b.wTops : b.wBot);
            const r = willFit(arr, chkSize, results.m);
            setChkRes({ b, size: chkSize, cat: chkCat, r });
          }}
          disabled={!chkBrand || !chkSize}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-colors"
          style={chkBrand && chkSize ? { background: t.checkBtnBg, color: t.checkBtnText, cursor: 'pointer' } : { background: '#F5F0E8', color: '#9B9590', cursor: 'not-allowed' }}>
          Check fit
        </button>
        {chkRes?.r && (
          <div className="mt-3 p-3.5 rounded-xl" style={{ background: chkRes.r.c + '10', border: `1px solid ${chkRes.r.c}30` }}>
            <p className="text-base mb-1"><span className="mr-1.5">{chkRes.r.e}</span><strong style={{ color: chkRes.r.c }}>{chkRes.r.v}</strong></p>
            <p className="text-sm text-text">{chkRes.b.name} {chkRes.size}: {chkRes.r.d}</p>
          </div>
        )}
      </div>

      {/* ── Feedback Loop ── */}
      <div className="bg-white border rounded-2xl mt-4 overflow-hidden" style={{ borderColor: `${t.accent}20` }}>
        <button onClick={() => { setShowFeedback(!showFeedback); setFbSubmitted(false); }}
          className="w-full p-4 flex justify-between items-center text-left">
          <div>
            <p className="font-semibold text-sm">Did a size work?</p>
            <p className="text-text-muted text-xs">Tell us what you tried — it helps everyone</p>
          </div>
          <span className={`text-text-muted transition-transform ${showFeedback ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {showFeedback && (
          <div className="px-4 pb-4 border-t border-cream-200 pt-3">
            {fbSubmitted ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-2">🎉</p>
                <p className="font-semibold text-sm">Thanks! Your feedback helps us get smarter.</p>
                <p className="text-text-muted text-xs mt-1">Every rating makes our predictions more accurate for everyone.</p>
                <button onClick={() => { setFbSubmitted(false); setFbBrand(""); setFbSize(""); setFbRating(""); }}
                  className="mt-3 text-xs font-medium underline" style={{ color: t.accent }}>
                  Submit another
                </button>
              </div>
            ) : (
              <>
                <Sel label="Brand you tried" value={fbBrand} onChange={v => { setFbBrand(v); setFbSize(""); }} options={bOptsAll} theme={t} />
                <Sel label="Category" value={fbCat} onChange={v => { setFbCat(v); setFbSize(""); }} options={[{ v: "tops", l: "Tops" }, { v: "bottoms", l: "Bottoms" }]} theme={t} />
                {fbBrand && <Sel label="Size you bought" value={fbSize} onChange={setFbSize} options={[{ v: "", l: "Select..." }, ...fbOpts]} theme={t} />}
                {fbSize && (
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-text-secondary mb-2 tracking-wide">How did it fit?</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { v: "too-small", l: "Too small", e: "😤" },
                        { v: "snug", l: "Snug", e: "😐" },
                        { v: "perfect", l: "Perfect", e: "😍" },
                        { v: "loose", l: "Loose", e: "🤔" },
                        { v: "too-big", l: "Too big", e: "😩" },
                      ].map(r => (
                        <button key={r.v} onClick={() => setFbRating(r.v)}
                          className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-center transition-all border"
                          style={fbRating === r.v
                            ? { background: t.checkBtnBg, borderColor: t.accent, color: t.accent }
                            : { background: '#F5F0E8', borderColor: '#E8E0D4', color: '#6B6560' }
                          }>
                          <span className="text-lg">{r.e}</span>
                          <span className="text-[10px] font-medium leading-tight">{r.l}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => {
                    if (!fbBrand || !fbSize || !fbRating) return;
                    // For now: log to console. When you add a backend, POST this data.
                    console.log('FIT FEEDBACK:', {
                      fitId,
                      gender,
                      measurements: results.m,
                      brand: BRANDS[fbBrand]?.name,
                      category: fbCat,
                      size: fbSize,
                      rating: fbRating,
                      timestamp: new Date().toISOString(),
                    });
                    setFbSubmitted(true);
                  }}
                  disabled={!fbBrand || !fbSize || !fbRating}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-colors"
                  style={fbBrand && fbSize && fbRating
                    ? { background: t.btnBg, color: '#fff', cursor: 'pointer' }
                    : { background: '#F5F0E8', color: '#9B9590', cursor: 'not-allowed' }
                  }>
                  Submit feedback
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
