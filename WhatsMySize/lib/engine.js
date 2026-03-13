// ══════════════════════════════════════════
// PREDICTION ENGINE v2
// Height-aware bottoms, continuous scoring
// ══════════════════════════════════════════

// ── Estimation helpers ──
export function estBust(h, w, g) {
  const hc = h * 2.54, wk = w * 0.4536;
  let c = 41.49 + 0.087 * hc + 0.667 * wk - 0.001087 * hc * wk;
  if (g === "male") c += 0.017 * wk;
  return Math.round(c / 2.54 * 10) / 10;
}

export function estHip(w, g) {
  return g === "female" ? w + 8.5 : w + 5;
}

// Height → size floor for bottoms (too-short penalty)
// Returns minimum size INDEX in the array. Sizes below this get hammered.
function heightSizeFloor(heightIn, gender) {
  if (!heightIn) return -1;
  if (gender === "male") {
    if (heightIn >= 76) return 3;  // 6'4"+ → XL minimum
    if (heightIn >= 73) return 2;  // 6'1"+ → L minimum
    if (heightIn >= 70) return 1;  // 5'10"+ → M minimum
    if (heightIn >= 67) return 0;  // 5'7"+ → S minimum
    return -1;
  } else {
    if (heightIn >= 71) return 3;
    if (heightIn >= 68) return 2;
    if (heightIn >= 65) return 1;
    return -1;
  }
}

// Score a single measurement against a [lo, hi] range → 0-100
function scoreMeasurement(value, lo, hi) {
  if (!value || lo == null || hi == null) return null;
  const mid = (lo + hi) / 2;
  const halfRange = (hi - lo) / 2;
  const dist = Math.abs(value - mid);

  if (dist <= halfRange) {
    return 100 - (dist / halfRange) * 15; // 85-100 within range
  }
  const over = dist - halfRange;
  if (over <= 1) return 84 - over * 12;
  if (over <= 2) return 72 - (over - 1) * 14;
  if (over <= 4) return 58 - (over - 2) * 10;
  return Math.max(20, 38 - (over - 4) * 8);
}

// Main prediction: finds best size + confidence score
export function predict(arr, m, isBottoms = false, heightIn = null, gender = "male") {
  if (!arr) return { s: "N/A", conf: 0 };

  const floor = isBottoms ? heightSizeFloor(heightIn, gender) : -1;
  let bestScore = -1;
  let bestEntry = null;

  for (let idx = 0; idx < arr.length; idx++) {
    const e = arr[idx];
    let scores = [];
    let weights = [];

    if (m.bust && e.bust) {
      const s = scoreMeasurement(m.bust, e.bust[0], e.bust[1]);
      if (s !== null) { scores.push(s); weights.push(isBottoms ? 0.2 : 0.5); }
    }
    if (m.waist && e.waist) {
      const s = scoreMeasurement(m.waist, e.waist[0], e.waist[1]);
      if (s !== null) { scores.push(s); weights.push(isBottoms ? 0.5 : 0.4); }
    }
    if (m.hip && e.hip) {
      const s = scoreMeasurement(m.hip, e.hip[0], e.hip[1]);
      if (s !== null) { scores.push(s); weights.push(isBottoms ? 0.3 : 0.1); }
    }

    if (scores.length === 0) continue;

    let totalW = weights.reduce((a, b) => a + b, 0);
    let weighted = scores.reduce((sum, s, i) => sum + s * weights[i], 0) / totalW;

    // Height penalty for bottoms below the floor
    if (isBottoms && floor >= 0 && idx < floor) {
      weighted -= (floor - idx) * 25;
    }
    // Small boost if height matches this size position
    if (isBottoms && heightIn && floor >= 0 && idx >= floor && idx <= floor + 1) {
      weighted = Math.min(weighted + 3, 100);
    }
    // Penalty for single-measurement predictions
    if (scores.length === 1) weighted = Math.min(weighted, 82);

    if (weighted > bestScore) {
      bestScore = weighted;
      bestEntry = e;
    }
  }

  if (!bestEntry) return { s: "—", conf: 0 };
  return { s: bestEntry.s, conf: Math.max(35, Math.min(99, Math.round(bestScore))) };
}

// "Will this fit?" checker
export function willFit(arr, sLabel, m) {
  if (!arr) return null;
  const e = arr.find(x => x.s === sLabel);
  if (!e) return null;
  let t = 0, n = 0, ok = true;
  [["bust", m.bust], ["waist", m.waist], ["hip", m.hip]].forEach(([k, v]) => {
    if (v && e[k]) {
      const mid = (e[k][0] + e[k][1]) / 2;
      t += v - mid; n++;
      if (v < e[k][0] - 1 || v > e[k][1] + 1) ok = false;
    }
  });
  if (!n) return null;
  const a = t / n;
  if (ok && Math.abs(a) <= 1) return { v: "Perfect fit", e: "💚", c: "#4CAF50", d: "This size should fit you beautifully." };
  if (a > 1 && a <= 3) return { v: "Might be snug", e: "🧡", c: "#FF9800", d: "Consider going up one size." };
  if (a > 3) return { v: "Too small", e: "❤️", c: "#f44336", d: "Definitely go up a size or two." };
  if (a < -1 && a >= -3) return { v: "Might be loose", e: "💙", c: "#2196F3", d: "Could size down for a fitted look." };
  if (a < -3) return { v: "Too roomy", e: "💜", c: "#9C27B0", d: "Size down for a better fit." };
  return { v: "Should work", e: "💚", c: "#4CAF50", d: "Close enough — should be fine." };
}

// Reverse-engineer measurements from a known size
export function getMFromKnown(brand, cat, sLabel, gender) {
  if (!brand) return null;
  const arr = gender === "male" ? (cat === "tops" ? brand.mTops : brand.mBot) : (cat === "tops" ? brand.wTops : brand.wBot);
  if (!arr) return null;
  const x = arr.find(e => e.s === sLabel);
  if (!x) return null;
  return {
    bust: x.bust ? (x.bust[0] + x.bust[1]) / 2 : null,
    waist: x.waist ? (x.waist[0] + x.waist[1]) / 2 : null,
    hip: x.hip ? (x.hip[0] + x.hip[1]) / 2 : null,
  };
}

// Confidence label
export function confLabel(c) {
  if (c >= 90) return { text: "Excellent match", color: "text-emerald-700" };
  if (c >= 80) return { text: "Great match", color: "text-green-600" };
  if (c >= 70) return { text: "Good match", color: "text-lime-600" };
  if (c >= 60) return { text: "Decent match", color: "text-amber-600" };
  return { text: "Rough match", color: "text-red-500" };
}
