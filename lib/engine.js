// ══════════════════════════════════════════
// PREDICTION ENGINE v3
// Two-dimensional: girth fit + length fit
// Height acts as a constraint, not a bonus
// Realism vetoes catch impossible combos
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

// Estimate inseam from height
function estInseam(heightIn, gender) {
  if (!heightIn) return null;
  if (gender === "male") return Math.round((32 + (heightIn - 70) * 0.6) * 10) / 10;
  return Math.round((30 + (heightIn - 65) * 0.55) * 10) / 10;
}

// ── Height classification ──
function heightClass(heightIn, gender) {
  if (!heightIn) return "average";
  if (gender === "male") {
    if (heightIn >= 76) return "very-tall";   // 6'4"+
    if (heightIn >= 73) return "tall";         // 6'1"+
    if (heightIn >= 69) return "average";      // 5'9"+
    if (heightIn >= 66) return "short";        // 5'6"+
    return "very-short";
  } else {
    if (heightIn >= 70) return "very-tall";    // 5'10"+
    if (heightIn >= 67) return "tall";         // 5'7"+
    if (heightIn >= 63) return "average";      // 5'3"+
    if (heightIn >= 60) return "short";        // 5'0"+
    return "very-short";
  }
}

// Does this person need tall/long variants?
export function needsTallInseam(heightIn, gender) {
  if (!heightIn) return false;
  const hc = heightClass(heightIn, gender);
  return hc === "tall" || hc === "very-tall";
}

// Does this person need petite/short variants?
export function needsPetite(heightIn, gender) {
  if (!heightIn) return false;
  const hc = heightClass(heightIn, gender);
  return hc === "short" || hc === "very-short";
}

// ── Score a single measurement against a range → 0-100 ──
function scoreMeasurement(value, lo, hi) {
  if (!value || lo == null || hi == null) return null;
  const mid = (lo + hi) / 2;
  const halfRange = (hi - lo) / 2;
  const dist = Math.abs(value - mid);

  if (dist <= halfRange) {
    return 100 - (dist / halfRange) * 15;
  }
  const over = dist - halfRange;
  if (over <= 1) return 84 - over * 12;
  if (over <= 2) return 72 - (over - 1) * 14;
  if (over <= 4) return 58 - (over - 2) * 10;
  return Math.max(20, 38 - (over - 4) * 8);
}

// ══════════════════════════════════════════
// SIZE INDEX HELPERS
// Maps S/M/L/XL to a numeric tier for height logic
// ══════════════════════════════════════════
function sizeToTier(sizeLabel) {
  const s = sizeLabel.toUpperCase();
  if (s.includes("XXS") || s.includes("XXS") || s.startsWith("0") || s.startsWith("00")) return 0;
  if (s.includes("XS") || s.startsWith("2 ") || s.startsWith("2-")) return 1;
  if (s.startsWith("S ") || s.startsWith("S(") || s === "S" || s.includes("(S)")) return 2;
  if (s.startsWith("M ") || s.startsWith("M(") || s === "M" || s.includes("(M)")) return 3;
  if (s.startsWith("L ") || s.startsWith("L(") || s === "L" || s.includes("(L)") || s.includes("(M/L)")) return 4;
  if (s.includes("XL") && !s.includes("2XL") && !s.includes("XXL")) return 5;
  if (s.includes("2XL") || s.includes("XXL")) return 6;
  // Numeric sizes (jeans, etc.) — estimate tier from waist number
  const num = parseInt(sizeLabel);
  if (!isNaN(num)) {
    if (num <= 25) return 0;
    if (num <= 27) return 1;
    if (num <= 29) return 2;
    if (num <= 32) return 3;
    if (num <= 35) return 4;
    if (num <= 38) return 5;
    return 6;
  }
  return 3; // default to M tier if can't parse
}

// ── Minimum size tier based on height ──
// Returns the minimum acceptable size tier
// For tops: height determines torso/sleeve length needs
// For bottoms: height determines inseam needs
function minSizeTier(heightIn, gender, isBottoms) {
  if (!heightIn) return -1;
  const hc = heightClass(heightIn, gender);

  if (isBottoms) {
    // Bottoms: tall people need bigger sizes for length
    if (hc === "very-tall") return 4;  // L minimum
    if (hc === "tall") return 3;       // M minimum
    return -1;
  } else {
    // Tops: tall people need bigger sizes for torso/sleeve length
    if (hc === "very-tall") return 4;  // L minimum
    if (hc === "tall") return 3;       // M minimum
    return -1;
  }
}

// ══════════════════════════════════════════
// MAIN PREDICTION — v3
// Returns: { s, conf, note }
// note = optional string like "Look for Tall" or "Sized up for length"
// brandInfo = { hasTall, tallCats, tallNote } from brand DB
// ══════════════════════════════════════════
export function predict(arr, m, isBottoms = false, heightIn = null, gender = "male", brandInfo = null) {
  if (!arr) return { s: "N/A", conf: 0, note: null };

  const hc = heightClass(heightIn, gender);
  const minTier = minSizeTier(heightIn, gender, isBottoms);
  const isTall = hc === "tall" || hc === "very-tall";
  const isPetite = hc === "short" || hc === "very-short";

  let candidates = [];

  for (let idx = 0; idx < arr.length; idx++) {
    const e = arr[idx];
    const tier = sizeToTier(e.s);
    let scores = [];
    let weights = [];

    // ── Layer 1: Girth/volume fit ──
    if (m.bust && e.bust) {
      const s = scoreMeasurement(m.bust, e.bust[0], e.bust[1]);
      if (s !== null) { scores.push(s); weights.push(isBottoms ? 0.15 : 0.45); }
    }
    if (m.waist && e.waist) {
      const s = scoreMeasurement(m.waist, e.waist[0], e.waist[1]);
      if (s !== null) { scores.push(s); weights.push(isBottoms ? 0.5 : 0.35); }
    }
    if (m.hip && e.hip) {
      const s = scoreMeasurement(m.hip, e.hip[0], e.hip[1]);
      if (s !== null) { scores.push(s); weights.push(isBottoms ? 0.35 : 0.1); }
    }

    if (scores.length === 0) continue;

    let totalW = weights.reduce((a, b) => a + b, 0);
    let girthScore = scores.reduce((sum, s, i) => sum + s * weights[i], 0) / totalW;

    // ── Layer 2: Length/height adjustment ──
    // Key insight: if brand offers tall, the girth-match size is correct, just get it in tall.
    // If brand does NOT offer tall, must size up for length, which means penalizing the girth-match size.
    let lengthPenalty = 0;
    let note = null;

    const brandHasTallForCat = brandInfo?.hasTall && (
      brandInfo.tallCats === "both" ||
      (isBottoms && brandInfo.tallCats === "bottoms") ||
      (!isBottoms && brandInfo.tallCats === "tops")
    );

    if (heightIn && minTier >= 0) {
      if (tier < minTier) {
        const deficit = minTier - tier;

        if (deficit >= 2) {
          // Way too small regardless of tall availability
          lengthPenalty = 35 + (deficit - 2) * 15;
          note = isBottoms ? "Too short even in tall" : "Too short in torso/sleeves";
        } else if (brandHasTallForCat) {
          // One size below floor BUT brand offers tall → small penalty, recommend tall
          lengthPenalty = 3; // Tiny penalty — tall variant solves the length issue
          const sizeLabel = e.s.replace(/\s*\(.*\)/, '').trim();
          note = isBottoms 
            ? `📏 Get ${sizeLabel} Tall / long inseam` 
            : `📏 Get ${sizeLabel} Tall (${sizeLabel}T)`;
        } else {
          // One size below floor AND no tall available → heavy penalty, must size up
          lengthPenalty = 25;
          note = isBottoms 
            ? "⚠️ No tall available — size up for length" 
            : "⚠️ No tall available — size up for length";
        }
      } else if (tier === minTier && isTall) {
        // Right at the minimum tier
        if (brandHasTallForCat) {
          note = isBottoms ? "📏 Get tall/long inseam" : "📏 Look for tall fit";
        } else {
          note = "Should be OK for length";
        }
      } else if (tier === minTier + 1 && isTall) {
        // One above minimum — good length, might be roomy in girth
        if (brandHasTallForCat) {
          note = "Good fit — or size down and get Tall";
        } else {
          note = "Good length";
        }
      }
    }

    // ── Layer 2b: Petite/short adjustment ──
    if (heightIn && isPetite) {
      // Big sizes on short people will be too long
      const maxTier = gender === "male" ? 4 : 4;
      if (tier > maxTier) {
        lengthPenalty = (tier - maxTier) * 10;
        note = isBottoms ? "May need to hem" : "May run long";
      }
      if (tier >= 2 && isPetite) {
        note = note || (isBottoms ? "Look for short/petite inseam" : "Look for petite fit");
      }
    }

    // ── Layer 3: Realism veto ──
    // Hard penalty for truly impossible combos
    let vetoed = false;
    if (hc === "very-tall" && tier <= 1) {
      // 6'4"+ in XS or S — this is never going to work
      lengthPenalty = 50;
      note = "Would not fit — too short everywhere";
      vetoed = true;
    }
    if (hc === "very-short" && tier >= 5) {
      // Very short in XL+ — swimming in fabric
      lengthPenalty = 30;
      note = "Would be far too long/oversized";
    }

    // ── Combine scores ──
    let finalScore = girthScore - lengthPenalty;

    // Penalty for single-measurement predictions
    if (scores.length === 1) finalScore = Math.min(finalScore, 78);

    // Small boost for sizes in the height sweet spot
    if (heightIn && !vetoed && tier >= minTier && tier <= minTier + 1 && minTier >= 0) {
      finalScore = Math.min(finalScore + 4, 99);
    }

    candidates.push({
      entry: e,
      score: finalScore,
      girthScore,
      lengthPenalty,
      note,
      tier,
      idx,
    });
  }

  if (candidates.length === 0) return { s: "—", conf: 0, note: null };

  // Sort by final score
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  // ── Generate smart note ──
  let finalNote = best.note;

  // If the best girth match got penalized and a bigger size won instead,
  // explain why
  if (!finalNote && heightIn && isTall) {
    finalNote = isBottoms ? "📏 Look for tall/long inseam" : "📏 Look for tall/long fit";
  }

  // If we're recommending a larger size than girth suggests, note it
  const bestGirth = [...candidates].sort((a, b) => b.girthScore - a.girthScore)[0];
  if (bestGirth.idx !== best.idx && best.tier > bestGirth.tier) {
    if (!finalNote) {
      finalNote = "Sized up for length";
    }
  }

  const conf = Math.max(35, Math.min(99, Math.round(best.score)));
  return { s: best.entry.s, conf, note: finalNote || null };
}

// ── "Will this fit?" checker ──
export function willFit(arr, sLabel, m, heightIn = null, gender = "male") {
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

  // Add height context
  let heightNote = "";
  if (heightIn) {
    const hc = heightClass(heightIn, gender);
    if ((hc === "tall" || hc === "very-tall")) {
      heightNote = " Look for tall/long variants for proper length.";
    }
    if ((hc === "short" || hc === "very-short")) {
      heightNote = " May need petite/short length.";
    }
  }

  if (ok && Math.abs(a) <= 1) return { v: "Perfect fit", e: "💚", c: "#4CAF50", d: "This size should fit you beautifully." + heightNote };
  if (a > 1 && a <= 3) return { v: "Might be snug", e: "🧡", c: "#FF9800", d: "Consider going up one size." + heightNote };
  if (a > 3) return { v: "Too small", e: "❤️", c: "#f44336", d: "Definitely go up a size or two." };
  if (a < -1 && a >= -3) return { v: "Might be loose", e: "💙", c: "#2196F3", d: "Could size down for a fitted look." + heightNote };
  if (a < -3) return { v: "Too roomy", e: "💜", c: "#9C27B0", d: "Size down for a better fit." };
  return { v: "Should work", e: "💚", c: "#4CAF50", d: "Close enough — should be fine." + heightNote };
}

// ── Reverse-engineer measurements from a known size ──
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

// ── Confidence label ──
export function confLabel(c) {
  if (c >= 90) return { text: "Excellent match", color: "text-emerald-700" };
  if (c >= 80) return { text: "Great match", color: "text-green-600" };
  if (c >= 70) return { text: "Good match", color: "text-lime-600" };
  if (c >= 60) return { text: "Decent match", color: "text-amber-600" };
  return { text: "Rough match", color: "text-red-500" };
}
