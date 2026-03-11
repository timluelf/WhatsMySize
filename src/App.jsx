import { useState, useEffect, useMemo } from "react";

/* ══════════════════════════════════════════════════
   WHATSMYSIZE — Know your size, everywhere.
   Warm, clean, mobile-first. v2.
   ══════════════════════════════════════════════════ */

// ── Estimation ──
function estBust(h,w,g){const hc=h*2.54,wk=w*.4536;let c=41.49+.087*hc+.667*wk-.001087*hc*wk;if(g==="male")c+=.017*wk;return Math.round(c/2.54*10)/10}
function estHip(w,g){return g==="female"?w+8.5:w+5}

// ── Categories ──
const CATS={athletic:"Athletic & Active",premium:"Premium & Designer",casual:"Everyday Casual",fast:"Fast Fashion",intimates:"Intimates & Lounge",workwear:"Workwear"};

// ── Brand DB — 25 brands ──
const DB = {
  nike:{name:"Nike",cat:"athletic",tag:"True to size",big:0,small:0,
    mN:"Standard US sizing. Dri-FIT more fitted.",wN:"TTS. Go up for relaxed fit.",
    mT:[{s:"S",b:[35,37.5],w:[29,32]},{s:"M",b:[37.5,41],w:[32,35]},{s:"L",b:[41,44],w:[35,38]},{s:"XL",b:[44,48.5],w:[38,43]}],
    mB:[{s:"S (28-30)",w:[29,32],h:[35,37.5]},{s:"M (32-34)",w:[32,35],h:[37.5,41]},{s:"L (34-36)",w:[35,38],h:[41,44]},{s:"XL (38-40)",w:[38,43],h:[44,47]}],
    wT:[{s:"XS (0-2)",b:[29.5,32.5],w:[23.5,26]},{s:"S (4-6)",b:[32.5,35.5],w:[26,29]},{s:"M (8-10)",b:[35.5,38],w:[29,31.5]},{s:"L (12-14)",b:[38,41],w:[31.5,34.5]},{s:"XL (16-18)",b:[41,44.5],w:[34.5,38.5]}],
    wB:[{s:"XS (0-2)",w:[23.5,26],h:[33,35.5]},{s:"S (4-6)",w:[26,29],h:[35.5,38.5]},{s:"M (8-10)",w:[29,31.5],h:[38.5,41]},{s:"L (12-14)",w:[31.5,34.5],h:[41,44]},{s:"XL (16-18)",w:[34.5,38.5],h:[44,47]}]},
  lululemon:{name:"Lululemon",cat:"athletic",tag:"Runs slightly small",big:0,small:1,
    mN:"Tailored athletic. Nike L may need XL here.",wN:"Leggings TTS. Built-in bra tops run small — size up.",
    mT:[{s:"S",b:[37,38],w:[29,30]},{s:"M",b:[39,40],w:[31,32]},{s:"L",b:[42,43],w:[34,35]},{s:"XL",b:[45,46],w:[37,38]}],
    mB:[{s:"S (30)",w:[29,30],h:[35,36]},{s:"M (32)",w:[31,32],h:[37,38]},{s:"L (34)",w:[34,35],h:[40,41]},{s:"XL (36)",w:[37,38],h:[43,44]}],
    wT:[{s:"2 (XXS)",b:[30,31],w:[23,24]},{s:"4 (XS)",b:[32,33],w:[25,26]},{s:"6 (S)",b:[34,35],w:[27,28]},{s:"8 (M)",b:[36,37],w:[29,30]},{s:"10 (L)",b:[38,39],w:[31,32]},{s:"12 (XL)",b:[40,41],w:[33,34]}],
    wB:[{s:"2 (XXS)",w:[23,24],h:[33,34]},{s:"4 (XS)",w:[25,26],h:[35,36]},{s:"6 (S)",w:[27,28],h:[37,38]},{s:"8 (M)",w:[29,30],h:[39,40]},{s:"10 (L)",w:[31,32],h:[41,42]},{s:"12 (XL)",w:[33,34],h:[43,44]}]},
  underarmour:{name:"Under Armour",cat:"athletic",tag:"Compression runs tight",big:0,small:1,
    mN:"Compression 1-2 sizes small. Loose = Nike.",wN:"HeatGear Compression very tight. Size up.",
    mT:[{s:"S",b:[34,36],w:[28.5,30]},{s:"M",b:[38,40],w:[31.5,33.5]},{s:"L",b:[42,44],w:[35,37]},{s:"XL",b:[46,48],w:[39,41]}],
    mB:[{s:"S (30)",w:[28.5,30],h:[34,36]},{s:"M (32)",w:[31.5,33.5],h:[37,39]},{s:"L (34-36)",w:[35,37],h:[40,43]},{s:"XL (38-40)",w:[39,41],h:[44,47]}],
    wT:[{s:"XS (0-2)",b:[30,32.5],w:[23,25.5]},{s:"S (4-6)",b:[32.5,35.5],w:[25.5,28.5]},{s:"M (8-10)",b:[35.5,37.5],w:[28.5,30.5]},{s:"L (12-14)",b:[39,40.5],w:[32,33.5]},{s:"XL (16)",b:[42,43.5],w:[35,36.5]}],
    wB:[{s:"XS (0-2)",w:[23,25.5],h:[33,35.5]},{s:"S (4-6)",w:[25.5,28.5],h:[35.5,38.5]},{s:"M (8-10)",w:[28.5,30.5],h:[38.5,41]},{s:"L (12-14)",w:[32,33.5],h:[41.5,44]},{s:"XL (16)",w:[35,36.5],h:[44,46.5]}]},
  adidas:{name:"Adidas",cat:"athletic",tag:"True to size",big:0,small:0,
    mN:"European heritage, slightly narrower shoulders.",wN:"TTS. Originals slightly narrow.",
    mT:[{s:"S",b:[34.5,36],w:[29.5,31.5]},{s:"M",b:[36.5,39],w:[32,34.5]},{s:"L",b:[39.5,42.5],w:[35,38]},{s:"XL",b:[43,46.5],w:[38.5,42]}],
    mB:[{s:"S (28-30)",w:[30,32],h:[35,37]},{s:"M (32-34)",w:[32,35],h:[37,40]},{s:"L (34-36)",w:[35,39],h:[40,44]},{s:"XL (38-40)",w:[39,43],h:[44,48]}],
    wT:[{s:"XS (0-2)",b:[30.5,32.5],w:[23.5,25.5]},{s:"S (4-6)",b:[32.5,35],w:[25.5,28]},{s:"M (8-10)",b:[35,38],w:[28,31]},{s:"L (12-14)",b:[38,41],w:[31,34]},{s:"XL (16-18)",b:[41,44.5],w:[34,37.5]}],
    wB:[{s:"XS (0-2)",w:[23.5,25.5],h:[33.5,35.5]},{s:"S (4-6)",w:[25.5,28],h:[35.5,38]},{s:"M (8-10)",w:[28,31],h:[38,41]},{s:"L (12-14)",w:[31,34],h:[41,44]},{s:"XL (16-18)",w:[34,37.5],h:[44,47.5]}]},
  champion:{name:"Champion",cat:"athletic",tag:"True to size",big:0,small:0,
    mN:"Similar to Nike. Reverse Weave may shrink.",wN:"TTS. Consistent.",
    mT:[{s:"S",b:[34,36],w:[28,30]},{s:"M",b:[38,40],w:[32,34]},{s:"L",b:[42,44],w:[36,38]},{s:"XL",b:[46,48],w:[40,42]}],
    mB:[{s:"S (28-30)",w:[28,30],h:[37,38]},{s:"M (32-34)",w:[32,34],h:[39,41]},{s:"L (36-38)",w:[36,38],h:[42,43]},{s:"XL (40-42)",w:[40,42],h:[44,46]}],
    wT:[{s:"XS",b:[31,33],w:[24,26]},{s:"S",b:[33,35.5],w:[26,28.5]},{s:"M",b:[35.5,38],w:[28.5,31]},{s:"L",b:[38,41],w:[31,34]},{s:"XL",b:[41,44],w:[34,37]}],
    wB:[{s:"XS",w:[24,26],h:[34,36]},{s:"S",w:[26,28.5],h:[36,38.5]},{s:"M",w:[28.5,31],h:[38.5,41]},{s:"L",w:[31,34],h:[41,44]},{s:"XL",w:[34,37],h:[44,47]}]},
  athleta:{name:"Athleta",cat:"athletic",tag:"True to size",big:0,small:0,
    mN:null,wN:"Gap-owned. TTS athletic/yoga fit.",
    mT:null,mB:null,
    wT:[{s:"XXS (0)",b:[32,33],w:[24.5,25.5]},{s:"XS (2-4)",b:[33.5,35],w:[26,27.5]},{s:"S (6-8)",b:[35.5,37.5],w:[28,30]},{s:"M (10-12)",b:[38,40.5],w:[30.5,33]},{s:"L (14-16)",b:[41,43.5],w:[33.5,36]},{s:"XL (18-20)",b:[44,47],w:[36.5,39.5]}],
    wB:[{s:"0 (XXS)",w:[24.5,25.5],h:[34.5,35.5]},{s:"2-4 (XS)",w:[26,27.5],h:[36,37.5]},{s:"6-8 (S)",w:[28,30],h:[38,40]},{s:"10-12 (M)",w:[30.5,33],h:[40.5,43]},{s:"14-16 (L)",w:[33.5,36],h:[43.5,46]},{s:"18-20 (XL)",w:[36.5,39.5],h:[46.5,49.5]}]},
  ralphlauren:{name:"Ralph Lauren",cat:"premium",tag:"True to size",big:0,small:0,
    mN:"Classic Fit generous. Slim Fit narrower.",wN:"Polo TTS. Lauren roomier.",
    mT:[{s:"S",b:[34,36],w:[28,30]},{s:"M",b:[38,40],w:[31,34]},{s:"L",b:[42,44],w:[35,38]},{s:"XL",b:[46,48],w:[40,42]}],
    mB:[{s:"30",w:[30,31],h:[36,37]},{s:"32",w:[32,33],h:[38,39]},{s:"34",w:[34,35],h:[40,41]},{s:"36",w:[36,37],h:[42,43]}],
    wT:[{s:"XS (2)",b:[32,34],w:[25,27]},{s:"S (4-6)",b:[34,36.5],w:[27,29.5]},{s:"M (8-10)",b:[36.5,39],w:[29.5,32]},{s:"L (12-14)",b:[39,42],w:[32,35]},{s:"XL (16)",b:[42,45],w:[35,38]}],
    wB:[{s:"2 (XS)",w:[25,27],h:[35,37]},{s:"4-6 (S)",w:[27,29.5],h:[37,39.5]},{s:"8-10 (M)",w:[29.5,32],h:[39.5,42]},{s:"12-14 (L)",w:[32,35],h:[42,45]},{s:"16 (XL)",w:[35,38],h:[45,48]}]},
  anthropologie:{name:"Anthropologie",cat:"premium",tag:"True to size",big:0,small:0,
    mN:null,wN:"TTS with bohemian fit. Petite and Plus available.",
    mT:null,mB:null,
    wT:[{s:"XXS (00)",b:[32,33],w:[24,25]},{s:"XS (0-2)",b:[33,34],w:[25,26]},{s:"S (4-6)",b:[35,36],w:[27,28]},{s:"M (8-10)",b:[37,38],w:[29,30]},{s:"L (12-14)",b:[39.5,41],w:[31.5,33]},{s:"XL (16)",b:[42.5,43],w:[34.5,35]}],
    wB:[{s:"00 (XXS)",w:[24,25],h:[34,35]},{s:"0-2 (XS)",w:[25,26],h:[35,36]},{s:"4-6 (S)",w:[27,28],h:[37,38]},{s:"8-10 (M)",w:[29,30],h:[39,40]},{s:"12-14 (L)",w:[31.5,33],h:[41.5,43]},{s:"16 (XL)",w:[34.5,35],h:[44.5,45]}]},
  freepeople:{name:"Free People",cat:"premium",tag:"Runs big — oversized style",big:1,small:0,
    mN:null,wN:"Bohemian oversized. Size down for fitted. Denim TTS.",
    mT:null,mB:null,
    wT:[{s:"XS (0-2)",b:[33,34.5],w:[25,26.5]},{s:"S (4-6)",b:[35,36.5],w:[27,28.5]},{s:"M (8-10)",b:[37,39],w:[29,31]},{s:"L (12-14)",b:[39.5,42],w:[31.5,34]}],
    wB:[{s:"25 (0)",w:[25,26],h:[35,36]},{s:"26 (2)",w:[26,27],h:[36,37]},{s:"27 (4)",w:[27,28],h:[37,38]},{s:"28 (6)",w:[28,29],h:[38,39]},{s:"29 (8)",w:[29,30],h:[39,40]},{s:"30 (10)",w:[30,31],h:[40,41]},{s:"31 (12)",w:[31,32],h:[41,42.5]}]},
  madewell:{name:"Madewell",cat:"premium",tag:"True to size",big:0,small:0,
    mN:"Small men's line.",wN:"Excellent denim. TTS. Curvy jeans more hip room.",
    mT:[{s:"S",b:[36,38],w:[30,32]},{s:"M",b:[38,41],w:[32,35]},{s:"L",b:[41,44],w:[35,38]}],
    mB:[{s:"30",w:[30,31],h:[36,37]},{s:"32",w:[32,33],h:[38,39]},{s:"34",w:[34,35],h:[40,41]}],
    wT:[{s:"XXS (00)",b:[31,32.5],w:[23,24.5]},{s:"XS (0-2)",b:[33,34],w:[25,26]},{s:"S (4-6)",b:[35,36.5],w:[27,28.5]},{s:"M (8-10)",b:[37,39],w:[29,31]},{s:"L (12-14)",b:[39.5,42],w:[31.5,34]}],
    wB:[{s:"24 (0)",w:[24,25],h:[34,35]},{s:"25 (2)",w:[25,26],h:[35,36]},{s:"26 (4)",w:[26,27],h:[36,37]},{s:"27 (6)",w:[27,28],h:[37,38]},{s:"28 (8)",w:[28,29],h:[38,39]},{s:"29 (10)",w:[29,30],h:[39,40.5]},{s:"30 (12)",w:[30,31],h:[40.5,42]}]},
  aritzia:{name:"Aritzia",cat:"premium",tag:"Runs slightly small",big:0,small:1,
    mN:null,wN:"Canadian. Runs slightly small. TNA more relaxed.",
    mT:null,mB:null,
    wT:[{s:"XXS (0)",b:[31,32.5],w:[23.5,25]},{s:"XS (2)",b:[32.5,34],w:[25,26.5]},{s:"S (4-6)",b:[34,36.5],w:[26.5,29]},{s:"M (8-10)",b:[36.5,39],w:[29,31.5]},{s:"L (12-14)",b:[39,42],w:[31.5,34.5]}],
    wB:[{s:"0 (XXS)",w:[23.5,25],h:[33.5,35]},{s:"2 (XS)",w:[25,26.5],h:[35,36.5]},{s:"4-6 (S)",w:[26.5,29],h:[36.5,39]},{s:"8-10 (M)",w:[29,31.5],h:[39,41.5]},{s:"12-14 (L)",w:[31.5,34.5],h:[41.5,44.5]}]},
  skims:{name:"SKIMS",cat:"intimates",tag:"Shapewear tight, lounge TTS",big:0,small:1,
    mN:null,wN:"Shapewear: size up. Lounge: TTS. Fits Everybody stretchy.",
    mT:null,mB:null,
    wT:[{s:"XXS",b:[30,31.5],w:[22,23.5]},{s:"XS (0-2)",b:[31.5,33.5],w:[23.5,25.5]},{s:"S (4-6)",b:[33.5,36],w:[25.5,28]},{s:"M (8-10)",b:[36,38.5],w:[28,30.5]},{s:"L (12-14)",b:[38.5,41.5],w:[30.5,33.5]},{s:"XL (16-18)",b:[41.5,44.5],w:[33.5,36.5]}],
    wB:[{s:"XXS",w:[22,23.5],h:[32.5,34]},{s:"XS (0-2)",w:[23.5,25.5],h:[34,36]},{s:"S (4-6)",w:[25.5,28],h:[36,38.5]},{s:"M (8-10)",w:[28,30.5],h:[38.5,41]},{s:"L (12-14)",w:[30.5,33.5],h:[41,44]},{s:"XL (16-18)",w:[33.5,36.5],h:[44,47]}]},
  victoriassecret:{name:"Victoria's Secret",cat:"intimates",tag:"Apparel TTS",big:0,small:0,
    mN:null,wN:"PINK line TTS. Bras use band+cup.",
    mT:null,mB:null,
    wT:[{s:"XS (0-2)",b:[32,33.5],w:[24,25.5]},{s:"S (4-6)",b:[34,35.5],w:[26,27.5]},{s:"M (8-10)",b:[36,38],w:[28,30]},{s:"L (12-14)",b:[38.5,40.5],w:[30.5,32.5]},{s:"XL (16-18)",b:[41,43.5],w:[33,35.5]}],
    wB:[{s:"XS (0-2)",w:[24,25.5],h:[34.5,36]},{s:"S (4-6)",w:[26,27.5],h:[36.5,38]},{s:"M (8-10)",w:[28,30],h:[38.5,40.5]},{s:"L (12-14)",w:[30.5,32.5],h:[41,43]},{s:"XL (16-18)",w:[33,35.5],h:[43.5,46]}]},
  gap:{name:"Gap",cat:"casual",tag:"True to size",big:0,small:0,
    mN:"Consistent US sizing.",wN:"TTS. Tall and Petite available.",
    mT:[{s:"S",b:[35,37.5],w:[29,31.5]},{s:"M",b:[38,40.5],w:[32,34.5]},{s:"L",b:[42,44],w:[37,39]},{s:"XL",b:[45,48],w:[40,43]}],
    mB:[{s:"30 (S)",w:[30,31],h:[36,37]},{s:"32 (M)",w:[32,33],h:[38,39]},{s:"34 (L)",w:[34,35.5],h:[40,41]},{s:"36 (L)",w:[36,37.5],h:[42,43]}],
    wT:[{s:"XS (0-2)",b:[32,34],w:[24.5,26.5]},{s:"S (4-6)",b:[34,36.5],w:[26.5,29]},{s:"M (8-10)",b:[36.5,39],w:[29,31.5]},{s:"L (12-14)",b:[39,42],w:[31.5,34.5]},{s:"XL (16-18)",b:[42,45.5],w:[34.5,38]}],
    wB:[{s:"0-2 (XS)",w:[24.5,26.5],h:[34.5,36.5]},{s:"4-6 (S)",w:[26.5,29],h:[36.5,39]},{s:"8-10 (M)",w:[29,31.5],h:[39,41.5]},{s:"12-14 (L)",w:[31.5,34.5],h:[41.5,44.5]},{s:"16-18 (XL)",w:[34.5,38],h:[44.5,48]}]},
  oldnavy:{name:"Old Navy",cat:"casual",tag:"Runs slightly big",big:1,small:0,
    mN:"Generous vanity sizing.",wN:"Generous — often size down from other brands.",
    mT:[{s:"S",b:[35,38],w:[29,32]},{s:"M",b:[38,41],w:[32,35]},{s:"L",b:[41,44],w:[35,38]},{s:"XL",b:[44,48],w:[38,43]}],
    mB:[{s:"30 (S)",w:[29,31],h:[36,38]},{s:"32-34 (M)",w:[32,35],h:[38,41]},{s:"36-38 (L)",w:[36,38],h:[42,44]}],
    wT:[{s:"XS (0-2)",b:[33,35],w:[25,27]},{s:"S (4-6)",b:[35,37.5],w:[27,29.5]},{s:"M (8-10)",b:[37.5,40],w:[29.5,32]},{s:"L (12-14)",b:[40,43],w:[32,35]},{s:"XL (16-18)",b:[43,46.5],w:[35,38.5]}],
    wB:[{s:"0-2 (XS)",w:[25,27],h:[35,37]},{s:"4-6 (S)",w:[27,29.5],h:[37,39.5]},{s:"8-10 (M)",w:[29.5,32],h:[39.5,42]},{s:"12-14 (L)",w:[32,35],h:[42,45]},{s:"16-18 (XL)",w:[35,38.5],h:[45,48.5]}]},
  americaneagle:{name:"American Eagle",cat:"casual",tag:"True to size",big:0,small:0,
    mN:"Consistent. Slim vs Classic fit.",wN:"TTS with slight vanity sizing. Curvy collection available.",
    mT:[{s:"S",b:[34,37],w:[28,31]},{s:"M",b:[37,40],w:[31,34]},{s:"L",b:[40,43],w:[34,37]},{s:"XL",b:[43,46],w:[37,40]}],
    mB:[{s:"28",w:[28,29],h:[34,35]},{s:"30",w:[30,31],h:[36,37]},{s:"32",w:[32,33],h:[38,39]},{s:"34",w:[34,35],h:[40,41]},{s:"36",w:[36,37],h:[42,43]}],
    wT:[{s:"XS (0)",b:[32,34],w:[24.5,26]},{s:"S (4)",b:[34,36],w:[26.5,28]},{s:"M (8)",b:[36,38.5],w:[28.5,30.5]},{s:"L (12)",b:[39,41.5],w:[31.5,33.5]},{s:"XL (16)",b:[42,44.5],w:[34.5,36.5]}],
    wB:[{s:"00 (23)",w:[23.5,24],h:[33,34]},{s:"0 (24)",w:[24.5,25.5],h:[34,35]},{s:"2 (25)",w:[25.5,26.5],h:[35,36]},{s:"4 (26)",w:[26.5,27.5],h:[36,37]},{s:"6 (27)",w:[27.5,28.5],h:[37,38]},{s:"8 (28)",w:[28.5,29.5],h:[38,39.5]},{s:"10 (30)",w:[30,31],h:[39.5,41]},{s:"12 (31)",w:[31.5,32.5],h:[41,42.5]}]},
  abercrombie:{name:"Abercrombie & Fitch",cat:"casual",tag:"Runs slightly small",big:0,small:1,
    mN:"Slim fit. Size up for relaxed.",wN:"Runs small. Curve Love has more hip room.",
    mT:[{s:"S",b:[35,37.5],w:[29,31.5]},{s:"M",b:[37.5,40],w:[31.5,34]},{s:"L",b:[40,43],w:[34,37]},{s:"XL",b:[43,46],w:[37,40]}],
    mB:[{s:"28",w:[28,29],h:[34,35]},{s:"30",w:[30,31],h:[36,37]},{s:"32",w:[32,33],h:[38,39]},{s:"34",w:[34,35],h:[40,41]}],
    wT:[{s:"XXS (00)",b:[31,32.5],w:[23,24.5]},{s:"XS (0-2)",b:[32.5,34.5],w:[24.5,26.5]},{s:"S (4-6)",b:[34.5,37],w:[26.5,29]},{s:"M (8-10)",b:[37,39.5],w:[29,31.5]},{s:"L (12-14)",b:[39.5,42],w:[31.5,34]}],
    wB:[{s:"24 (00)",w:[24,25],h:[34,35]},{s:"25 (0)",w:[25,26],h:[35,36]},{s:"26 (2)",w:[26,27],h:[36,37]},{s:"27 (4)",w:[27,28],h:[37,38]},{s:"28 (6)",w:[28,29],h:[38,39]},{s:"29 (8)",w:[29,30],h:[39,40]},{s:"30 (10)",w:[30,31],h:[40,41]},{s:"31 (12)",w:[31,32],h:[41,42]}]},
  levis:{name:"Levi's",cat:"casual",tag:"True to size",big:0,small:0,
    mN:"501=classic, 511=slim, 541=athletic.",wN:"Numeric waist sizing. 721=high rise skinny, 501=original.",
    mT:[{s:"S",b:[35,37.5],w:[29,31.5]},{s:"M",b:[37.5,41],w:[31.5,35]},{s:"L",b:[41,44],w:[35,38]},{s:"XL",b:[44,48],w:[38,42]}],
    mB:[{s:"28",w:[28,29],h:[34,35]},{s:"30",w:[30,31],h:[36,37]},{s:"32",w:[32,33],h:[38,39]},{s:"34",w:[34,35],h:[40,41]},{s:"36",w:[36,37],h:[42,43]},{s:"38",w:[38,39],h:[44,45]}],
    wT:[{s:"XS",b:[32,34],w:[24,26]},{s:"S",b:[34,36],w:[26,28]},{s:"M",b:[36,38.5],w:[28,31]},{s:"L",b:[38.5,41],w:[31,34]},{s:"XL",b:[41,44],w:[34,37]}],
    wB:[{s:"24",w:[24,25],h:[34,35]},{s:"25",w:[25,26],h:[35,36]},{s:"26",w:[26,27],h:[36,37]},{s:"27",w:[27,28],h:[37,38]},{s:"28",w:[28,29],h:[38,39]},{s:"29",w:[29,30],h:[39,40]},{s:"30",w:[30,31],h:[40,41]},{s:"31",w:[31,32],h:[41,42]},{s:"32",w:[32,33],h:[42,43]}]},
  carhartt:{name:"Carhartt",cat:"workwear",tag:"Runs big — size down",big:1,small:0,
    mN:"Cut for layering. Size down for modern fit.",wN:"Women's more fitted than men's but still runs slightly big.",
    mT:[{s:"S",b:[34,36],w:[28,30]},{s:"M",b:[38,40],w:[32,34]},{s:"L",b:[42,44],w:[36,38]},{s:"XL",b:[46,48],w:[40,42]},{s:"2XL",b:[50,52],w:[44,46]}],
    mB:[{s:"30",w:[28,30],h:[34,36]},{s:"32-34",w:[32,34],h:[38,40]},{s:"36-38",w:[36,38],h:[42,44]},{s:"40-42",w:[40,42],h:[46,48]}],
    wT:[{s:"XS (0-2)",b:[33,35],w:[25,27]},{s:"S (4-6)",b:[35,37],w:[27,29]},{s:"M (8-10)",b:[37,40],w:[29,32]},{s:"L (12-14)",b:[40,43],w:[32,35]},{s:"XL (16-18)",b:[43,46],w:[35,38]}],
    wB:[{s:"S (4-6)",w:[27,29],h:[36,38]},{s:"M (8-10)",w:[29,32],h:[38,41]},{s:"L (12-14)",w:[32,35],h:[41,44]},{s:"XL (16-18)",w:[35,38],h:[44,47]}]},
  hm:{name:"H&M",cat:"fast",tag:"Tops run slightly big",big:1,small:0,
    mN:"European cut. H&M M often = Nike L.",wN:"Generally TTS but inconsistent across styles.",
    mT:[{s:"S",b:[34.5,36.25],w:[30,31.5]},{s:"M",b:[37.75,39.5],w:[33,34.5]},{s:"L",b:[41,42.5],w:[36.25,37.75]},{s:"XL",b:[44,45.5],w:[39.5,41]}],
    mB:[{s:"S (30-32)",w:[30,31.5],h:[36.5,37.75]},{s:"M (33-34)",w:[33,34.5],h:[39,40]},{s:"L (36-38)",w:[36.25,37.75],h:[41.25,42.5]}],
    wT:[{s:"XS (2)",b:[31,32.5],w:[24,25.5]},{s:"S (4-6)",b:[33,35.5],w:[26,28.5]},{s:"M (8-10)",b:[36,38.5],w:[29,31.5]},{s:"L (12-14)",b:[39,41.5],w:[32,34.5]},{s:"XL (16-18)",b:[42,44.5],w:[35,37.5]}],
    wB:[{s:"XS (2)",w:[24,25.5],h:[34,35.5]},{s:"S (4-6)",w:[26,28.5],h:[36,38.5]},{s:"M (8-10)",w:[29,31.5],h:[39,41.5]},{s:"L (12-14)",w:[32,34.5],h:[42,44.5]},{s:"XL (16-18)",w:[35,37.5],h:[45,47.5]}]},
  zara:{name:"Zara",cat:"fast",tag:"Runs small — European slim",big:0,small:1,
    mN:"Zara M ≈ US S. Varies by style.",wN:"Runs small. Size up. Very inconsistent.",
    mT:[{s:"S",b:[34,36],w:[28,30]},{s:"M",b:[38,40],w:[32,34]},{s:"L",b:[41,43],w:[34,36]},{s:"XL",b:[44,46],w:[38,40]}],
    mB:[{s:"30 (S)",w:[29,31],h:[37,38]},{s:"32 (M)",w:[31,33],h:[39,40]},{s:"34 (L)",w:[34,35],h:[41,42]}],
    wT:[{s:"XS",b:[31,33],w:[24,26]},{s:"S",b:[33,35],w:[26,28]},{s:"M",b:[35,37.5],w:[28,30.5]},{s:"L",b:[37.5,40],w:[30.5,33]},{s:"XL",b:[40,43],w:[33,36]}],
    wB:[{s:"34 (XS)",w:[24,26],h:[34,36]},{s:"36 (S)",w:[26,28],h:[36,38]},{s:"38 (M)",w:[28,30.5],h:[38,40.5]},{s:"40 (L)",w:[30.5,33],h:[40.5,43]},{s:"42 (XL)",w:[33,36],h:[43,46]}]},
  uniqlo:{name:"Uniqlo",cat:"fast",tag:"Runs slightly small",big:0,small:1,
    mN:"Japanese slimline. Size up for relaxed.",wN:"Runs small for US. Pants more accurate.",
    mT:[{s:"S",b:[35,37.5],w:[29,31.5]},{s:"M",b:[37.5,40],w:[31.5,34]},{s:"L",b:[40,43],w:[34,37]},{s:"XL",b:[43,46],w:[37,40]}],
    mB:[{s:"28 (S)",w:[28,30],h:[34.5,36]},{s:"30-31 (M)",w:[30,32],h:[36,38]},{s:"32-33 (L)",w:[32,34],h:[38,40.5]},{s:"34-36 (XL)",w:[34,37],h:[40.5,43]}],
    wT:[{s:"XS",b:[30.5,32.5],w:[23,25]},{s:"S",b:[32.5,35],w:[25,27.5]},{s:"M",b:[35,37.5],w:[27.5,30]},{s:"L",b:[37.5,40],w:[30,32.5]},{s:"XL",b:[40,43],w:[32.5,35.5]}],
    wB:[{s:"XS (24-25)",w:[23,25],h:[33,35]},{s:"S (26-27)",w:[25,27.5],h:[35,37.5]},{s:"M (28-29)",w:[27.5,30],h:[37.5,40]},{s:"L (30-31)",w:[30,32.5],h:[40,42.5]},{s:"XL (32-33)",w:[32.5,35.5],h:[42.5,45.5]}]},
  forever21:{name:"Forever 21",cat:"fast",tag:"Runs small & inconsistent",big:0,small:1,
    mN:"Basics run small.",wN:"Very inconsistent. Generally small. Always size up.",
    mT:[{s:"S",b:[34,36],w:[28,30]},{s:"M",b:[36,39],w:[30,33]},{s:"L",b:[39,42],w:[33,36]}],
    mB:[{s:"S (30)",w:[28,30],h:[35,37]},{s:"M (32)",w:[30,33],h:[37,40]},{s:"L (34)",w:[33,36],h:[40,43]}],
    wT:[{s:"XS",b:[31,33],w:[23.5,25.5]},{s:"S",b:[33,35],w:[25.5,27.5]},{s:"M",b:[35,37.5],w:[27.5,30]},{s:"L",b:[37.5,40],w:[30,32.5]},{s:"XL",b:[40,43],w:[32.5,35.5]}],
    wB:[{s:"XS (24-25)",w:[23.5,25.5],h:[34,36]},{s:"S (26-27)",w:[25.5,27.5],h:[36,38]},{s:"M (28-29)",w:[27.5,30],h:[38,40.5]},{s:"L (30-31)",w:[30,32.5],h:[40.5,43]},{s:"XL (32-33)",w:[32.5,35.5],h:[43,46]}]},
  shein:{name:"SHEIN",cat:"fast",tag:"Runs very small — size up",big:0,small:1,
    mN:"Runs small. Size up.",wN:"Notoriously inconsistent. 1-2 sizes small vs US brands.",
    mT:[{s:"S",b:[35,37],w:[29,31]},{s:"M",b:[37,39.5],w:[31,33.5]},{s:"L",b:[39.5,42],w:[33.5,36]}],
    mB:[{s:"S (29-30)",w:[29,31],h:[36,38]},{s:"M (31-32)",w:[31,33.5],h:[38,40.5]},{s:"L (33-34)",w:[33.5,36],h:[40.5,43]}],
    wT:[{s:"XS (2)",b:[32,33.5],w:[24,25.5]},{s:"S (4)",b:[33.5,35],w:[25.5,27]},{s:"M (6)",b:[35,37],w:[27,29]},{s:"L (8-10)",b:[37,39.5],w:[29,31.5]},{s:"XL (12)",b:[39.5,42],w:[31.5,34]}],
    wB:[{s:"XS (2)",w:[24,25.5],h:[34,35.5]},{s:"S (4)",w:[25.5,27],h:[35.5,37]},{s:"M (6)",w:[27,29],h:[37,39]},{s:"L (8-10)",w:[29,31.5],h:[39,41.5]},{s:"XL (12)",w:[31.5,34],h:[41.5,44]}]},
  fashionnova:{name:"Fashion Nova",cat:"fast",tag:"Runs very small — body-con",big:0,small:1,
    mN:"Men's TTS.",wN:"Extremely body-con. 1-2 sizes small. Size up.",
    mT:[{s:"S",b:[34,36],w:[28,30]},{s:"M",b:[36,39],w:[30,33]},{s:"L",b:[39,42],w:[33,36]}],
    mB:[{s:"30 (S)",w:[28,30],h:[35,37]},{s:"32 (M)",w:[30,33],h:[37,40]},{s:"34 (L)",w:[33,36],h:[40,43]}],
    wT:[{s:"XS (1)",b:[31,33],w:[23,25]},{s:"S (3-5)",b:[33,35],w:[25,27]},{s:"M (7-9)",b:[35,37.5],w:[27,29.5]},{s:"L (11-13)",b:[37.5,40],w:[29.5,32]},{s:"XL (15)",b:[40,42.5],w:[32,34.5]}],
    wB:[{s:"1 (XS)",w:[23,25],h:[33,35]},{s:"3-5 (S)",w:[25,27],h:[35,37]},{s:"7-9 (M)",w:[27,29.5],h:[37,39.5]},{s:"11-13 (L)",w:[29.5,32],h:[39.5,42]},{s:"15 (XL)",w:[32,34.5],h:[42,44.5]}]},
};

const BL = Object.values(DB);
const BK = Object.keys(DB);

const VIBES = ["petite","athletic","curvy","tall","slim","busty","pear-shaped","plus-size","straight","hourglass"];

// ── Prediction ──
function pred(arr, m) {
  if (!arr) return {s:"N/A",c:0};
  let best=null, bs=Infinity;
  for (const e of arr) {
    let sc=0, f=0;
    if (m.bust && e.b) { sc += Math.abs(m.bust-(e.b[0]+e.b[1])/2); f++; }
    if (m.waist && e.w) { sc += Math.abs(m.waist-(e.w[0]+e.w[1])/2); f++; }
    if (m.hip && e.h) { sc += Math.abs(m.hip-(e.h[0]+e.h[1])/2); f++; }
    if (f > 0) { sc /= f; if (sc < bs) { bs = sc; best = e; } }
  }
  let c = bs<=1?96:bs<=2?91:bs<=3.5?83:bs<=5?73:62;
  return {s: best?.s || "—", c};
}

function willFit(arr, sl, m) {
  if (!arr) return null;
  const e = arr.find(x => x.s === sl); if (!e) return null;
  let t=0, n=0, ok=true;
  if (m.bust && e.b) { t += m.bust-(e.b[0]+e.b[1])/2; n++; if (m.bust<e.b[0]-1||m.bust>e.b[1]+1) ok=false; }
  if (m.waist && e.w) { t += m.waist-(e.w[0]+e.w[1])/2; n++; if (m.waist<e.w[0]-1||m.waist>e.w[1]+1) ok=false; }
  if (m.hip && e.h) { t += m.hip-(e.h[0]+e.h[1])/2; n++; if (m.hip<e.h[0]-1||m.hip>e.h[1]+1) ok=false; }
  if (!n) return null;
  const a = t/n;
  if (ok && Math.abs(a)<=1) return {v:"Perfect fit",e:"💚",cl:"#22c55e"};
  if (a>1&&a<=3) return {v:"Might be snug",e:"🤏",cl:"#f59e0b"};
  if (a>3) return {v:"Too small — size up",e:"📏",cl:"#ef4444"};
  if (a<-1&&a>=-3) return {v:"Might be roomy",e:"🫧",cl:"#60a5fa"};
  if (a<-3) return {v:"Too big — size down",e:"📐",cl:"#ef4444"};
  return {v:"Should work",e:"👍",cl:"#22c55e"};
}

function getM(slug, cat, sl, g) {
  const brand = DB[slug]; if (!brand) return null;
  const arr = g==="male" ? (cat==="tops"?brand.mT:brand.mB) : (cat==="tops"?brand.wT:brand.wB);
  if (!arr) return null;
  const x = arr.find(e => e.s===sl); if (!x) return null;
  return { bust:x.b?(x.b[0]+x.b[1])/2:null, waist:x.w?(x.w[0]+x.w[1])/2:null, hip:x.h?(x.h[0]+x.h[1])/2:null };
}

// ── Styles ──
const T = {
  bg:"#FDFBF7", card:"#FFFFFF", border:"#F0EBE3", border2:"#E8E2D8",
  text:"#1A1612", dim:"#8C8278", accent:"#2D2620", pop:"#D4613E",
  green:"#22c55e", blue:"#60a5fa", warm:"#F5F0E8",
  fd:"'Instrument Serif',Georgia,serif",
  fb:"'DM Sans',system-ui,sans-serif",
  fm:"'JetBrains Mono',monospace",
};

// ── Components ──
function Pill({children,active,onClick,style:s}) {
  return <button onClick={onClick} style={{
    padding:"8px 16px",borderRadius:100,fontSize:13,fontWeight:active?600:400,
    background:active?T.accent:T.card,color:active?"#fff":T.dim,
    border:`1px solid ${active?T.accent:T.border2}`,cursor:"pointer",
    fontFamily:T.fb,transition:"all .2s",...s
  }}>{children}</button>;
}

function Fld({label,value,onChange,placeholder,type="number"}) {
  return <div style={{marginBottom:14}}>
    <label style={{display:"block",fontSize:12,fontWeight:500,color:T.dim,marginBottom:5}}>{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{width:"100%",background:T.warm,border:`1px solid ${T.border2}`,borderRadius:12,
        padding:"12px 16px",color:T.text,fontFamily:T.fb,fontSize:15,outline:"none"}} />
  </div>;
}

function Sel({label,value,onChange,options}) {
  return <div style={{marginBottom:14}}>
    <label style={{display:"block",fontSize:12,fontWeight:500,color:T.dim,marginBottom:5}}>{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{width:"100%",background:T.warm,border:`1px solid ${T.border2}`,borderRadius:12,
        padding:"12px 16px",color:T.text,fontFamily:T.fb,fontSize:15,outline:"none",cursor:"pointer"}}>
      {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  </div>;
}

// ══════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("home");
  const [results, setResults] = useState(null);
  const [gender, setGender] = useState("female");
  const [vibe, setVibe] = useState("");

  // Form state
  const [mode, setMode] = useState("known");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [waistM, setWaistM] = useState("");
  const [kTB, setKTB] = useState("");
  const [kTS, setKTS] = useState("");
  const [kBB, setKBB] = useState("");
  const [kBS, setKBS] = useState("");

  useEffect(() => { window.scrollTo(0,0); }, [page]);

  const fitId = results ? `WMS-${String(Math.abs(JSON.stringify(results.m).split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)%99999)).padStart(5,'0')}` : null;

  function run() {
    let m = {bust:null,waist:null,hip:null};
    if (mode==="measure") {
      const h=parseFloat(height), w=parseFloat(weight), wa=parseFloat(waistM);
      if (h&&w) m.bust = estBust(h,w,gender);
      if (wa) { m.waist=wa; m.hip=estHip(wa,gender); }
    } else {
      if (kTB&&kTS) { const tm=getM(kTB,"tops",kTS,gender); if(tm){m.bust=tm.bust;if(tm.waist)m.waist=tm.waist;} }
      if (kBB&&kBS) { const bm=getM(kBB,"bottoms",kBS,gender); if(bm){if(bm.waist)m.waist=bm.waist;if(bm.hip)m.hip=bm.hip;} }
    }
    if (!m.bust&&!m.waist&&!m.hip) return;
    const preds = BL.map(brand => {
      const tArr = gender==="male"?brand.mT:brand.wT;
      const bArr = gender==="male"?brand.mB:brand.wB;
      return {brand, top:pred(tArr,m), bot:pred(bArr,m)};
    }).filter(p => p.top.s!=="N/A"||p.bot.s!=="N/A");
    setResults({m, preds});
    setPage("results");
  }

  // ── HOME ──
  if (page === "home") return <div style={{background:T.bg,minHeight:"100vh",fontFamily:T.fb,color:T.text}}>
    <div style={{maxWidth:480,margin:"0 auto",padding:"60px 20px 40px"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{fontSize:13,color:T.dim,marginBottom:12,letterSpacing:".04em"}}>✦ {BL.length} brands · men's & women's</div>
        <h1 style={{fontFamily:T.fd,fontSize:36,lineHeight:1.1,marginBottom:10}}>Know your size,<br /><em style={{color:T.pop}}>everywhere.</em></h1>
        <p style={{fontSize:15,color:T.dim,lineHeight:1.5}}>Tell us what fits — we'll predict your size across every major brand.</p>
      </div>

      {/* Gender */}
      <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:20}}>
        {["female","male"].map(g =>
          <Pill key={g} active={gender===g} onClick={() => {setGender(g);setKTB("");setKBB("");setKTS("");setKBS("")}}>
            {g==="female"?"Women's":"Men's"}
          </Pill>
        )}
      </div>

      {/* Mode toggle */}
      <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:24}}>
        {[{k:"known",l:"I know my size"},{k:"measure",l:"Use my measurements"}].map(m =>
          <Pill key={m.k} active={mode===m.k} onClick={() => setMode(m.k)} style={{fontSize:12,padding:"6px 14px"}}>{m.l}</Pill>
        )}
      </div>

      <div style={{background:T.card,borderRadius:20,padding:24,boxShadow:"0 2px 20px rgba(0,0,0,.04)",border:`1px solid ${T.border}`}}>
        {mode==="known" ? <KnownForm gender={gender} kTB={kTB} setKTB={setKTB} kTS={kTS} setKTS={setKTS} kBB={kBB} setKBB={setKBB} kBS={kBS} setKBS={setKBS} /> :
          <MeasureForm height={height} setHeight={setHeight} weight={weight} setWeight={setWeight} waistM={waistM} setWaistM={setWaistM} />
        }
        <button onClick={run} style={{
          width:"100%",padding:"14px",borderRadius:14,fontSize:16,fontWeight:600,
          background:T.accent,color:"#fff",border:"none",cursor:"pointer",fontFamily:T.fb,marginTop:8
        }}>Find my sizes →</button>
      </div>

      {/* Brand strip */}
      <div style={{marginTop:32,textAlign:"center"}}>
        <p style={{fontSize:12,color:T.dim,marginBottom:12}}>Sizing data from</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center"}}>
          {BL.slice(0,12).map(b =>
            <span key={b.name} style={{fontSize:11,color:T.dim,background:T.warm,padding:"4px 10px",borderRadius:100,border:`1px solid ${T.border}`}}>{b.name}</span>
          )}
          <span style={{fontSize:11,color:T.dim,background:T.warm,padding:"4px 10px",borderRadius:100,border:`1px solid ${T.border}`}}>+{BL.length-12} more</span>
        </div>
      </div>
    </div>
  </div>;

  // ── RESULTS ──
  if (page === "results" && results) return <ResultsPage
    results={results} fitId={fitId} gender={gender} vibe={vibe} setVibe={setVibe}
    onEdit={() => setPage("home")} />;

  return null;
}

// ── Known Size Form ──
function KnownForm({gender,kTB,setKTB,kTS,setKTS,kBB,setKBB,kBS,setKBS}) {
  const brandOptsT = useMemo(() => [{v:"",l:"Pick a brand..."},...BK.filter(k=>{const b=DB[k];return gender==="male"?!!b.mT:!!b.wT}).map(k=>({v:k,l:DB[k].name}))],[gender]);
  const brandOptsB = useMemo(() => [{v:"",l:"Pick a brand..."},...BK.filter(k=>{const b=DB[k];return gender==="male"?!!b.mB:!!b.wB}).map(k=>({v:k,l:DB[k].name}))],[gender]);
  const topSizes = useMemo(() => {if(!kTB)return[];const b=DB[kTB];const a=gender==="male"?b.mT:b.wT;return a?a.map(x=>({v:x.s,l:x.s})):[];},[kTB,gender]);
  const botSizes = useMemo(() => {if(!kBB)return[];const b=DB[kBB];const a=gender==="male"?b.mB:b.wB;return a?a.map(x=>({v:x.s,l:x.s})):[];},[kBB,gender]);

  return <>
    <p style={{fontSize:14,fontWeight:600,color:T.text,marginBottom:6}}>What top fits you well?</p>
    <Sel label="Brand" value={kTB} onChange={v=>{setKTB(v);setKTS("")}} options={brandOptsT} />
    {kTB && <Sel label="Your size" value={kTS} onChange={setKTS} options={[{v:"",l:"Select size..."},...topSizes]} />}
    <p style={{fontSize:14,fontWeight:600,color:T.text,marginBottom:6,marginTop:12}}>What pants/bottoms fit you?</p>
    <Sel label="Brand" value={kBB} onChange={v=>{setKBB(v);setKBS("")}} options={brandOptsB} />
    {kBB && <Sel label="Your size" value={kBS} onChange={setKBS} options={[{v:"",l:"Select size..."},...botSizes]} />}
    <p style={{fontSize:11,color:T.dim,marginTop:10,lineHeight:1.4}}>Fill in at least one. Both = better results.</p>
  </>;
}

// ── Measure Form ──
function MeasureForm({height,setHeight,weight,setWeight,waistM,setWaistM}) {
  return <>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <Fld label="Height (inches)" value={height} onChange={setHeight} placeholder="e.g. 66" />
      <Fld label="Weight (lbs)" value={weight} onChange={setWeight} placeholder="e.g. 145" />
    </div>
    <Fld label="Waist (inches)" value={waistM} onChange={setWaistM} placeholder="e.g. 28" />
    <p style={{fontSize:11,color:T.dim,lineHeight:1.4}}>Height + weight estimates your bust/chest. Waist predicts bottoms.</p>
  </>;
}

// ══════════════════════════════════════
// RESULTS PAGE
// ══════════════════════════════════════
function ResultsPage({results, fitId, gender, vibe, setVibe, onEdit}) {
  const [showAll, setShowAll] = useState(false);
  const [chkBrand, setChkBrand] = useState("");
  const [chkCat, setChkCat] = useState("tops");
  const [chkSize, setChkSize] = useState("");
  const [chkRes, setChkRes] = useState(null);
  const [copied, setCopied] = useState(false);

  // Group by category
  const grouped = useMemo(() => {
    const g = {};
    results.preds.forEach(p => {
      const cat = p.brand.cat || "casual";
      if (!g[cat]) g[cat] = [];
      g[cat].push(p);
    });
    return g;
  }, [results]);

  // Top 5 by confidence
  const top5 = useMemo(() => {
    return [...results.preds].sort((a,b) => Math.max(b.top.c,b.bot.c) - Math.max(a.top.c,a.bot.c)).slice(0,5);
  }, [results]);

  const chkOpts = useMemo(() => {
    if (!chkBrand) return [];
    const b = DB[chkBrand];
    const arr = gender==="male"?(chkCat==="tops"?b.mT:b.mB):(chkCat==="tops"?b.wT:b.wB);
    return arr ? arr.map(x=>({v:x.s,l:x.s})) : [];
  }, [chkBrand,chkCat,gender]);

  const brandOpts = useMemo(() => [{v:"",l:"Pick brand..."},...BK.filter(k=>{const b=DB[k];return gender==="male"?!!(b.mT||b.mB):!!(b.wT||b.wB)}).map(k=>({v:k,l:DB[k].name}))],[gender]);

  return <div style={{background:T.bg,minHeight:"100vh",fontFamily:T.fb,color:T.text}}>
    <div style={{maxWidth:540,margin:"0 auto",padding:"24px 16px 60px"}}>

      {/* Fit ID Card */}
      <div onClick={onEdit} style={{
        background:T.card,borderRadius:16,padding:"18px 20px",marginBottom:20,cursor:"pointer",
        boxShadow:"0 2px 16px rgba(0,0,0,.04)",border:`1px solid ${T.border}`,
        display:"flex",justifyContent:"space-between",alignItems:"center"
      }}>
        <div>
          <div style={{fontSize:11,color:T.dim,marginBottom:2}}>Your Fit ID</div>
          <div style={{fontFamily:T.fm,fontSize:22,fontWeight:700,color:T.accent}}>{fitId}</div>
          {vibe && <span style={{fontSize:11,color:T.pop,fontWeight:500}}>{vibe}</span>}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard?.writeText(`${fitId} — whatsmysize.ai`);
            setCopied(true); setTimeout(()=>setCopied(false),2000);
          }} style={{
            background:copied?T.green+"20":T.warm,border:`1px solid ${copied?T.green:T.border2}`,
            borderRadius:10,padding:"8px 12px",fontSize:11,fontWeight:600,cursor:"pointer",
            color:copied?T.green:T.dim,fontFamily:T.fb
          }}>{copied?"Copied!":"Share"}</button>
          <span style={{fontSize:12,color:T.dim}}>Edit ✎</span>
        </div>
      </div>

      {/* Vibe tags */}
      <div style={{marginBottom:20}}>
        <p style={{fontSize:12,color:T.dim,marginBottom:8}}>Describe your body type <span style={{opacity:.5}}>(optional)</span></p>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {VIBES.map(v =>
            <button key={v} onClick={() => setVibe(vibe===v?"":v)} style={{
              padding:"5px 12px",borderRadius:100,fontSize:12,
              background:vibe===v?T.pop:T.card,color:vibe===v?"#fff":T.dim,
              border:`1px solid ${vibe===v?T.pop:T.border2}`,cursor:"pointer",fontFamily:T.fb
            }}>{v}</button>
          )}
        </div>
      </div>

      {/* Top Matches */}
      <h2 style={{fontFamily:T.fd,fontSize:22,marginBottom:14}}>Your best matches</h2>
      <div style={{display:"grid",gap:10,marginBottom:28}}>
        {top5.map(({brand:b,top,bot}) =>
          <BrandCard key={b.name} b={b} top={top} bot={bot} highlight />
        )}
      </div>

      {/* By Category */}
      {!showAll ? (
        <button onClick={() => setShowAll(true)} style={{
          width:"100%",padding:14,borderRadius:14,fontSize:14,fontWeight:600,
          background:T.card,color:T.accent,border:`1px solid ${T.border2}`,cursor:"pointer",fontFamily:T.fb,marginBottom:28
        }}>See all {results.preds.length} brands by category ↓</button>
      ) : (
        <div style={{marginBottom:28}}>
          {Object.keys(CATS).filter(c => grouped[c]).map(cat =>
            <div key={cat} style={{marginBottom:20}}>
              <h3 style={{fontSize:14,fontWeight:600,color:T.dim,marginBottom:10,textTransform:"uppercase",letterSpacing:".06em"}}>{CATS[cat]}</h3>
              <div style={{display:"grid",gap:8}}>
                {grouped[cat].map(({brand:b,top,bot}) =>
                  <BrandCard key={b.name} b={b} top={top} bot={bot} />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Will This Fit */}
      <div style={{background:T.card,borderRadius:16,padding:20,boxShadow:"0 2px 16px rgba(0,0,0,.04)",border:`1px solid ${T.border}`}}>
        <h3 style={{fontSize:16,fontWeight:600,marginBottom:4}}>Will this fit me?</h3>
        <p style={{fontSize:12,color:T.dim,marginBottom:14}}>Check if a specific size will work for you</p>
        <Sel label="Brand" value={chkBrand} onChange={v=>{setChkBrand(v);setChkSize("");setChkRes(null)}} options={brandOpts} />
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <Sel label="Category" value={chkCat} onChange={v=>{setChkCat(v);setChkSize("");setChkRes(null)}} options={[{v:"tops",l:"Tops"},{v:"bottoms",l:"Bottoms"}]} />
          {chkBrand && <Sel label="Size" value={chkSize} onChange={v=>{setChkSize(v);setChkRes(null)}} options={[{v:"",l:"Select..."},...chkOpts]} />}
        </div>
        {chkBrand && chkSize && <button onClick={() => {
          const b=DB[chkBrand];
          const arr=gender==="male"?(chkCat==="tops"?b.mT:b.mB):(chkCat==="tops"?b.wT:b.wB);
          const r=willFit(arr,chkSize,results.m);
          setChkRes(r);
        }} style={{
          width:"100%",padding:12,borderRadius:12,fontSize:14,fontWeight:600,
          background:T.accent,color:"#fff",border:"none",cursor:"pointer",fontFamily:T.fb,marginTop:4
        }}>Check fit</button>}
        {chkRes && <div style={{
          marginTop:12,padding:14,borderRadius:12,background:chkRes.cl+"12",border:`1px solid ${chkRes.cl}30`
        }}>
          <span style={{fontSize:20,marginRight:8}}>{chkRes.e}</span>
          <span style={{fontWeight:600,color:chkRes.cl}}>{chkRes.v}</span>
        </div>}
      </div>

    </div>
  </div>;
}

// ── Brand Result Card ──
function BrandCard({b, top, bot, highlight}) {
  const fitTag = b.big ? "Runs big" : b.small ? "Runs small" : "True to size";
  const fitColor = b.big ? "#f59e0b" : b.small ? "#60a5fa" : "#22c55e";
  return <div style={{
    background:T.card, borderRadius:14, padding:"16px 18px",
    boxShadow: highlight ? "0 4px 24px rgba(0,0,0,.06)" : "0 1px 8px rgba(0,0,0,.03)",
    border: `1px solid ${highlight ? T.border2 : T.border}`,
  }}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <span style={{fontWeight:600,fontSize:15}}>{b.name}</span>
      <span style={{fontSize:10,fontWeight:600,color:fitColor,background:fitColor+"15",padding:"3px 8px",borderRadius:100}}>{fitTag}</span>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      {top.s !== "N/A" && <SizeChip label="Tops" size={top.s} conf={top.c} />}
      {bot.s !== "N/A" && <SizeChip label="Bottoms" size={bot.s} conf={bot.c} />}
    </div>
  </div>;
}

function SizeChip({label, size, conf}) {
  return <div style={{background:T.warm,borderRadius:10,padding:"10px 12px"}}>
    <div style={{fontSize:10,color:T.dim,marginBottom:2}}>{label}</div>
    <div style={{fontFamily:T.fm,fontSize:18,fontWeight:700,color:T.accent}}>{size}</div>
    <div style={{fontSize:10,color:conf>=85?T.green:conf>=70?"#f59e0b":"#ef4444",marginTop:2}}>{conf}% match</div>
  </div>;
}
