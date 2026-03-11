import { useState, useEffect, useMemo } from "react";

/*
 ═══════════════════════════════════════════════════════
 WHATSMYSIZE.AI — Fit Prediction Engine
 Pure data. No AI. No avatars. No gimmicks.
 ═══════════════════════════════════════════════════════
*/

// ── CHEST ESTIMATION from height + weight ──
// Based on NHANES regression model (R²=0.815)
function estBust(hIn, wLbs, gender) {
  const h = hIn * 2.54, w = wLbs * 0.4536;
  let c = 41.49 + 0.087 * h + 0.667 * w - 0.001087 * h * w;
  if (gender === "male") c += 0.017 * w;
  return Math.round((c / 2.54) * 10) / 10;
}
function estHip(waist, gender) {
  return gender === "female" ? waist + 8.5 : waist + 5;
}

// ── BRAND DATABASE ──
// M = men's, W = women's. All measurements in inches (body).
const DB = {
  // ═══════ NIKE ═══════
  nike: { name:"Nike", i:"NK", c:"#FA5722",
    tag:"Runs true to size", big:false, small:false, tts:true,
    mNote:"Standard American sizing. Dri-FIT is slightly more fitted than cotton.",
    wNote:"Women's runs true to size. Between sizes, go up for relaxed fit.",
    mTops:[
      {s:"XS",bust:[31.5,35],waist:[25.5,29]},{s:"S",bust:[35,37.5],waist:[29,32]},
      {s:"M",bust:[37.5,41],waist:[32,35]},{s:"L",bust:[41,44],waist:[35,38]},
      {s:"XL",bust:[44,48.5],waist:[38,43]},{s:"2XL",bust:[48.5,53.5],waist:[43,47.5]}
    ],
    mBot:[
      {s:"S (28-30)",waist:[29,32],hip:[35,37.5]},{s:"M (32-34)",waist:[32,35],hip:[37.5,41]},
      {s:"L (34-36)",waist:[35,38],hip:[41,44]},{s:"XL (38-40)",waist:[38,43],hip:[44,47]}
    ],
    wTops:[
      {s:"XS (0-2)",bust:[29.5,32.5],waist:[23.5,26]},{s:"S (4-6)",bust:[32.5,35.5],waist:[26,29]},
      {s:"M (8-10)",bust:[35.5,38],waist:[29,31.5]},{s:"L (12-14)",bust:[38,41],waist:[31.5,34.5]},
      {s:"XL (16-18)",bust:[41,44.5],waist:[34.5,38.5]}
    ],
    wBot:[
      {s:"XS (0-2)",waist:[23.5,26],hip:[33,35.5]},{s:"S (4-6)",waist:[26,29],hip:[35.5,38.5]},
      {s:"M (8-10)",waist:[29,31.5],hip:[38.5,41]},{s:"L (12-14)",waist:[31.5,34.5],hip:[41,44]},
      {s:"XL (16-18)",waist:[34.5,38.5],hip:[44,47]}
    ]
  },
  // ═══════ CARHARTT ═══════
  carhartt: { name:"Carhartt", i:"CT", c:"#C4922A",
    tag:"Runs big — size down", big:true, small:false, tts:false,
    mNote:"Cut generously for layering. Size down for modern fit. Chest runs 2-4\" wider than Nike at same label.",
    wNote:"Women's line is more fitted than men's but still runs slightly large compared to fashion brands.",
    mTops:[
      {s:"S",bust:[34,36],waist:[28,30]},{s:"M",bust:[38,40],waist:[32,34]},
      {s:"L",bust:[42,44],waist:[36,38]},{s:"XL",bust:[46,48],waist:[40,42]},
      {s:"2XL",bust:[50,52],waist:[44,46]}
    ],
    mBot:[
      {s:"30",waist:[28,30],hip:[34,36]},{s:"32-34",waist:[32,34],hip:[38,40]},
      {s:"36-38",waist:[36,38],hip:[42,44]},{s:"40-42",waist:[40,42],hip:[46,48]}
    ],
    wTops:[
      {s:"XS (0-2)",bust:[33,35],waist:[25,27]},{s:"S (4-6)",bust:[35,37],waist:[27,29]},
      {s:"M (8-10)",bust:[37,40],waist:[29,32]},{s:"L (12-14)",bust:[40,43],waist:[32,35]},
      {s:"XL (16-18)",bust:[43,46],waist:[35,38]}
    ],
    wBot:[
      {s:"S (4-6)",waist:[27,29],hip:[36,38]},{s:"M (8-10)",waist:[29,32],hip:[38,41]},
      {s:"L (12-14)",waist:[32,35],hip:[41,44]},{s:"XL (16-18)",waist:[35,38],hip:[44,47]}
    ]
  },
  // ═══════ LEVI'S ═══════
  levis: { name:"Levi's", i:"LV", c:"#D32F2F",
    tag:"True to size — fits vary by number (501/511/541)", big:false, small:false, tts:true,
    mNote:"501=classic straight, 511=slim, 541=athletic. Shrink-to-Fit: buy 1-2\" up.",
    wNote:"Women's jeans use numeric waist sizing. 721=high rise skinny, 501=original, 94=baggy. Stretch denim is forgiving.",
    mTops:[
      {s:"S",bust:[35,37.5],waist:[29,31.5]},{s:"M",bust:[37.5,41],waist:[31.5,35]},
      {s:"L",bust:[41,44],waist:[35,38]},{s:"XL",bust:[44,48],waist:[38,42]}
    ],
    mBot:[
      {s:"28",waist:[28,29],hip:[34,35]},{s:"30",waist:[30,31],hip:[36,37]},
      {s:"32",waist:[32,33],hip:[38,39]},{s:"34",waist:[34,35],hip:[40,41]},
      {s:"36",waist:[36,37],hip:[42,43]},{s:"38",waist:[38,39],hip:[44,45]},
      {s:"40",waist:[40,41],hip:[46,47]}
    ],
    wTops:[
      {s:"XS",bust:[32,34],waist:[24,26]},{s:"S",bust:[34,36],waist:[26,28]},
      {s:"M",bust:[36,38.5],waist:[28,31]},{s:"L",bust:[38.5,41],waist:[31,34]},
      {s:"XL",bust:[41,44],waist:[34,37]}
    ],
    wBot:[
      {s:"24",waist:[24,25],hip:[34,35]},{s:"25",waist:[25,26],hip:[35,36]},
      {s:"26",waist:[26,27],hip:[36,37]},{s:"27",waist:[27,28],hip:[37,38]},
      {s:"28",waist:[28,29],hip:[38,39]},{s:"29",waist:[29,30],hip:[39,40]},
      {s:"30",waist:[30,31],hip:[40,41]},{s:"31",waist:[31,32],hip:[41,42]},
      {s:"32",waist:[32,33],hip:[42,43]}
    ]
  },
  // ═══════ LULULEMON ═══════
  lululemon: { name:"Lululemon", i:"LL", c:"#B71C1C",
    tag:"Runs slightly small — size up for relaxed fit", big:false, small:true, tts:false,
    mNote:"Tailored athletic fit. Nike L wearers may need XL here. ABC pants more true-to-size.",
    wNote:"Leggings run true to bra band size. Tops with built-in bras run small — size up. Dresses run small.",
    mTops:[
      {s:"S",bust:[37,38],waist:[29,30]},{s:"M",bust:[39,40],waist:[31,32]},
      {s:"L",bust:[42,43],waist:[34,35]},{s:"XL",bust:[45,46],waist:[37,38]}
    ],
    mBot:[
      {s:"S (30)",waist:[29,30],hip:[35,36]},{s:"M (32)",waist:[31,32],hip:[37,38]},
      {s:"L (34)",waist:[34,35],hip:[40,41]},{s:"XL (36)",waist:[37,38],hip:[43,44]}
    ],
    wTops:[
      {s:"2 (XXS)",bust:[30,31],waist:[23,24]},{s:"4 (XS)",bust:[32,33],waist:[25,26]},
      {s:"6 (S)",bust:[34,35],waist:[27,28]},{s:"8 (M)",bust:[36,37],waist:[29,30]},
      {s:"10 (L)",bust:[38,39],waist:[31,32]},{s:"12 (XL)",bust:[40,41],waist:[33,34]}
    ],
    wBot:[
      {s:"2 (XXS)",waist:[23,24],hip:[33,34]},{s:"4 (XS)",waist:[25,26],hip:[35,36]},
      {s:"6 (S)",waist:[27,28],hip:[37,38]},{s:"8 (M)",waist:[29,30],hip:[39,40]},
      {s:"10 (L)",waist:[31,32],hip:[41,42]},{s:"12 (XL)",waist:[33,34],hip:[43,44]}
    ]
  },
  // ═══════ ADIDAS ═══════
  adidas: { name:"Adidas", i:"AD", c:"#1A1A1A",
    tag:"True to size — Originals line slightly slim", big:false, small:false, tts:true,
    mNote:"European heritage means slightly narrower shoulders than American brands.",
    wNote:"Women's runs true to size. Performance line is consistent. Originals can feel a touch narrow.",
    mTops:[
      {s:"S",bust:[34.5,36],waist:[29.5,31.5]},{s:"M",bust:[36.5,39],waist:[32,34.5]},
      {s:"L",bust:[39.5,42.5],waist:[35,38]},{s:"XL",bust:[43,46.5],waist:[38.5,42]}
    ],
    mBot:[
      {s:"S (28-30)",waist:[30,32],hip:[35,37]},{s:"M (32-34)",waist:[32,35],hip:[37,40]},
      {s:"L (34-36)",waist:[35,39],hip:[40,44]},{s:"XL (38-40)",waist:[39,43],hip:[44,48]}
    ],
    wTops:[
      {s:"XS (0-2)",bust:[30.5,32.5],waist:[23.5,25.5]},{s:"S (4-6)",bust:[32.5,35],waist:[25.5,28]},
      {s:"M (8-10)",bust:[35,38],waist:[28,31]},{s:"L (12-14)",bust:[38,41],waist:[31,34]},
      {s:"XL (16-18)",bust:[41,44.5],waist:[34,37.5]}
    ],
    wBot:[
      {s:"XS (0-2)",waist:[23.5,25.5],hip:[33.5,35.5]},{s:"S (4-6)",waist:[25.5,28],hip:[35.5,38]},
      {s:"M (8-10)",waist:[28,31],hip:[38,41]},{s:"L (12-14)",waist:[31,34],hip:[41,44]},
      {s:"XL (16-18)",waist:[34,37.5],hip:[44,47.5]}
    ]
  },
  // ═══════ UNDER ARMOUR ═══════
  underarmour: { name:"Under Armour", i:"UA", c:"#003B5C",
    tag:"Compression runs tight — Loose fit is TTS", big:false, small:true, tts:false,
    mNote:"Compression is 1-2 sizes smaller than labeled. Loose fit matches Nike.",
    wNote:"Women's HeatGear Compression runs very tight. Size up in compression styles.",
    mTops:[
      {s:"S",bust:[34,36],waist:[28.5,30]},{s:"M",bust:[38,40],waist:[31.5,33.5]},
      {s:"L",bust:[42,44],waist:[35,37]},{s:"XL",bust:[46,48],waist:[39,41]}
    ],
    mBot:[
      {s:"S (30)",waist:[28.5,30],hip:[34,36]},{s:"M (32)",waist:[31.5,33.5],hip:[37,39]},
      {s:"L (34-36)",waist:[35,37],hip:[40,43]},{s:"XL (38-40)",waist:[39,41],hip:[44,47]}
    ],
    wTops:[
      {s:"XS (0-2)",bust:[30,32.5],waist:[23,25.5]},{s:"S (4-6)",bust:[32.5,35.5],waist:[25.5,28.5]},
      {s:"M (8-10)",bust:[35.5,37.5],waist:[28.5,30.5]},{s:"L (12-14)",bust:[39,40.5],waist:[32,33.5]},
      {s:"XL (16)",bust:[42,43.5],waist:[35,36.5]}
    ],
    wBot:[
      {s:"XS (0-2)",waist:[23,25.5],hip:[33,35.5]},{s:"S (4-6)",waist:[25.5,28.5],hip:[35.5,38.5]},
      {s:"M (8-10)",waist:[28.5,30.5],hip:[38.5,41]},{s:"L (12-14)",waist:[32,33.5],hip:[41.5,44]},
      {s:"XL (16)",waist:[35,36.5],hip:[44,46.5]}
    ]
  },
  // ═══════ H&M ═══════
  hm: { name:"H&M", i:"HM", c:"#E50010",
    tag:"Tops run slightly big — European cut", big:true, small:false, tts:false,
    mNote:"European cut: longer torso, narrower shoulders. H&M M often fits like Nike L.",
    wNote:"Women's is generally true to size but can be inconsistent across styles. Check specific product.",
    mTops:[
      {s:"S",bust:[34.5,36.25],waist:[30,31.5]},{s:"M",bust:[37.75,39.5],waist:[33,34.5]},
      {s:"L",bust:[41,42.5],waist:[36.25,37.75]},{s:"XL",bust:[44,45.5],waist:[39.5,41]}
    ],
    mBot:[
      {s:"S (30-32)",waist:[30,31.5],hip:[36.5,37.75]},{s:"M (33-34)",waist:[33,34.5],hip:[39,40]},
      {s:"L (36-38)",waist:[36.25,37.75],hip:[41.25,42.5]},{s:"XL (40-42)",waist:[39.5,41],hip:[43.75,44.75]}
    ],
    wTops:[
      {s:"XS (2)",bust:[31,32.5],waist:[24,25.5]},{s:"S (4-6)",bust:[33,35.5],waist:[26,28.5]},
      {s:"M (8-10)",bust:[36,38.5],waist:[29,31.5]},{s:"L (12-14)",bust:[39,41.5],waist:[32,34.5]},
      {s:"XL (16-18)",bust:[42,44.5],waist:[35,37.5]}
    ],
    wBot:[
      {s:"XS (2)",waist:[24,25.5],hip:[34,35.5]},{s:"S (4-6)",waist:[26,28.5],hip:[36,38.5]},
      {s:"M (8-10)",waist:[29,31.5],hip:[39,41.5]},{s:"L (12-14)",waist:[32,34.5],hip:[42,44.5]},
      {s:"XL (16-18)",waist:[35,37.5],hip:[45,47.5]}
    ]
  },
  // ═══════ ZARA ═══════
  zara: { name:"Zara", i:"ZR", c:"#000000",
    tag:"Runs small — European slim fit", big:false, small:true, tts:false,
    mNote:"European slim cut. Zara M ≈ US S. Sizing varies wildly across styles.",
    wNote:"Runs small. Size up from your usual. Very inconsistent between garment types.",
    mTops:[
      {s:"S",bust:[34,36],waist:[28,30]},{s:"M",bust:[38,40],waist:[32,34]},
      {s:"L",bust:[41,43],waist:[34,36]},{s:"XL",bust:[44,46],waist:[38,40]}
    ],
    mBot:[
      {s:"30 (S)",waist:[29,31],hip:[37,38]},{s:"32 (M)",waist:[31,33],hip:[39,40]},
      {s:"34 (L)",waist:[34,35],hip:[41,42]},{s:"36 (XL)",waist:[36,38],hip:[43,44]}
    ],
    wTops:[
      {s:"XS",bust:[31,33],waist:[24,26]},{s:"S",bust:[33,35],waist:[26,28]},
      {s:"M",bust:[35,37.5],waist:[28,30.5]},{s:"L",bust:[37.5,40],waist:[30.5,33]},
      {s:"XL",bust:[40,43],waist:[33,36]}
    ],
    wBot:[
      {s:"34 (XS)",waist:[24,26],hip:[34,36]},{s:"36 (S)",waist:[26,28],hip:[36,38]},
      {s:"38 (M)",waist:[28,30.5],hip:[38,40.5]},{s:"40 (L)",waist:[30.5,33],hip:[40.5,43]},
      {s:"42 (XL)",waist:[33,36],hip:[43,46]}
    ]
  },
  // ═══════ UNIQLO ═══════
  uniqlo: { name:"Uniqlo", i:"UQ", c:"#FF0000",
    tag:"Runs slightly small — Japanese sizing", big:false, small:true, tts:false,
    mNote:"Japanese slimline fit. Size up one from US brands for relaxed fit.",
    wNote:"Runs small for US shoppers. Pants use numeric waist and are more accurate than tops.",
    mTops:[
      {s:"S",bust:[35,37.5],waist:[29,31.5]},{s:"M",bust:[37.5,40],waist:[31.5,34]},
      {s:"L",bust:[40,43],waist:[34,37]},{s:"XL",bust:[43,46],waist:[37,40]}
    ],
    mBot:[
      {s:"28 (S)",waist:[28,30],hip:[34.5,36]},{s:"30-31 (M)",waist:[30,32],hip:[36,38]},
      {s:"32-33 (L)",waist:[32,34],hip:[38,40.5]},{s:"34-36 (XL)",waist:[34,37],hip:[40.5,43]}
    ],
    wTops:[
      {s:"XS",bust:[30.5,32.5],waist:[23,25]},{s:"S",bust:[32.5,35],waist:[25,27.5]},
      {s:"M",bust:[35,37.5],waist:[27.5,30]},{s:"L",bust:[37.5,40],waist:[30,32.5]},
      {s:"XL",bust:[40,43],waist:[32.5,35.5]}
    ],
    wBot:[
      {s:"XS (24-25)",waist:[23,25],hip:[33,35]},{s:"S (26-27)",waist:[25,27.5],hip:[35,37.5]},
      {s:"M (28-29)",waist:[27.5,30],hip:[37.5,40]},{s:"L (30-31)",waist:[30,32.5],hip:[40,42.5]},
      {s:"XL (32-33)",waist:[32.5,35.5],hip:[42.5,45.5]}
    ]
  },
  // ═══════ RALPH LAUREN ═══════
  ralphlauren: { name:"Ralph Lauren", i:"RL", c:"#1C3F6E",
    tag:"True to size — Slim Fit is narrower", big:false, small:false, tts:true,
    mNote:"Classic Fit is generous. Slim Fit is 1\" narrower in chest, 3\" narrower in waist.",
    wNote:"Polo line runs true to size. Lauren line is designed for comfort — may want to size down.",
    mTops:[
      {s:"S",bust:[34,36],waist:[28,30]},{s:"M",bust:[38,40],waist:[31,34]},
      {s:"L",bust:[42,44],waist:[35,38]},{s:"XL",bust:[46,48],waist:[40,42]}
    ],
    mBot:[
      {s:"30",waist:[30,31],hip:[36,37]},{s:"32",waist:[32,33],hip:[38,39]},
      {s:"34",waist:[34,35],hip:[40,41]},{s:"36",waist:[36,37],hip:[42,43]}
    ],
    wTops:[
      {s:"XS (2)",bust:[32,34],waist:[25,27]},{s:"S (4-6)",bust:[34,36.5],waist:[27,29.5]},
      {s:"M (8-10)",bust:[36.5,39],waist:[29.5,32]},{s:"L (12-14)",bust:[39,42],waist:[32,35]},
      {s:"XL (16)",bust:[42,45],waist:[35,38]}
    ],
    wBot:[
      {s:"2 (XS)",waist:[25,27],hip:[35,37]},{s:"4-6 (S)",waist:[27,29.5],hip:[37,39.5]},
      {s:"8-10 (M)",waist:[29.5,32],hip:[39.5,42]},{s:"12-14 (L)",waist:[32,35],hip:[42,45]},
      {s:"16 (XL)",waist:[35,38],hip:[45,48]}
    ]
  },
  // ═══════ GAP ═══════
  gap: { name:"Gap", i:"GP", c:"#003A70",
    tag:"True to size — one of the most consistent US brands", big:false, small:false, tts:true,
    mNote:"Consistent American sizing. Tall sizes add 2\" in torso and sleeves.",
    wNote:"True to size. Their numeric system is straightforward. Tall and Petite options available.",
    mTops:[
      {s:"S",bust:[35,37.5],waist:[29,31.5]},{s:"M",bust:[38,40.5],waist:[32,34.5]},
      {s:"L",bust:[42,44],waist:[37,39]},{s:"XL",bust:[45,48],waist:[40,43]}
    ],
    mBot:[
      {s:"30 (S)",waist:[30,31],hip:[36,37]},{s:"32 (M)",waist:[32,33],hip:[38,39]},
      {s:"34 (M/L)",waist:[34,35.5],hip:[40,41]},{s:"36 (L)",waist:[36,37.5],hip:[42,43]}
    ],
    wTops:[
      {s:"XS (0-2)",bust:[32,34],waist:[24.5,26.5]},{s:"S (4-6)",bust:[34,36.5],waist:[26.5,29]},
      {s:"M (8-10)",bust:[36.5,39],waist:[29,31.5]},{s:"L (12-14)",bust:[39,42],waist:[31.5,34.5]},
      {s:"XL (16-18)",bust:[42,45.5],waist:[34.5,38]}
    ],
    wBot:[
      {s:"0-2 (XS)",waist:[24.5,26.5],hip:[34.5,36.5]},{s:"4-6 (S)",waist:[26.5,29],hip:[36.5,39]},
      {s:"8-10 (M)",waist:[29,31.5],hip:[39,41.5]},{s:"12-14 (L)",waist:[31.5,34.5],hip:[41.5,44.5]},
      {s:"16-18 (XL)",waist:[34.5,38],hip:[44.5,48]}
    ]
  },
  // ═══════ CHAMPION ═══════
  champion: { name:"Champion", i:"CM", c:"#0033A0",
    tag:"True to size — Reverse Weave may shrink slightly", big:false, small:false, tts:true,
    mNote:"Very similar to Nike's ranges. Reverse Weave cotton may shrink 3-5% — consider sizing up.",
    wNote:"Women's runs true to size. Consistent across their athletic and lifestyle lines.",
    mTops:[
      {s:"S",bust:[34,36],waist:[28,30]},{s:"M",bust:[38,40],waist:[32,34]},
      {s:"L",bust:[42,44],waist:[36,38]},{s:"XL",bust:[46,48],waist:[40,42]}
    ],
    mBot:[
      {s:"S (28-30)",waist:[28,30],hip:[37,38]},{s:"M (32-34)",waist:[32,34],hip:[39,41]},
      {s:"L (36-38)",waist:[36,38],hip:[42,43]},{s:"XL (40-42)",waist:[40,42],hip:[44,46]}
    ],
    wTops:[
      {s:"XS",bust:[31,33],waist:[24,26]},{s:"S",bust:[33,35.5],waist:[26,28.5]},
      {s:"M",bust:[35.5,38],waist:[28.5,31]},{s:"L",bust:[38,41],waist:[31,34]},
      {s:"XL",bust:[41,44],waist:[34,37]}
    ],
    wBot:[
      {s:"XS",waist:[24,26],hip:[34,36]},{s:"S",waist:[26,28.5],hip:[36,38.5]},
      {s:"M",waist:[28.5,31],hip:[38.5,41]},{s:"L",waist:[31,34],hip:[41,44]},
      {s:"XL",waist:[34,37],hip:[44,47]}
    ]
  },
  // ═══════ AMERICAN EAGLE ═══════
  americaneagle: { name:"American Eagle", i:"AE", c:"#004B8D",
    tag:"True to size — wide range of fits and lengths", big:false, small:false, tts:true,
    mNote:"Consistent US sizing. Slim Fit is narrower than Classic Fit. Flex jeans have stretch.",
    wNote:"True to size with slight vanity sizing. Curvy collection has more hip/thigh room. Great size range (00-24).",
    mTops:[
      {s:"XS",bust:[32,34],waist:[26,28]},{s:"S",bust:[34,37],waist:[28,31]},
      {s:"M",bust:[37,40],waist:[31,34]},{s:"L",bust:[40,43],waist:[34,37]},
      {s:"XL",bust:[43,46],waist:[37,40]}
    ],
    mBot:[
      {s:"28",waist:[28,29],hip:[34,35]},{s:"30",waist:[30,31],hip:[36,37]},
      {s:"32",waist:[32,33],hip:[38,39]},{s:"34",waist:[34,35],hip:[40,41]},
      {s:"36",waist:[36,37],hip:[42,43]}
    ],
    wTops:[
      {s:"XS (0)",bust:[32,34],waist:[24.5,26]},{s:"S (4)",bust:[34,36],waist:[26.5,28]},
      {s:"M (8)",bust:[36,38.5],waist:[28.5,30.5]},{s:"L (12)",bust:[39,41.5],waist:[31.5,33.5]},
      {s:"XL (16)",bust:[42,44.5],waist:[34.5,36.5]}
    ],
    wBot:[
      {s:"00 (23)",waist:[23.5,24],hip:[33,34]},{s:"0 (24)",waist:[24.5,25.5],hip:[34,35]},
      {s:"2 (25)",waist:[25.5,26.5],hip:[35,36]},{s:"4 (26)",waist:[26.5,27.5],hip:[36,37]},
      {s:"6 (27)",waist:[27.5,28.5],hip:[37,38]},{s:"8 (28)",waist:[28.5,29.5],hip:[38,39.5]},
      {s:"10 (30)",waist:[30,31],hip:[39.5,41]},{s:"12 (31)",waist:[31.5,32.5],hip:[41,42.5]},
      {s:"14 (33)",waist:[33,34],hip:[42.5,44]},{s:"16 (34)",waist:[34.5,35.5],hip:[44,46]}
    ]
  },
  // ═══════ ABERCROMBIE & FITCH ═══════
  abercrombie: { name:"Abercrombie & Fitch", i:"AF", c:"#1B3A2D",
    tag:"Runs slightly small — designed for a slimmer fit", big:false, small:true, tts:false,
    mNote:"Designed slim and close to body. Size up if you prefer relaxed. Very popular jeans brand.",
    wNote:"Runs small. Curve Love line has more hip room. Vanity sizing is less aggressive than AE. Size up if between.",
    mTops:[
      {s:"XS",bust:[33,35],waist:[27,29]},{s:"S",bust:[35,37.5],waist:[29,31.5]},
      {s:"M",bust:[37.5,40],waist:[31.5,34]},{s:"L",bust:[40,43],waist:[34,37]},
      {s:"XL",bust:[43,46],waist:[37,40]}
    ],
    mBot:[
      {s:"28",waist:[28,29],hip:[34,35]},{s:"30",waist:[30,31],hip:[36,37]},
      {s:"32",waist:[32,33],hip:[38,39]},{s:"34",waist:[34,35],hip:[40,41]},
      {s:"36",waist:[36,37],hip:[42,43]}
    ],
    wTops:[
      {s:"XXS (00)",bust:[31,32.5],waist:[23,24.5]},{s:"XS (0-2)",bust:[32.5,34.5],waist:[24.5,26.5]},
      {s:"S (4-6)",bust:[34.5,37],waist:[26.5,29]},{s:"M (8-10)",bust:[37,39.5],waist:[29,31.5]},
      {s:"L (12-14)",bust:[39.5,42],waist:[31.5,34]},{s:"XL (16)",bust:[42,44.5],waist:[34,37]}
    ],
    wBot:[
      {s:"23 (000)",waist:[23,24],hip:[33,34]},{s:"24 (00)",waist:[24,25],hip:[34,35]},
      {s:"25 (0)",waist:[25,26],hip:[35,36]},{s:"26 (2)",waist:[26,27],hip:[36,37]},
      {s:"27 (4)",waist:[27,28],hip:[37,38]},{s:"28 (6)",waist:[28,29],hip:[38,39]},
      {s:"29 (8)",waist:[29,30],hip:[39,40]},{s:"30 (10)",waist:[30,31],hip:[40,41]},
      {s:"31 (12)",waist:[31,32],hip:[41,42]},{s:"32 (14)",waist:[32,33.5],hip:[42,43.5]}
    ]
  },
  // ═══════ VICTORIA'S SECRET / PINK ═══════
  victoriassecret: { name:"Victoria's Secret", i:"VS", c:"#E91E8C",
    tag:"Women's only — runs true to size in apparel", big:false, small:false, tts:true,
    mNote:null,
    wNote:"Apparel (loungewear, PINK line) runs TTS. Bras use band+cup. Panties use S-XL based on hip measurement.",
    mTops:null, mBot:null,
    wTops:[
      {s:"XS (0-2)",bust:[32,33.5],waist:[24,25.5]},{s:"S (4-6)",bust:[34,35.5],waist:[26,27.5]},
      {s:"M (8-10)",bust:[36,38],waist:[28,30]},{s:"L (12-14)",bust:[38.5,40.5],waist:[30.5,32.5]},
      {s:"XL (16-18)",bust:[41,43.5],waist:[33,35.5]}
    ],
    wBot:[
      {s:"XS (0-2)",waist:[24,25.5],hip:[34.5,36]},{s:"S (4-6)",waist:[26,27.5],hip:[36.5,38]},
      {s:"M (8-10)",waist:[28,30],hip:[38.5,40.5]},{s:"L (12-14)",waist:[30.5,32.5],hip:[41,43]},
      {s:"XL (16-18)",waist:[33,35.5],hip:[43.5,46]}
    ]
  },
  // ═══════ OLD NAVY ═══════
  oldnavy: { name:"Old Navy", i:"ON", c:"#003B64",
    tag:"Runs slightly big — generous vanity sizing", big:true, small:false, tts:false,
    mNote:"Known for generous/vanity sizing. Their M fits like other brands' L.",
    wNote:"Generous sizing — often need to size down from other brands. Good extended size range.",
    mTops:[
      {s:"S",bust:[35,38],waist:[29,32]},{s:"M",bust:[38,41],waist:[32,35]},
      {s:"L",bust:[41,44],waist:[35,38]},{s:"XL",bust:[44,48],waist:[38,43]}
    ],
    mBot:[
      {s:"30 (S)",waist:[29,31],hip:[36,38]},{s:"32-34 (M)",waist:[32,35],hip:[38,41]},
      {s:"36-38 (L)",waist:[36,38],hip:[42,44]},{s:"40-42 (XL)",waist:[40,43],hip:[45,48]}
    ],
    wTops:[
      {s:"XS (0-2)",bust:[33,35],waist:[25,27]},{s:"S (4-6)",bust:[35,37.5],waist:[27,29.5]},
      {s:"M (8-10)",bust:[37.5,40],waist:[29.5,32]},{s:"L (12-14)",bust:[40,43],waist:[32,35]},
      {s:"XL (16-18)",bust:[43,46.5],waist:[35,38.5]}
    ],
    wBot:[
      {s:"0-2 (XS)",waist:[25,27],hip:[35,37]},{s:"4-6 (S)",waist:[27,29.5],hip:[37,39.5]},
      {s:"8-10 (M)",waist:[29.5,32],hip:[39.5,42]},{s:"12-14 (L)",waist:[32,35],hip:[42,45]},
      {s:"16-18 (XL)",waist:[35,38.5],hip:[45,48.5]}
    ]
  },
  // ═══════ ARITZIA ═══════
  aritzia: { name:"Aritzia", i:"AR", c:"#000000",
    tag:"Women's only — runs slightly small", big:false, small:true, tts:false,
    mNote:null,
    wNote:"Popular Canadian brand. Runs slightly small — between sizes, go up. TNA line is more relaxed.",
    mTops:null, mBot:null,
    wTops:[
      {s:"XXS (0)",bust:[31,32.5],waist:[23.5,25]},{s:"XS (2)",bust:[32.5,34],waist:[25,26.5]},
      {s:"S (4-6)",bust:[34,36.5],waist:[26.5,29]},{s:"M (8-10)",bust:[36.5,39],waist:[29,31.5]},
      {s:"L (12-14)",bust:[39,42],waist:[31.5,34.5]},{s:"XL (16)",bust:[42,45],waist:[34.5,37.5]}
    ],
    wBot:[
      {s:"0 (XXS)",waist:[23.5,25],hip:[33.5,35]},{s:"2 (XS)",waist:[25,26.5],hip:[35,36.5]},
      {s:"4-6 (S)",waist:[26.5,29],hip:[36.5,39]},{s:"8-10 (M)",waist:[29,31.5],hip:[39,41.5]},
      {s:"12-14 (L)",waist:[31.5,34.5],hip:[41.5,44.5]},{s:"16 (XL)",waist:[34.5,37.5],hip:[44.5,47.5]}
    ]
  },
  // ═══════ FOREVER 21 ═══════
  forever21: { name:"Forever 21", i:"F21", c:"#FFC107",
    tag:"Runs small and inconsistent", big:false, small:true, tts:false,
    mNote:"Men's basics run small. Size up.",
    wNote:"Very inconsistent sizing across styles. Generally runs small. Always size up if between.",
    mTops:[
      {s:"S",bust:[34,36],waist:[28,30]},{s:"M",bust:[36,39],waist:[30,33]},
      {s:"L",bust:[39,42],waist:[33,36]},{s:"XL",bust:[42,45],waist:[36,39]}
    ],
    mBot:[
      {s:"S (30)",waist:[28,30],hip:[35,37]},{s:"M (32)",waist:[30,33],hip:[37,40]},
      {s:"L (34)",waist:[33,36],hip:[40,43]},{s:"XL (36)",waist:[36,39],hip:[43,46]}
    ],
    wTops:[
      {s:"XS",bust:[31,33],waist:[23.5,25.5]},{s:"S",bust:[33,35],waist:[25.5,27.5]},
      {s:"M",bust:[35,37.5],waist:[27.5,30]},{s:"L",bust:[37.5,40],waist:[30,32.5]},
      {s:"XL",bust:[40,43],waist:[32.5,35.5]}
    ],
    wBot:[
      {s:"XS (24-25)",waist:[23.5,25.5],hip:[34,36]},{s:"S (26-27)",waist:[25.5,27.5],hip:[36,38]},
      {s:"M (28-29)",waist:[27.5,30],hip:[38,40.5]},{s:"L (30-31)",waist:[30,32.5],hip:[40.5,43]},
      {s:"XL (32-33)",waist:[32.5,35.5],hip:[43,46]}
    ]
  },
};

const BL = Object.values(DB);
const BK = Object.keys(DB);

// ── PREDICTION ──
function predict(arr, m) {
  if(!arr) return {s:"N/A",conf:0};
  let best=null,bs=Infinity;
  for(const e of arr){let sc=0,f=0;
    if(m.bust&&e.bust){sc+=Math.abs(m.bust-(e.bust[0]+e.bust[1])/2);f++}
    if(m.waist&&e.waist){sc+=Math.abs(m.waist-(e.waist[0]+e.waist[1])/2);f++}
    if(m.hip&&e.hip){sc+=Math.abs(m.hip-(e.hip[0]+e.hip[1])/2);f++}
    if(f>0){sc/=f;if(sc<bs){bs=sc;best=e}}
  }
  let c=bs<=1?96:bs<=2?91:bs<=3.5?83:bs<=5?73:62;
  if(best){
    let ok=true;
    if(m.bust&&best.bust&&(m.bust<best.bust[0]-1||m.bust>best.bust[1]+1))ok=false;
    if(m.waist&&best.waist&&(m.waist<best.waist[0]-1||m.waist>best.waist[1]+1))ok=false;
    if(!ok&&c>80)c=78;
  }
  return {s:best?.s||"—",conf:c};
}

function willFit(arr,sLabel,m){
  if(!arr)return null;
  const e=arr.find(x=>x.s===sLabel);if(!e)return null;
  let t=0,n=0,ok=true;
  [["bust",m.bust],["waist",m.waist],["hip",m.hip]].forEach(([k,v])=>{
    if(v&&e[k]){const mid=(e[k][0]+e[k][1])/2;t+=v-mid;n++;
      if(v<e[k][0]-1||v>e[k][1]+1)ok=false;}
  });
  if(!n)return null;const a=t/n;
  if(ok&&Math.abs(a)<=1)return{v:"Great fit",e:"✅",c:"#47FF8A",d:"This size should fit you well."};
  if(a>1&&a<=3)return{v:"Will feel tight",e:"⚠️",c:"#FF6B35",d:"Consider sizing up."};
  if(a>3)return{v:"Too small",e:"❌",c:"#FF4757",d:"Definitely size up."};
  if(a<-1&&a>=-3)return{v:"Will feel loose",e:"⚠️",c:"#35B8FF",d:"Consider sizing down."};
  if(a<-3)return{v:"Too big",e:"❌",c:"#FF4757",d:"Definitely size down."};
  return{v:"Should work",e:"✅",c:"#CDFF50",d:"Close enough."};
}

function getMFromKnown(slug,cat,sLabel,gender){
  const b=DB[slug];if(!b)return null;
  const arr=gender==="male"?(cat==="tops"?b.mTops:b.mBot):(cat==="tops"?b.wTops:b.wBot);
  if(!arr)return null;
  const x=arr.find(e=>e.s===sLabel);if(!x)return null;
  return{bust:x.bust?(x.bust[0]+x.bust[1])/2:null,waist:x.waist?(x.waist[0]+x.waist[1])/2:null,hip:x.hip?(x.hip[0]+x.hip[1])/2:null};
}

// ── STYLES ──
const F={d:"'Instrument Serif',Georgia,serif",b:"'DM Sans',system-ui,sans-serif",m:"'JetBrains Mono',monospace"};
const C={bg:"#07070A",sf:"#0F0F14",sf2:"#16161D",sf3:"#1E1E28",bd:"#2A2A36",tx:"#EEEAE2",dm:"#706D65",ac:"#CDFF50"};

// ── SMALL COMPONENTS ──
function AnimN({v}){const[d,setD]=useState(0);useEffect(()=>{const st=Date.now();const t=()=>{const p=Math.min((Date.now()-st)/600,1);setD(Math.round(v*(1-Math.pow(1-p,3))));if(p<1)requestAnimationFrame(t)};t()},[v]);return <span>{d}%</span>}
function Fld({label,value,onChange,placeholder,type="number"}){return <div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:".08em",color:C.dm,marginBottom:5}}>{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",background:C.sf3,border:`1px solid ${C.bd}`,borderRadius:10,padding:"11px 14px",color:C.tx,fontFamily:F.b,fontSize:15,outline:"none"}}/></div>}
function Sel({label,value,onChange,options}){return <div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:".08em",color:C.dm,marginBottom:5}}>{label}</label><select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",background:C.sf3,border:`1px solid ${C.bd}`,borderRadius:10,padding:"11px 14px",color:C.tx,fontFamily:F.b,fontSize:15,outline:"none",cursor:"pointer"}}>{options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select></div>}

// ── MAIN APP ──
export default function App(){
  const[page,setPage]=useState("home");
  const[selBrand,setSelBrand]=useState(null);
  useEffect(()=>{window.scrollTo(0,0)},[page]);

  return <div style={{background:C.bg,color:C.tx,fontFamily:F.b,minHeight:"100vh",WebkitFontSmoothing:"antialiased"}}>
    {/* Grain */}
    <div style={{position:"fixed",inset:0,zIndex:9999,pointerEvents:"none",opacity:.025,backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`}}/>

    {/* Nav */}
    <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,padding:"14px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",backdropFilter:"blur(24px)",background:"rgba(7,7,10,.78)",borderBottom:"1px solid rgba(42,42,54,.4)"}}>
      <a onClick={()=>setPage("home")} style={{fontFamily:F.d,fontSize:20,color:C.tx,textDecoration:"none",display:"flex",alignItems:"center",gap:7,cursor:"pointer"}}>
        <span style={{width:7,height:7,background:C.ac,borderRadius:"50%"}}/>whatsmysize</a>
      <div style={{display:"flex",gap:16,alignItems:"center"}}>
        <a onClick={()=>setPage("brands")} style={{color:C.dm,textDecoration:"none",fontSize:13,fontWeight:500,cursor:"pointer"}}>Brands</a>
        <a onClick={()=>setPage("tool")} style={{background:C.ac,color:C.bg,padding:"8px 18px",borderRadius:100,fontWeight:600,fontSize:13,cursor:"pointer",textDecoration:"none"}}>Find My Size</a>
      </div>
    </nav>

    {page==="home"&&<HomePage setPage={setPage} setSelBrand={setSelBrand}/>}
    {page==="brands"&&<BrandsPage setPage={setPage} setSelBrand={setSelBrand}/>}
    {page==="brand"&&selBrand&&<BrandPage b={selBrand} setPage={setPage}/>}
    {page==="tool"&&<ToolPage/>}
  </div>;
}

// ── HOME ──
function HomePage({setPage,setSelBrand}){
  return <>
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"120px 24px 60px",position:"relative"}}>
      <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:800,height:800,background:"radial-gradient(ellipse,rgba(205,255,80,.04) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"6px 16px",borderRadius:100,border:`1px solid ${C.bd}`,background:C.sf,fontSize:12,color:C.dm,letterSpacing:".05em",textTransform:"uppercase",marginBottom:28}}>
        <span style={{width:6,height:6,background:C.ac,borderRadius:"50%"}}/>Data-driven sizing · {BL.length} brands · Men & Women
      </div>
      <h1 style={{fontFamily:F.d,fontSize:"clamp(44px,7.5vw,84px)",lineHeight:1,letterSpacing:"-.03em",maxWidth:800,marginBottom:20}}>
        Stop guessing.<br/><em style={{fontStyle:"italic",color:C.ac}}>Know your size.</em>
      </h1>
      <p style={{fontSize:"clamp(15px,2vw,18px)",color:C.dm,maxWidth:460,lineHeight:1.6,marginBottom:40}}>
        Tell us your height, weight, and waist — or what size you already wear. We'll predict your size in every brand. No scanning. No avatars.
      </p>
      <button onClick={()=>setPage("tool")} style={{display:"inline-flex",alignItems:"center",gap:10,background:C.ac,color:C.bg,padding:"16px 40px",borderRadius:100,fontWeight:700,fontSize:16,border:"none",cursor:"pointer",fontFamily:F.b}}>
        Find My Size <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
      <div style={{display:"flex",gap:40,marginTop:56,paddingTop:40,borderTop:`1px solid ${C.bd}`,flexWrap:"wrap",justifyContent:"center"}}>
        {[{v:BL.length+"+",l:"Brands"},{v:"30-40%",l:"Online returns are fit-related"},{v:"20s",l:"To build your profile"}].map((s,i)=>
          <div key={i} style={{textAlign:"center"}}><strong style={{fontFamily:F.m,fontSize:24,color:C.ac,display:"block"}}>{s.v}</strong><span style={{fontSize:12,color:C.dm}}>{s.l}</span></div>
        )}
      </div>
    </div>
    {/* Brand strip */}
    <div style={{padding:"0 24px 40px",maxWidth:1000,margin:"0 auto",display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
      {BL.slice(0,10).map(b=><div key={b.name} onClick={()=>{setSelBrand(b);setPage("brand")}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",background:C.sf,border:`1px solid ${C.bd}`,borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:500}}>
        <span style={{width:24,height:24,borderRadius:6,background:b.c+"18",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:9,color:b.c,fontFamily:F.m}}>{b.i}</span>{b.name}
      </div>)}
    </div>
    {/* Problem */}
    <section style={{padding:"60px 24px",maxWidth:900,margin:"0 auto"}}>
      <span style={{fontSize:11,textTransform:"uppercase",letterSpacing:".12em",color:C.ac}}>The Problem</span>
      <h2 style={{fontFamily:F.d,fontSize:"clamp(26px,4vw,40px)",marginTop:8,marginBottom:10}}>Returns are killing online retail.</h2>
      <p style={{color:C.dm,fontSize:15,maxWidth:500,marginBottom:32}}>30-40% of clothing bought online gets returned. The #1 reason? Wrong size.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}>
        {[{e:"📦",t:"Wasted shipping",d:"Every return = two extra shipments."},{e:"👗",t:"Brands size differently",d:"A Zara M ≠ a Carhartt M ≠ a Nike M."},{e:"📊",t:"Data beats AR",d:"No avatars needed. Just measurement data."}].map((c,i)=>
          <div key={i} style={{background:C.sf,border:`1px solid ${C.bd}`,borderRadius:14,padding:24}}>
            <span style={{fontSize:24,display:"block",marginBottom:10}}>{c.e}</span>
            <h3 style={{fontSize:15,fontWeight:600,marginBottom:4}}>{c.t}</h3>
            <p style={{fontSize:13,color:C.dm,lineHeight:1.4}}>{c.d}</p>
          </div>
        )}
      </div>
    </section>
    <section style={{padding:"60px 24px",textAlign:"center"}}>
      <h2 style={{fontFamily:F.d,fontSize:"clamp(26px,4vw,40px)",marginBottom:10}}>Find your size in 20 seconds.</h2>
      <p style={{color:C.dm,fontSize:15,marginBottom:24}}>No account needed. Men & women. {BL.length} brands.</p>
      <button onClick={()=>setPage("tool")} style={{background:C.ac,color:C.bg,border:"none",borderRadius:100,padding:"14px 36px",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:F.b}}>Get Started Free</button>
    </section>
    <footer style={{padding:"24px",borderTop:`1px solid ${C.sf3}`,textAlign:"center",fontSize:12,color:C.dm}}>whatsmysize.ai — Data-driven sizing. No gimmicks.</footer>
  </>;
}

// ── BRANDS PAGE ──
function BrandsPage({setPage,setSelBrand}){
  return <div style={{padding:"100px 24px 80px",maxWidth:1000,margin:"0 auto"}}>
    <span style={{fontSize:11,textTransform:"uppercase",letterSpacing:".12em",color:C.ac}}>Database</span>
    <h1 style={{fontFamily:F.d,fontSize:"clamp(30px,5vw,46px)",marginTop:8,marginBottom:10}}>Brand Size Guides</h1>
    <p style={{color:C.dm,fontSize:15,maxWidth:480,marginBottom:36}}>Real sizing data from official brand charts. {BL.length} brands, men's & women's.</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
      {BL.map(b=>{
        const fc=b.big?"#FF6B35":b.small?"#35B8FF":"#47FF8A";
        const fl=b.big?"Runs Big":b.small?"Runs Small":"True to Size";
        const hasM=!!b.mTops,hasW=!!b.wTops;
        return <div key={b.name} onClick={()=>{setSelBrand(b);setPage("brand")}} style={{background:C.sf,border:`1px solid ${C.bd}`,borderRadius:14,padding:24,cursor:"pointer",transition:"all .3s"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div style={{width:42,height:42,borderRadius:10,background:b.c+"18",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:b.c,fontFamily:F.m}}>{b.i}</div>
            <span style={{fontSize:10,fontWeight:600,padding:"3px 8px",borderRadius:100,background:fc+"15",color:fc,textTransform:"uppercase"}}>{fl}</span>
          </div>
          <h3 style={{fontSize:16,fontWeight:600,marginBottom:4}}>{b.name}</h3>
          <p style={{fontSize:12,color:C.dm,lineHeight:1.4,marginBottom:10}}>{b.tag}</p>
          <div style={{display:"flex",gap:6}}>
            {hasM&&<span style={{fontSize:10,color:C.dm,background:C.sf3,padding:"2px 7px",borderRadius:5}}>Men's</span>}
            {hasW&&<span style={{fontSize:10,color:C.dm,background:C.sf3,padding:"2px 7px",borderRadius:5}}>Women's</span>}
          </div>
        </div>;
      })}
    </div>
  </div>;
}

// ── BRAND DETAIL ──
function BrandPage({b,setPage}){
  const fc=b.big?"#FF6B35":b.small?"#35B8FF":"#47FF8A";
  const fl=b.big?"Runs Big":b.small?"Runs Small":"True to Size";
  const Tbl=({data,showH})=>!data?null:<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
    <thead><tr style={{borderBottom:`1px solid ${C.bd}`}}>
      <th style={{padding:"8px 12px",textAlign:"left",color:C.dm,fontWeight:500,fontSize:11,textTransform:"uppercase"}}>Size</th>
      <th style={{padding:"8px 12px",textAlign:"left",color:C.dm,fontWeight:500,fontSize:11,textTransform:"uppercase"}}>Bust/Chest</th>
      <th style={{padding:"8px 12px",textAlign:"left",color:C.dm,fontWeight:500,fontSize:11,textTransform:"uppercase"}}>Waist</th>
      {showH&&<th style={{padding:"8px 12px",textAlign:"left",color:C.dm,fontWeight:500,fontSize:11,textTransform:"uppercase"}}>Hip</th>}
    </tr></thead>
    <tbody>{data.map((r,i)=><tr key={i} style={{borderBottom:`1px solid ${C.sf3}`}}>
      <td style={{padding:"10px 12px",fontWeight:600,fontFamily:F.m,color:C.ac,fontSize:12}}>{r.s}</td>
      <td style={{padding:"10px 12px"}}>{r.bust?`${r.bust[0]}" – ${r.bust[1]}"`:r.chest?`${r.chest[0]}" – ${r.chest[1]}"`:""}</td>
      <td style={{padding:"10px 12px"}}>{r.waist?`${r.waist[0]}" – ${r.waist[1]}"`:""}</td>
      {showH&&<td style={{padding:"10px 12px"}}>{r.hip?`${r.hip[0]}" – ${r.hip[1]}"`:""}</td>}
    </tr>)}</tbody>
  </table></div>;

  return <div style={{padding:"100px 24px 80px",maxWidth:860,margin:"0 auto"}}>
    <button onClick={()=>setPage("brands")} style={{background:"none",border:"none",color:C.dm,fontSize:13,cursor:"pointer",fontFamily:F.b,marginBottom:28}}>← All Brands</button>
    <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:10}}>
      <div style={{width:50,height:50,borderRadius:12,background:b.c+"18",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:18,color:b.c,fontFamily:F.m}}>{b.i}</div>
      <div><h1 style={{fontFamily:F.d,fontSize:36}}>{b.name}</h1><p style={{color:C.dm,fontSize:14}}>{b.tag}</p></div>
    </div>
    <div style={{display:"inline-flex",alignItems:"center",gap:7,padding:"6px 14px",borderRadius:8,background:fc+"12",border:`1px solid ${fc}30`,margin:"14px 0 32px"}}>
      <span style={{width:7,height:7,borderRadius:"50%",background:fc}}/><span style={{fontSize:13,fontWeight:600,color:fc}}>{fl}</span>
    </div>

    {b.mNote&&<div style={{background:C.sf,border:`1px solid ${C.bd}`,borderRadius:14,padding:24,marginBottom:16}}>
      <h3 style={{fontSize:12,fontWeight:600,textTransform:"uppercase",color:C.dm,marginBottom:8}}>Men's Fit Notes</h3>
      <p style={{fontSize:14,lineHeight:1.6}}>{b.mNote}</p>
    </div>}
    {b.wNote&&<div style={{background:C.sf,border:`1px solid ${C.bd}`,borderRadius:14,padding:24,marginBottom:16}}>
      <h3 style={{fontSize:12,fontWeight:600,textTransform:"uppercase",color:C.dm,marginBottom:8}}>Women's Fit Notes</h3>
      <p style={{fontSize:14,lineHeight:1.6}}>{b.wNote}</p>
    </div>}

    {b.mTops&&<div style={{background:C.sf,border:`1px solid ${C.bd}`,borderRadius:14,padding:24,marginBottom:12}}>
      <h3 style={{fontSize:12,fontWeight:600,textTransform:"uppercase",color:C.dm,marginBottom:12}}>Men's Tops</h3><Tbl data={b.mTops} showH={false}/></div>}
    {b.mBot&&<div style={{background:C.sf,border:`1px solid ${C.bd}`,borderRadius:14,padding:24,marginBottom:12}}>
      <h3 style={{fontSize:12,fontWeight:600,textTransform:"uppercase",color:C.dm,marginBottom:12}}>Men's Bottoms</h3><Tbl data={b.mBot} showH={true}/></div>}
    {b.wTops&&<div style={{background:C.sf,border:`1px solid ${C.bd}`,borderRadius:14,padding:24,marginBottom:12}}>
      <h3 style={{fontSize:12,fontWeight:600,textTransform:"uppercase",color:C.dm,marginBottom:12}}>Women's Tops</h3><Tbl data={b.wTops} showH={false}/></div>}
    {b.wBot&&<div style={{background:C.sf,border:`1px solid ${C.bd}`,borderRadius:14,padding:24,marginBottom:12}}>
      <h3 style={{fontSize:12,fontWeight:600,textTransform:"uppercase",color:C.dm,marginBottom:12}}>Women's Bottoms</h3><Tbl data={b.wBot} showH={true}/></div>}

    <div style={{background:`linear-gradient(135deg,${C.sf2},${C.sf3})`,border:`1px solid ${C.bd}`,borderRadius:14,padding:28,textAlign:"center",marginTop:24}}>
      <h3 style={{fontFamily:F.d,fontSize:22,marginBottom:8}}>Not sure which size?</h3>
      <p style={{color:C.dm,fontSize:13,marginBottom:16}}>Enter your measurements and get your {b.name} size.</p>
      <button onClick={()=>setPage("tool")} style={{background:C.ac,color:C.bg,border:"none",borderRadius:100,padding:"10px 28px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:F.b}}>Find My Size</button>
    </div>
  </div>;
}

// ── THE TOOL ──
function ToolPage(){
  const[gender,setGender]=useState("female");
  const[mode,setMode]=useState("known"); // known | measure
  // Measurements
  const[height,setHeight]=useState("");
  const[weight,setWeight]=useState("");
  const[waistM,setWaistM]=useState("");
  // Known sizes — both top AND bottom
  const[kTopBrand,setKTopBrand]=useState("");
  const[kTopSize,setKTopSize]=useState("");
  const[kBotBrand,setKBotBrand]=useState("");
  const[kBotSize,setKBotSize]=useState("");
  // Check
  const[chkBrand,setChkBrand]=useState("");
  const[chkCat,setChkCat]=useState("tops");
  const[chkSize,setChkSize]=useState("");
  const[chkRes,setChkRes]=useState(null);
  // Results
  const[results,setResults]=useState(null);
  const[copied,setCopied]=useState(false);

  const topOptions=useMemo(()=>{
    if(!kTopBrand)return[];
    const b=DB[kTopBrand];
    const arr=gender==="male"?b.mTops:b.wTops;
    return arr?arr.map(x=>({v:x.s,l:x.s})):[];
  },[kTopBrand,gender]);

  const botOptions=useMemo(()=>{
    if(!kBotBrand)return[];
    const b=DB[kBotBrand];
    const arr=gender==="male"?b.mBot:b.wBot;
    return arr?arr.map(x=>({v:x.s,l:x.s})):[];
  },[kBotBrand,gender]);

  const chkOptions=useMemo(()=>{
    if(!chkBrand)return[];
    const b=DB[chkBrand];
    const arr=gender==="male"?(chkCat==="tops"?b.mTops:b.mBot):(chkCat==="tops"?b.wTops:b.wBot);
    return arr?arr.map(x=>({v:x.s,l:x.s})):[];
  },[chkBrand,chkCat,gender]);

  const brandOpts=useMemo(()=>{
    return[{v:"",l:"Select brand..."},...BK.filter(k=>{
      const b=DB[k];return gender==="male"?!!b.mTops:!!b.wTops;
    }).map(k=>({v:k,l:DB[k].name}))];
  },[gender]);

  const brandOptsBots=useMemo(()=>{
    return[{v:"",l:"Select brand..."},...BK.filter(k=>{
      const b=DB[k];return gender==="male"?!!b.mBot:!!b.wBot;
    }).map(k=>({v:k,l:DB[k].name}))];
  },[gender]);

  function run(){
    let m={bust:null,waist:null,hip:null};
    if(mode==="measure"){
      const h=parseFloat(height),w=parseFloat(weight),wa=parseFloat(waistM);
      if(h&&w)m.bust=estBust(h,w,gender);
      if(wa){m.waist=wa;m.hip=estHip(wa,gender);}
    } else {
      // Merge measurements from known top + known bottom
      if(kTopBrand&&kTopSize){
        const tm=getMFromKnown(kTopBrand,"tops",kTopSize,gender);
        if(tm){m.bust=tm.bust;if(tm.waist)m.waist=tm.waist;}
      }
      if(kBotBrand&&kBotSize){
        const bm=getMFromKnown(kBotBrand,"bottoms",kBotSize,gender);
        if(bm){if(bm.waist)m.waist=bm.waist;if(bm.hip)m.hip=bm.hip;}
      }
    }
    if(!m.bust&&!m.waist&&!m.hip)return;

    const preds=BL.map(b=>{
      const tArr=gender==="male"?b.mTops:b.wTops;
      const bArr=gender==="male"?b.mBot:b.wBot;
      return{brand:b,top:predict(tArr,m),bot:predict(bArr,m)};
    }).filter(p=>p.top.s!=="N/A"||p.bot.s!=="N/A");
    setResults({m,preds});setChkRes(null);
  }

  const canRun=mode==="measure"?((height&&weight)||waistM):(kTopBrand&&kTopSize)||(kBotBrand&&kBotSize);
  const fitId=results?`WMS-${String(Math.abs(JSON.stringify(results.m).split('').reduce((a,b)=>((a<<5)-a)+b.charCodeAt(0),0)%99999)).padStart(5,'0')}`:null;

  return <div style={{padding:"100px 24px 80px",maxWidth:1100,margin:"0 auto"}}>
    <div style={{display:"grid",gridTemplateColumns:results?"380px 1fr":"1fr",gap:36,alignItems:"start"}}>

      {/* LEFT — INPUT */}
      <div style={{maxWidth:results?"none":500,margin:results?0:"0 auto",width:"100%"}}>
        <div style={{background:C.sf,border:`1px solid ${C.bd}`,borderRadius:18,padding:28,position:results?"sticky":"static",top:96}}>
          <h2 style={{fontFamily:F.d,fontSize:24,marginBottom:3}}>Find Your Size</h2>
          <p style={{color:C.dm,fontSize:13,marginBottom:20}}>Works for men & women. {BL.length} brands.</p>

          {/* Gender */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:2,background:C.sf3,borderRadius:9,padding:2,marginBottom:16}}>
            {["female","male"].map(g=><button key={g} onClick={()=>{setGender(g);setResults(null);setKTopBrand("");setKBotBrand("");setKTopSize("");setKBotSize("")}} style={{background:gender===g?C.bd:"transparent",border:"none",borderRadius:7,padding:"9px 8px",color:gender===g?C.tx:C.dm,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:F.b,textTransform:"capitalize"}}>{g==="female"?"Women's":"Men's"}</button>)}
          </div>

          {/* Mode */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:2,background:C.sf3,borderRadius:9,padding:2,marginBottom:18}}>
            {[{k:"known",l:"I know my size"},{k:"measure",l:"Height / Weight / Waist"}].map(m=><button key={m.k} onClick={()=>{setMode(m.k);setResults(null)}} style={{background:mode===m.k?C.bd:"transparent",border:"none",borderRadius:7,padding:"9px 6px",color:mode===m.k?C.tx:C.dm,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:F.b}}>{m.l}</button>)}
          </div>

          {mode==="known"?<>
            <p style={{fontSize:12,fontWeight:600,color:C.tx,marginBottom:8}}>What top fits you?</p>
            <Sel label="Brand" value={kTopBrand} onChange={v=>{setKTopBrand(v);setKTopSize("")}} options={brandOpts}/>
            {kTopBrand&&<Sel label="Your top size" value={kTopSize} onChange={setKTopSize} options={[{v:"",l:"Select size..."},...topOptions]}/>}

            <p style={{fontSize:12,fontWeight:600,color:C.tx,marginBottom:8,marginTop:8}}>What bottoms fit you?</p>
            <Sel label="Brand" value={kBotBrand} onChange={v=>{setKBotBrand(v);setKBotSize("")}} options={brandOptsBots}/>
            {kBotBrand&&<Sel label="Your bottom size" value={kBotSize} onChange={setKBotSize} options={[{v:"",l:"Select size..."},...botOptions]}/>}

            <p style={{fontSize:11,color:C.dm,marginBottom:12,marginTop:8,lineHeight:1.4}}>Fill in at least one. Both = better predictions.</p>
          </>:<>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Fld label="Height (inches)" value={height} onChange={setHeight} placeholder="e.g. 66"/>
              <Fld label="Weight (lbs)" value={weight} onChange={setWeight} placeholder="e.g. 145"/>
            </div>
            <Fld label="Waist (inches)" value={waistM} onChange={setWaistM} placeholder="e.g. 28"/>
            <p style={{fontSize:11,color:C.dm,marginBottom:12,lineHeight:1.4}}>Height + weight estimates your bust/chest. Waist predicts your bottom size. More = better.</p>
          </>}

          <button onClick={run} disabled={!canRun} style={{width:"100%",background:canRun?C.ac:C.bd,color:canRun?C.bg:C.dm,border:"none",borderRadius:10,padding:14,fontSize:15,fontWeight:700,cursor:canRun?"pointer":"not-allowed",fontFamily:F.b}}>{results?"Update":"Get My Sizes"}</button>
        </div>

        {/* Will this fit? */}
        {results&&<div style={{background:C.sf,border:`1px solid ${C.bd}`,borderRadius:18,padding:24,marginTop:14}}>
          <h3 style={{fontSize:14,fontWeight:700,marginBottom:3}}>Quick Check</h3>
          <p style={{color:C.dm,fontSize:12,marginBottom:12}}>Will a specific size fit you?</p>
          <Sel label="Brand" value={chkBrand} onChange={v=>{setChkBrand(v);setChkSize("");setChkRes(null)}} options={brandOpts}/>
          <Sel label="Category" value={chkCat} onChange={v=>{setChkCat(v);setChkSize("");setChkRes(null)}} options={[{v:"tops",l:"Tops"},{v:"bottoms",l:"Bottoms"}]}/>
          {chkBrand&&<Sel label="Size" value={chkSize} onChange={v=>{setChkSize(v);setChkRes(null)}} options={[{v:"",l:"Select..."},...chkOptions]}/>}
          <button onClick={()=>{if(!chkBrand||!chkSize||!results)return;const b=DB[chkBrand];const arr=gender==="male"?(chkCat==="tops"?b.mTops:b.mBot):(chkCat==="tops"?b.wTops:b.wBot);const r=willFit(arr,chkSize,results.m);setChkRes({b,size:chkSize,cat:chkCat,r});}} disabled={!chkBrand||!chkSize} style={{width:"100%",background:chkBrand&&chkSize?C.bd:C.sf3,color:chkBrand&&chkSize?C.tx:C.dm,border:`1px solid ${C.bd}`,borderRadius:9,padding:10,fontSize:13,fontWeight:600,cursor:chkBrand&&chkSize?"pointer":"not-allowed",fontFamily:F.b}}>Will it fit?</button>
          {chkRes&&chkRes.r&&<div style={{marginTop:12,padding:14,borderRadius:10,background:chkRes.r.c+"10",border:`1px solid ${chkRes.r.c}30`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <span style={{fontSize:18}}>{chkRes.r.e}</span><span style={{fontWeight:700,fontSize:15,color:chkRes.r.c}}>{chkRes.r.v}</span>
            </div>
            <p style={{fontSize:12,color:C.tx}}>{chkRes.b.name} {chkRes.size}: {chkRes.r.d}</p>
          </div>}
        </div>}
      </div>

      {/* RIGHT — RESULTS */}
      {results&&<div>
        {/* Fit ID */}
        <div style={{background:`linear-gradient(135deg,${C.sf2},#1A1E12)`,border:"1px solid #CDFF5030",borderRadius:14,padding:22,marginBottom:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div><span style={{fontSize:10,color:C.dm,textTransform:"uppercase",letterSpacing:".1em"}}>Your Fit ID</span>
              <div style={{fontFamily:F.m,fontSize:26,fontWeight:700,color:C.ac}}>{fitId}</div>
            </div>
            <button onClick={()=>{navigator.clipboard?.writeText(`${fitId} — whatsmysize.ai`);setCopied(true);setTimeout(()=>setCopied(false),2000)}} style={{background:copied?"#47FF8A20":C.bd,border:`1px solid ${copied?"#47FF8A":C.bd}`,borderRadius:7,padding:"7px 12px",color:copied?"#47FF8A":C.tx,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:F.b}}>{copied?"Copied!":"Copy & Share"}</button>
          </div>
          <p style={{fontSize:11,color:C.dm,marginTop:8}}>Save this. Share it with someone buying you clothes.</p>
          <div style={{display:"flex",gap:12,marginTop:10,flexWrap:"wrap"}}>
            {results.m.bust&&<span style={{fontSize:11,fontFamily:F.m,color:C.tx,background:C.sf3,padding:"3px 8px",borderRadius:5}}>{gender==="female"?"Bust":"Chest"}: {Math.round(results.m.bust*10)/10}"</span>}
            {results.m.waist&&<span style={{fontSize:11,fontFamily:F.m,color:C.tx,background:C.sf3,padding:"3px 8px",borderRadius:5}}>Waist: {Math.round(results.m.waist*10)/10}"</span>}
            {results.m.hip&&<span style={{fontSize:11,fontFamily:F.m,color:C.tx,background:C.sf3,padding:"3px 8px",borderRadius:5}}>Hip: {Math.round(results.m.hip*10)/10}"</span>}
          </div>
        </div>

        <h2 style={{fontFamily:F.d,fontSize:26,marginBottom:4}}>Your sizes, every brand</h2>
        <p style={{color:C.dm,fontSize:13,marginBottom:16}}>{gender==="female"?"Women's":"Men's"} sizing across {results.preds.length} brands</p>

        <div style={{display:"grid",gap:10}}>
          {results.preds.map(({brand:b,top,bot})=>{
            const fc2=b.big?"#FF6B35":b.small?"#35B8FF":"#47FF8A";
            return <div key={b.name} style={{background:C.sf,border:`1px solid ${C.bd}`,borderRadius:12,padding:"18px 20px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:34,height:34,borderRadius:8,background:b.c+"18",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11,color:b.c,fontFamily:F.m}}>{b.i}</div>
                  <span style={{fontWeight:600,fontSize:14}}>{b.name}</span>
                </div>
                <span style={{fontSize:9,fontWeight:600,padding:"2px 7px",borderRadius:100,textTransform:"uppercase",background:fc2+"15",color:fc2}}>{b.big?"Runs Big":b.small?"Runs Small":"TTS"}</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <SizeBox label="Tops" s={top.s} conf={top.conf}/>
                <SizeBox label="Bottoms" s={bot.s} conf={bot.conf}/>
              </div>
            </div>;
          })}
        </div>
      </div>}
    </div>
  </div>;
}

function SizeBox({label,s,conf}){
  const cc=conf>=85?"#47FF8A":conf>=70?C.ac:"#FF6B35";
  return <div style={{background:C.sf2,borderRadius:9,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <div><span style={{fontSize:10,color:C.dm,textTransform:"uppercase",letterSpacing:".06em",display:"block"}}>{label}</span>
      <span style={{fontFamily:F.m,fontSize:18,fontWeight:700,color:s==="N/A"?C.dm:C.ac}}>{s}</span>
    </div>
    {s!=="N/A"&&<div style={{textAlign:"right"}}><span style={{fontSize:10,color:C.dm,display:"block"}}>Confidence</span>
      <span style={{fontFamily:F.m,fontSize:14,fontWeight:600,color:cc}}><AnimN v={conf}/></span>
    </div>}
  </div>;
}
