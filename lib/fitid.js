// ══════════════════════════════════════════
// FIT ID — Encode/decode measurements into shareable IDs
// Format: FIT-{compact alphanumeric code}
// Gender-neutral prefix. Stateless, no database.
// ══════════════════════════════════════════

const PREFIX = 'FIT-';

// Encode a profile into a Fit ID
export function encodeFitId(profile) {
  const data = {};
  if (profile.g) data.g = profile.g === 'male' ? 'm' : 'f';
  if (profile.h) data.h = Math.round(profile.h * 10) / 10;
  if (profile.w) data.w = Math.round(profile.w * 10) / 10;
  if (profile.wa) data.wa = Math.round(profile.wa * 10) / 10;
  if (profile.v) data.v = profile.v;
  if (profile.chest) data.ch = Math.round(profile.chest * 10) / 10;
  if (profile.inseam) data.is = Math.round(profile.inseam * 10) / 10;
  if (profile.shoulder) data.sh = Math.round(profile.shoulder * 10) / 10;

  try {
    const json = JSON.stringify(data);
    const b64 = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `${PREFIX}${b64}`;
  } catch {
    return null;
  }
}

// Decode a Fit ID back to a profile
export function decodeFitId(fitId) {
  if (!fitId) return null;
  const upper = fitId.trim().toUpperCase();

  // Accept FIT- prefix (current) or legacy WMS- prefix
  let payload;
  if (upper.startsWith('FIT-')) payload = fitId.trim().slice(4);
  else if (upper.startsWith('WMS-')) payload = fitId.trim().slice(4);
  else return null;

  try {
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
    const json = atob(padded);
    const data = JSON.parse(json);

    return {
      gender: data.g === 'm' ? 'male' : 'female',
      height: data.h || null,
      weight: data.w || null,
      waist: data.wa || null,
      vibe: data.v || '',
      chest: data.ch || null,
      inseam: data.is || null,
      shoulder: data.sh || null,
    };
  } catch {
    return null;
  }
}

// Check if a string looks like a valid Fit ID
export function isValidFitId(str) {
  if (!str) return false;
  const upper = str.trim().toUpperCase();
  if (!upper.startsWith('FIT-') && !upper.startsWith('WMS-')) return false;
  return decodeFitId(str) !== null;
}
