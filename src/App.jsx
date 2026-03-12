import { useState, useEffect, useMemo } from "react";

/* ══════════════════════════════════════════════════════
   WHATSMYSIZE — Know your size, everywhere.
   Warm, clean, mobile-first. Women-forward design.
   ══════════════════════════════════════════════════════ */

// ── Estimation ──
function estBust(h,w,g){const hc=h*2.54,wk=w*0.4536;let c=41.49+0.087*hc+0.667*wk-0.001087*hc*wk;if(g==="male")c+=0.017*wk;return Math.round(c/2.54*10)/10}
function estHip(w,g){return g==="female"?w+8.5:w+5}

// ── Body type labels (optional, user-chosen) ──
const VIBES = ["Petite","Athletic","Curvy","Slim","Busty","Plus","Tall","Average"];

// ── Categories ──
const CATS={athletic:"Athletic & Active",premium:"Premium & Designer",casual:"Everyday Casual",fast:"Fast Fashion",intimates:"Intimates & Lounge",workwear:"Workwear"};

// ── Brand DB (25 brands) ──
const DB={
nike:{name:"Nike",i:"NK",c:"#FA5722",cat:"athletic",tag:"True to size",big:false,small:false,tts:true,mNote:"Standard US. Dri-FIT slightly fitted.",wNote:"TTS. Go up for relaxed fit.",
  mTops:[{s:"S",bust:[35,37.5],waist:[29,32]},{s:"M",bust:[37.5,41],waist:[32,35]},{s:"L",bust:[41,44],waist:[35,38]},{s:"XL",bust:[44,48.5],waist:[38,43]}],
  mBot:[{s:"S (28-30)",waist:[29,32],hip:[35,37.5]},{s:"M (32-34)",waist:[32,35],hip:[37.5,41]},{s:"L (34-36)",waist:[35,38],hip:[41,44]},{s:"XL (38-40)",waist:[38,43],hip:[44,47]}],
  wTops:[{s:"XS (0-2)",bust:[29.5,32.5],waist:[23.5,26]},{s:"S (4-6)",bust:[32.5,35.5],waist:[26,29]},{s:"M (8-10)",bust:[35.5,38],waist:[29,31.5]},{s:"L (12-14)",bust:[38,41],waist:[31.5,34.5]},{s:"XL (16-18)",bust:[41,44.5],waist:[34.5,38.5]}],
  wBot:[{s:"XS (0-2)",waist:[23.5,26],hip:[33,35.5]},{s:"S (4-6)",waist:[26,29],hip:[35.5,38.5]},{s:"M (8-10)",waist:[29,31.5],hip:[38.5,41]},{s:"L (12-14)",waist:[31.5,34.5],hip:[41,44]},{s:"XL (16-18)",waist:[34.5,38.5],hip:[44,47]}]},
lululemon:{name:"Lululemon",i:"LL",c:"#B71C1C",cat:"athletic",tag:"Runs slightly small",big:false,small:true,tts:false,mNote:"Tailored athletic fit.",wNote:"Built-in bra tops run small. Leggings TTS.",
  mTops:[{s:"S",bust:[37,38],waist:[29,30]},{s:"M",bust:[39,40],waist:[31,32]},{s:"L",bust:[42,43],waist:[34,35]},{s:"XL",bust:[45,46],waist:[37,38]}],
  mBot:[{s:"S (30)",waist:[29,30],hip:[35,36]},{s:"M (32)",waist:[31,32],hip:[37,38]},{s:"L (34)",waist:[34,35],hip:[40,41]},{s:"XL (36)",waist:[37,38],hip:[43,44]}],
  wTops:[{s:"2 (XXS)",bust:[30,31],waist:[23,24]},{s:"4 (XS)",bust:[32,33],waist:[25,26]},{s:"6 (S)",bust:[34,35],waist:[27,28]},{s:"8 (M)",bust:[36,37],waist:[29,30]},{s:"10 (L)",bust:[38,39],waist:[31,32]},{s:"12 (XL)",bust:[40,41],waist:[33,34]}],
  wBot:[{s:"2 (XXS)",waist:[23,24],hip:[33,34]},{s:"4 (XS)",waist:[25,26],hip:[35,36]},{s:"6 (S)",waist:[27,28],hip:[37,38]},{s:"8 (M)",waist:[29,30],hip:[39,40]},{s:"10 (L)",waist:[31,32],hip:[41,42]},{s:"12 (XL)",waist:[33,34],hip:[43,44]}]},
underarmour:{name:"Under Armour",i:"UA",c:"#003B5C",cat:"athletic",tag:"Compression runs tight",big:false,small:true,tts:false,mNote:"Compression 1-2 sizes small.",wNote:"Size up in compression styles.",
  mTops:[{s:"S",bust:[34,36],waist:[28.5,30]},{s:"M",bust:[38,40],waist:[31.5,33.5]},{s:"L",bust:[42,44],waist:[35,37]},{s:"XL",bust:[46,48],waist:[39,41]}],
  mBot:[{s:"S (30)",waist:[28.5,30],hip:[34,36]},{s:"M (32)",waist:[31.5,33.5],hip:[37,39]},{s:"L (34-36)",waist:[35,37],hip:[40,43]},{s:"XL (38-40)",waist:[39,41],hip:[44,47]}],
  wTops:[{s:"XS (0-2)",bust:[30,32.5],waist:[23,25.5]},{s:"S (4-6)",bust:[32.5,35.5],waist:[25.5,28.5]},{s:"M (8-10)",bust:[35.5,37.5],waist:[28.5,30.5]},{s:"L (12-14)",bust:[39,40.5],waist:[32,33.5]},{s:"XL (16)",bust:[42,43.5],waist:[35,36.5]}],
  wBot:[{s:"XS (0-2)",waist:[23,25.5],hip:[33,35.5]},{s:"S (4-6)",waist:[25.5,28.5],hip:[35.5,38.5]},{s:"M (8-10)",waist:[28.5,30.5],hip:[38.5,41]},{s:"L (12-14)",waist:[32,33.5],hip:[41.5,44]},{s:"XL (16)",waist:[35,36.5],hip:[44,46.5]}]},
adidas:{name:"Adidas",i:"AD",c:"#000000",cat:"athletic",tag:"True to size",big:false,small:false,tts:true,mNote:"European, slightly narrow shoulders.",wNote:"TTS. Originals slightly narrow.",
  mTops:[{s:"S",bust:[34.5,36],waist:[29.5,31.5]},{s:"M",bust:[36.5,39],waist:[32,34.5]},{s:"L",bust:[39.5,42.5],waist:[35,38]},{s:"XL",bust:[43,46.5],waist:[38.5,42]}],
  mBot:[{s:"S (28-30)",waist:[30,32],hip:[35,37]},{s:"M (32-34)",waist:[32,35],hip:[37,40]},{s:"L (34-36)",waist:[35,39],hip:[40,44]},{s:"XL (38-40)",waist:[39,43],hip:[44,48]}],
  wTops:[{s:"XS (0-2)",bust:[30.5,32.5],waist:[23.5,25.5]},{s:"S (4-6)",bust:[32.5,35],waist:[25.5,28]},{s:"M (8-10)",bust:[35,38],waist:[28,31]},{s:"L (12-14)",bust:[38,41],waist:[31,34]},{s:"XL (16-18)",bust:[41,44.5],waist:[34,37.5]}],
  wBot:[{s:"XS (0-2)",waist:[23.5,25.5],hip:[33.5,35.5]},{s:"S (4-6)",waist:[25.5,28],hip:[35.5,38]},{s:"M (8-10)",waist:[28,31],hip:[38,41]},{s:"L (12-14)",waist:[31,34],hip:[41,44]},{s:"XL (16-18)",waist:[34,37.5],hip:[44,47.5]}]},
champion:{name:"Champion",i:"CM",c:"#0033A0",cat:"athletic",tag:"True to size",big:false,small:false,tts:true,mNote:"Similar to Nike.",wNote:"TTS across all lines.",
  mTops:[{s:"S",bust:[34,36],waist:[28,30]},{s:"M",bust:[38,40],waist:[32,34]},{s:"L",bust:[42,44],waist:[36,38]},{s:"XL",bust:[46,48],waist:[40,42]}],
  mBot:[{s:"S (28-30)",waist:[28,30],hip:[37,38]},{s:"M (32-34)",waist:[32,34],hip:[39,41]},{s:"L (36-38)",waist:[36,38],hip:[42,43]},{s:"XL (40-42)",waist:[40,42],hip:[44,46]}],
  wTops:[{s:"XS",bust:[31,33],waist:[24,26]},{s:"S",bust:[33,35.5],waist:[26,28.5]},{s:"M",bust:[35.5,38],waist:[28.5,31]},{s:"L",bust:[38,41],waist:[31,34]},{s:"XL",bust:[41,44],waist:[34,37]}],
  wBot:[{s:"XS",waist:[24,26],hip:[34,36]},{s:"S",waist:[26,28.5],hip:[36,38.5]},{s:"M",waist:[28.5,31],hip:[38.5,41]},{s:"L",waist:[31,34],hip:[41,44]},{s:"XL",waist:[34,37],hip:[44,47]}]},
athleta:{name:"Athleta",i:"AT",c:"#5B2C6F",cat:"athletic",tag:"True to size",big:false,small:false,tts:true,mNote:null,wNote:"Gap-owned. TTS yoga/athletic fit.",
  mTops:null,mBot:null,
  wTops:[{s:"XXS (0)",bust:[32,33],waist:[24.5,25.5]},{s:"XS (2-4)",bust:[33.5,35],waist:[26,27.5]},{s:"S (6-8)",bust:[35.5,37.5],waist:[28,30]},{s:"M (10-12)",bust:[38,40.5],waist:[30.5,33]},{s:"L (14-16)",bust:[41,43.5],waist:[33.5,36]},{s:"XL (18-20)",bust:[44,47],waist:[36.5,39.5]}],
  wBot:[{s:"0 (XXS)",waist:[24.5,25.5],hip:[34.5,35.5]},{s:"2-4 (XS)",waist:[26,27.5],hip:[36,37.5]},{s:"6-8 (S)",waist:[28,30],hip:[38,40]},{s:"10-12 (M)",waist:[30.5,33],hip:[40.5,43]},{s:"14-16 (L)",waist:[33.5,36],hip:[43.5,46]},{s:"18-20 (XL)",waist:[36.5,39.5],hip:[46.5,49.5]}]},
ralphlauren:{name:"Ralph Lauren",i:"RL",c:"#1C3F6E",cat:"premium",tag:"True to size",big:false,small:false,tts:true,mNote:"Classic Fit generous. Slim narrower.",wNote:"Polo TTS. Lauren roomier.",
  mTops:[{s:"S",bust:[34,36],waist:[28,30]},{s:"M",bust:[38,40],waist:[31,34]},{s:"L",bust:[42,44],waist:[35,38]},{s:"XL",bust:[46,48],waist:[40,42]}],
  mBot:[{s:"30",waist:[30,31],hip:[36,37]},{s:"32",waist:[32,33],hip:[38,39]},{s:"34",waist:[34,35],hip:[40,41]},{s:"36",waist:[36,37],hip:[42,43]}],
  wTops:[{s:"XS (2)",bust:[32,34],waist:[25,27]},{s:"S (4-6)",bust:[34,36.5],waist:[27,29.5]},{s:"M (8-10)",bust:[36.5,39],waist:[29.5,32]},{s:"L (12-14)",bust:[39,42],waist:[32,35]},{s:"XL (16)",bust:[42,45],waist:[35,38]}],
  wBot:[{s:"2 (XS)",waist:[25,27],hip:[35,37]},{s:"4-6 (S)",waist:[27,29.5],hip:[37,39.5]},{s:"8-10 (M)",waist:[29.5,32],hip:[39.5,42]},{s:"12-14 (L)",waist:[32,35],hip:[42,45]},{s:"16 (XL)",waist:[35,38],hip:[45,48]}]},
anthropologie:{name:"Anthropologie",i:"AN",c:"#5C4033",cat:"premium",tag:"True to size, relaxed",big:false,small:false,tts:true,mNote:null,wNote:"TTS bohemian fit. Petite + Plus available.",
  mTops:null,mBot:null,
  wTops:[{s:"XXS (00)",bust:[32,33],waist:[24,25]},{s:"XS (0-2)",bust:[33,34],waist:[25,26]},{s:"S (4-6)",bust:[35,36],waist:[27,28]},{s:"M (8-10)",bust:[37,38],waist:[29,30]},{s:"L (12-14)",bust:[39.5,41],waist:[31.5,33]},{s:"XL (16)",bust:[42.5,43],waist:[34.5,35]}],
  wBot:[{s:"00 (XXS)",waist:[24,25],hip:[34,35]},{s:"0-2 (XS)",waist:[25,26],hip:[35,36]},{s:"4-6 (S)",waist:[27,28],hip:[37,38]},{s:"8-10 (M)",waist:[29,30],hip:[39,40]},{s:"12-14 (L)",waist:[31.5,33],hip:[41.5,43]},{s:"16 (XL)",waist:[34.5,35],hip:[44.5,45]}]},
freepeople:{name:"Free People",i:"FP",c:"#8B6F47",cat:"premium",tag:"Runs big — oversized style",big:true,small:false,tts:false,mNote:null,wNote:"Bohemian oversized. Size down for fitted. Denim TTS.",
  mTops:null,mBot:null,
  wTops:[{s:"XS (0-2)",bust:[33,34.5],waist:[25,26.5]},{s:"S (4-6)",bust:[35,36.5],waist:[27,28.5]},{s:"M (8-10)",bust:[37,39],waist:[29,31]},{s:"L (12-14)",bust:[39.5,42],waist:[31.5,34]},{s:"XL (16)",bust:[42.5,45],waist:[34.5,37]}],
  wBot:[{s:"24 (00)",waist:[24,25],hip:[34,35]},{s:"25 (0)",waist:[25,26],hip:[35,36]},{s:"26 (2)",waist:[26,27],hip:[36,37]},{s:"27 (4)",waist:[27,28],hip:[37,38]},{s:"28 (6)",waist:[28,29],hip:[38,39]},{s:"29 (8)",waist:[29,30],hip:[39,40]},{s:"30 (10)",waist:[30,31],hip:[40,41]},{s:"31 (12)",waist:[31,32],hip:[41,42.5]}]},
madewell:{name:"Madewell",i:"MW",c:"#2F4F4F",cat:"premium",tag:"True to size, great denim",big:false,small:false,tts:true,mNote:"Small men's line.",wNote:"Excellent denim. TTS. Curvy jeans more hip.",
  mTops:[{s:"S",bust:[36,38],waist:[30,32]},{s:"M",bust:[38,41],waist:[32,35]},{s:"L",bust:[41,44],waist:[35,38]}],
  mBot:[{s:"28",waist:[28,29],hip:[34,35]},{s:"30",waist:[30,31],hip:[36,37]},{s:"32",waist:[32,33],hip:[38,39]},{s:"34",waist:[34,35],hip:[40,41]}],
  wTops:[{s:"XXS (00)",bust:[31,32.5],waist:[23,24.5]},{s:"XS (0-2)",bust:[33,34],waist:[25,26]},{s:"S (4-6)",bust:[35,36.5],waist:[27,28.5]},{s:"M (8-10)",bust:[37,39],waist:[29,31]},{s:"L (12-14)",bust:[39.5,42],waist:[31.5,34]},{s:"XL (16-18)",bust:[42.5,45.5],waist:[34.5,37.5]}],
  wBot:[{s:"23 (00)",waist:[23,24],hip:[33,34]},{s:"24 (0)",waist:[24,25],hip:[34,35]},{s:"25 (2)",waist:[25,26],hip:[35,36]},{s:"26 (4)",waist:[26,27],hip:[36,37]},{s:"27 (6)",waist:[27,28],hip:[37,38]},{s:"28 (8)",waist:[28,29],hip:[38,39]},{s:"29 (10)",waist:[29,30],hip:[39,40.5]},{s:"30 (12)",waist:[30,31],hip:[40.5,42]},{s:"31 (14)",waist:[31,32.5],hip:[42,43.5]}]},
aritzia:{name:"Aritzia",i:"AR",c:"#1a1a1a",cat:"premium",tag:"Runs slightly small",big:false,small:true,tts:false,mNote:null,wNote:"Canadian. Runs small. TNA more relaxed.",
  mTops:null,mBot:null,
  wTops:[{s:"XXS (0)",bust:[31,32.5],waist:[23.5,25]},{s:"XS (2)",bust:[32.5,34],waist:[25,26.5]},{s:"S (4-6)",bust:[34,36.5],waist:[26.5,29]},{s:"M (8-10)",bust:[36.5,39],waist:[29,31.5]},{s:"L (12-14)",bust:[39,42],waist:[31.5,34.5]},{s:"XL (16)",bust:[42,45],waist:[34.5,37.5]}],
  wBot:[{s:"0 (XXS)",waist:[23.5,25],hip:[33.5,35]},{s:"2 (XS)",waist:[25,26.5],hip:[35,36.5]},{s:"4-6 (S)",waist:[26.5,29],hip:[36.5,39]},{s:"8-10 (M)",waist:[29,31.5],hip:[39,41.5]},{s:"12-14 (L)",waist:[31.5,34.5],hip:[41.5,44.5]},{s:"16 (XL)",waist:[34.5,37.5],hip:[44.5,47.5]}]},
gap:{name:"Gap",i:"GP",c:"#003A70",cat:"casual",tag:"True to size",big:false,small:false,tts:true,mNote:"Consistent US sizing.",wNote:"TTS. Tall and Petite available.",
  mTops:[{s:"S",bust:[35,37.5],waist:[29,31.5]},{s:"M",bust:[38,40.5],waist:[32,34.5]},{s:"L",bust:[42,44],waist:[37,39]},{s:"XL",bust:[45,48],waist:[40,43]}],
  mBot:[{s:"30 (S)",waist:[30,31],hip:[36,37]},{s:"32 (M)",waist:[32,33],hip:[38,39]},{s:"34 (M/L)",waist:[34,35.5],hip:[40,41]},{s:"36 (L)",waist:[36,37.5],hip:[42,43]}],
  wTops:[{s:"XS (0-2)",bust:[32,34],waist:[24.5,26.5]},{s:"S (4-6)",bust:[34,36.5],waist:[26.5,29]},{s:"M (8-10)",bust:[36.5,39],waist:[29,31.5]},{s:"L (12-14)",bust:[39,42],waist:[31.5,34.5]},{s:"XL (16-18)",bust:[42,45.5],waist:[34.5,38]}],
  wBot:[{s:"0-2 (XS)",waist:[24.5,26.5],hip:[34.5,36.5]},{s:"4-6 (S)",waist:[26.5,29],hip:[36.5,39]},{s:"8-10 (M)",waist:[29,31.5],hip:[39,41.5]},{s:"12-14 (L)",waist:[31.5,34.5],hip:[41.5,44.5]},{s:"16-18 (XL)",waist:[34.5,38],hip:[44.5,48]}]},
americaneagle:{name:"American Eagle",i:"AE",c:"#004B8D",cat:"casual",tag:"True to size",big:false,small:false,tts:true,mNote:"Consistent. Flex jeans have stretch.",wNote:"TTS with slight vanity sizing. Curvy collection more hip room.",
  mTops:[{s:"S",bust:[34,37],waist:[28,31]},{s:"M",bust:[37,40],waist:[31,34]},{s:"L",bust:[40,43],waist:[34,37]},{s:"XL",bust:[43,46],waist:[37,40]}],
  mBot:[{s:"28",waist:[28,29],hip:[34,35]},{s:"30",waist:[30,31],hip:[36,37]},{s:"32",waist:[32,33],hip:[38,39]},{s:"34",waist:[34,35],hip:[40,41]},{s:"36",waist:[36,37],hip:[42,43]}],
  wTops:[{s:"XS (0)",bust:[32,34],waist:[24.5,26]},{s:"S (4)",bust:[34,36],waist:[26.5,28]},{s:"M (8)",bust:[36,38.5],waist:[28.5,30.5]},{s:"L (12)",bust:[39,41.5],waist:[31.5,33.5]},{s:"XL (16)",bust:[42,44.5],waist:[34.5,36.5]}],
  wBot:[{s:"00 (23)",waist:[23.5,24],hip:[33,34]},{s:"0 (24)",waist:[24.5,25.5],hip:[34,35]},{s:"2 (25)",waist:[25.5,26.5],hip:[35,36]},{s:"4 (26)",waist:[26.5,27.5],hip:[36,37]},{s:"6 (27)",waist:[27.5,28.5],hip:[37,38]},{s:"8 (28)",waist:[28.5,29.5],hip:[38,39.5]},{s:"10 (30)",waist:[30,31],hip:[39.5,41]},{s:"12 (31)",waist:[31.5,32.5],hip:[41,42.5]},{s:"14 (33)",waist:[33,34],hip:[42.5,44]}]},
abercrombie:{name:"Abercrombie",i:"AF",c:"#1B3A2D",cat:"casual",tag:"Runs slightly small",big:false,small:true,tts:false,mNote:"Designed slim. Size up for relaxed.",wNote:"Runs small. Curve Love has more hip room.",
  mTops:[{s:"S",bust:[35,37.5],waist:[29,31.5]},{s:"M",bust:[37.5,40],waist:[31.5,34]},{s:"L",bust:[40,43],waist:[34,37]},{s:"XL",bust:[43,46],waist:[37,40]}],
  mBot:[{s:"28",waist:[28,29],hip:[34,35]},{s:"30",waist:[30,31],hip:[36,37]},{s:"32",waist:[32,33],hip:[38,39]},{s:"34",waist:[34,35],hip:[40,41]},{s:"36",waist:[36,37],hip:[42,43]}],
  wTops:[{s:"XXS (00)",bust:[31,32.5],waist:[23,24.5]},{s:"XS (0-2)",bust:[32.5,34.5],waist:[24.5,26.5]},{s:"S (4-6)",bust:[34.5,37],waist:[26.5,29]},{s:"M (8-10)",bust:[37,39.5],waist:[29,31.5]},{s:"L (12-14)",bust:[39.5,42],waist:[31.5,34]},{s:"XL (16)",bust:[42,44.5],waist:[34,37]}],
  wBot:[{s:"23 (000)",waist:[23,24],hip:[33,34]},{s:"24 (00)",waist:[24,25],hip:[34,35]},{s:"25 (0)",waist:[25,26],hip:[35,36]},{s:"26 (2)",waist:[26,27],hip:[36,37]},{s:"27 (4)",waist:[27,28],hip:[37,38]},{s:"28 (6)",waist:[28,29],hip:[38,39]},{s:"29 (8)",waist:[29,30],hip:[39,40]},{s:"30 (10)",waist:[30,31],hip:[40,41]},{s:"31 (12)",waist:[31,32],hip:[41,42]}]},
levis:{name:"Levi's",i:"LV",c:"#D32F2F",cat:"casual",tag:"True to size — fits vary by number",big:false,small:false,tts:true,mNote:"501=straight, 511=slim, 541=athletic.",wNote:"Numeric waist sizing. 721=high rise skinny, 501=original.",
  mTops:[{s:"S",bust:[35,37.5],waist:[29,31.5]},{s:"M",bust:[37.5,41],waist:[31.5,35]},{s:"L",bust:[41,44],waist:[35,38]},{s:"XL",bust:[44,48],waist:[38,42]}],
  mBot:[{s:"28",waist:[28,29],hip:[34,35]},{s:"30",waist:[30,31],hip:[36,37]},{s:"32",waist:[32,33],hip:[38,39]},{s:"34",waist:[34,35],hip:[40,41]},{s:"36",waist:[36,37],hip:[42,43]},{s:"38",waist:[38,39],hip:[44,45]}],
  wTops:[{s:"XS",bust:[32,34],waist:[24,26]},{s:"S",bust:[34,36],waist:[26,28]},{s:"M",bust:[36,38.5],waist:[28,31]},{s:"L",bust:[38.5,41],waist:[31,34]},{s:"XL",bust:[41,44],waist:[34,37]}],
  wBot:[{s:"24",waist:[24,25],hip:[34,35]},{s:"25",waist:[25,26],hip:[35,36]},{s:"26",waist:[26,27],hip:[36,37]},{s:"27",waist:[27,28],hip:[37,38]},{s:"28",waist:[28,29],hip:[38,39]},{s:"29",waist:[29,30],hip:[39,40]},{s:"30",waist:[30,31],hip:[40,41]},{s:"31",waist:[31,32],hip:[41,42]},{s:"32",waist:[32,33],hip:[42,43]}]},
oldnavy:{name:"Old Navy",i:"ON",c:"#003B64",cat:"casual",tag:"Runs slightly big",big:true,small:false,tts:false,mNote:"Generous vanity sizing.",wNote:"Size down from other brands. Good size range.",
  mTops:[{s:"S",bust:[35,38],waist:[29,32]},{s:"M",bust:[38,41],waist:[32,35]},{s:"L",bust:[41,44],waist:[35,38]},{s:"XL",bust:[44,48],waist:[38,43]}],
  mBot:[{s:"30 (S)",waist:[29,31],hip:[36,38]},{s:"32-34 (M)",waist:[32,35],hip:[38,41]},{s:"36-38 (L)",waist:[36,38],hip:[42,44]}],
  wTops:[{s:"XS (0-2)",bust:[33,35],waist:[25,27]},{s:"S (4-6)",bust:[35,37.5],waist:[27,29.5]},{s:"M (8-10)",bust:[37.5,40],waist:[29.5,32]},{s:"L (12-14)",bust:[40,43],waist:[32,35]},{s:"XL (16-18)",bust:[43,46.5],waist:[35,38.5]}],
  wBot:[{s:"0-2 (XS)",waist:[25,27],hip:[35,37]},{s:"4-6 (S)",waist:[27,29.5],hip:[37,39.5]},{s:"8-10 (M)",waist:[29.5,32],hip:[39.5,42]},{s:"12-14 (L)",waist:[32,35],hip:[42,45]},{s:"16-18 (XL)",waist:[35,38.5],hip:[45,48.5]}]},
carhartt:{name:"Carhartt",i:"CT",c:"#C4922A",cat:"workwear",tag:"Runs big — size down",big:true,small:false,tts:false,mNote:"Cut for layering. Size down for modern fit.",wNote:"Women's more fitted but still roomy vs fashion brands.",
  mTops:[{s:"S",bust:[34,36],waist:[28,30]},{s:"M",bust:[38,40],waist:[32,34]},{s:"L",bust:[42,44],waist:[36,38]},{s:"XL",bust:[46,48],waist:[40,42]},{s:"2XL",bust:[50,52],waist:[44,46]}],
  mBot:[{s:"30",waist:[28,30],hip:[34,36]},{s:"32-34",waist:[32,34],hip:[38,40]},{s:"36-38",waist:[36,38],hip:[42,44]},{s:"40-42",waist:[40,42],hip:[46,48]}],
  wTops:[{s:"XS (0-2)",bust:[33,35],waist:[25,27]},{s:"S (4-6)",bust:[35,37],waist:[27,29]},{s:"M (8-10)",bust:[37,40],waist:[29,32]},{s:"L (12-14)",bust:[40,43],waist:[32,35]},{s:"XL (16-18)",bust:[43,46],waist:[35,38]}],
  wBot:[{s:"S (4-6)",waist:[27,29],hip:[36,38]},{s:"M (8-10)",waist:[29,32],hip:[38,41]},{s:"L (12-14)",waist:[32,35],hip:[41,44]},{s:"XL (16-18)",waist:[35,38],hip:[44,47]}]},
hm:{name:"H&M",i:"HM",c:"#E50010",cat:"fast",tag:"Tops run slightly big",big:true,small:false,tts:false,mNote:"European cut, longer torso, narrower shoulders.",wNote:"Can be inconsistent. Check specific product.",
  mTops:[{s:"S",bust:[34.5,36.25],waist:[30,31.5]},{s:"M",bust:[37.75,39.5],waist:[33,34.5]},{s:"L",bust:[41,42.5],waist:[36.25,37.75]},{s:"XL",bust:[44,45.5],waist:[39.5,41]}],
  mBot:[{s:"S (30-32)",waist:[30,31.5],hip:[36.5,37.75]},{s:"M (33-34)",waist:[33,34.5],hip:[39,40]},{s:"L (36-38)",waist:[36.25,37.75],hip:[41.25,42.5]},{s:"XL (40-42)",waist:[39.5,41],hip:[43.75,44.75]}],
  wTops:[{s:"XS (2)",bust:[31,32.5],waist:[24,25.5]},{s:"S (4-6)",bust:[33,35.5],waist:[26,28.5]},{s:"M (8-10)",bust:[36,38.5],waist:[29,31.5]},{s:"L (12-14)",bust:[39,41.5],waist:[32,34.5]},{s:"XL (16-18)",bust:[42,44.5],waist:[35,37.5]}],
  wBot:[{s:"XS (2)",waist:[24,25.5],hip:[34,35.5]},{s:"S (4-6)",waist:[26,28.5],hip:[36,38.5]},{s:"M (8-10)",waist:[29,31.5],hip:[39,41.5]},{s:"L (12-14)",waist:[32,34.5],hip:[42,44.5]},{s:"XL (16-18)",waist:[35,37.5],hip:[45,47.5]}]},
zara:{name:"Zara",i:"ZR",c:"#000000",cat:"fast",tag:"Runs small — European slim",big:false,small:true,tts:false,mNote:"Zara M ≈ US S. Varies across styles.",wNote:"Runs small. Size up. Very inconsistent.",
  mTops:[{s:"S",bust:[34,36],waist:[28,30]},{s:"M",bust:[38,40],waist:[32,34]},{s:"L",bust:[41,43],waist:[34,36]},{s:"XL",bust:[44,46],waist:[38,40]}],
  mBot:[{s:"30 (S)",waist:[29,31],hip:[37,38]},{s:"32 (M)",waist:[31,33],hip:[39,40]},{s:"34 (L)",waist:[34,35],hip:[41,42]},{s:"36 (XL)",waist:[36,38],hip:[43,44]}],
  wTops:[{s:"XS",bust:[31,33],waist:[24,26]},{s:"S",bust:[33,35],waist:[26,28]},{s:"M",bust:[35,37.5],waist:[28,30.5]},{s:"L",bust:[37.5,40],waist:[30.5,33]},{s:"XL",bust:[40,43],waist:[33,36]}],
  wBot:[{s:"34 (XS)",waist:[24,26],hip:[34,36]},{s:"36 (S)",waist:[26,28],hip:[36,38]},{s:"38 (M)",waist:[28,30.5],hip:[38,40.5]},{s:"40 (L)",waist:[30.5,33],hip:[40.5,43]},{s:"42 (XL)",waist:[33,36],hip:[43,46]}]},
uniqlo:{name:"Uniqlo",i:"UQ",c:"#FF0000",cat:"fast",tag:"Runs slightly small — Japanese sizing",big:false,small:true,tts:false,mNote:"Japanese slimline. Size up for relaxed.",wNote:"Runs small for US. Pants more accurate than tops.",
  mTops:[{s:"S",bust:[35,37.5],waist:[29,31.5]},{s:"M",bust:[37.5,40],waist:[31.5,34]},{s:"L",bust:[40,43],waist:[34,37]},{s:"XL",bust:[43,46],waist:[37,40]}],
  mBot:[{s:"28 (S)",waist:[28,30],hip:[34.5,36]},{s:"30-31 (M)",waist:[30,32],hip:[36,38]},{s:"32-33 (L)",waist:[32,34],hip:[38,40.5]},{s:"34-36 (XL)",waist:[34,37],hip:[40.5,43]}],
  wTops:[{s:"XS",bust:[30.5,32.5],waist:[23,25]},{s:"S",bust:[32.5,35],waist:[25,27.5]},{s:"M",bust:[35,37.5],waist:[27.5,30]},{s:"L",bust:[37.5,40],waist:[30,32.5]},{s:"XL",bust:[40,43],waist:[32.5,35.5]}],
  wBot:[{s:"XS (24-25)",waist:[23,25],hip:[33,35]},{s:"S (26-27)",waist:[25,27.5],hip:[35,37.5]},{s:"M (28-29)",waist:[27.5,30],hip:[37.5,40]},{s:"L (30-31)",waist:[30,32.5],hip:[40,42.5]},{s:"XL (32-33)",waist:[32.5,35.5],hip:[42.5,45.5]}]},
forever21:{name:"Forever 21",i:"F21",c:"#FFC107",cat:"fast",tag:"Runs small + inconsistent",big:false,small:true,tts:false,mNote:"Basics run small. Size up.",wNote:"Very inconsistent. Generally small. Always size up.",
  mTops:[{s:"S",bust:[34,36],waist:[28,30]},{s:"M",bust:[36,39],waist:[30,33]},{s:"L",bust:[39,42],waist:[33,36]},{s:"XL",bust:[42,45],waist:[36,39]}],
  mBot:[{s:"S (30)",waist:[28,30],hip:[35,37]},{s:"M (32)",waist:[30,33],hip:[37,40]},{s:"L (34)",waist:[33,36],hip:[40,43]}],
  wTops:[{s:"XS",bust:[31,33],waist:[23.5,25.5]},{s:"S",bust:[33,35],waist:[25.5,27.5]},{s:"M",bust:[35,37.5],waist:[27.5,30]},{s:"L",bust:[37.5,40],waist:[30,32.5]},{s:"XL",bust:[40,43],waist:[32.5,35.5]}],
  wBot:[{s:"XS (24-25)",waist:[23.5,25.5],hip:[34,36]},{s:"S (26-27)",waist:[25.5,27.5],hip:[36,38]},{s:"M (28-29)",waist:[27.5,30],hip:[38,40.5]},{s:"L (30-31)",waist:[30,32.5],hip:[40.5,43]},{s:"XL (32-33)",waist:[32.5,35.5],hip:[43,46]}]},
shein:{name:"SHEIN",i:"SH",c:"#222",cat:"fast",tag:"Runs very small — always size up",big:false,small:true,tts:false,mNote:"Size up at least one.",wNote:"Notoriously inconsistent. Runs 1-2 sizes small.",
  mTops:[{s:"S",bust:[35,37],waist:[29,31]},{s:"M",bust:[37,39.5],waist:[31,33.5]},{s:"L",bust:[39.5,42],waist:[33.5,36]}],
  mBot:[{s:"S (29-30)",waist:[29,31],hip:[36,38]},{s:"M (31-32)",waist:[31,33.5],hip:[38,40.5]},{s:"L (33-34)",waist:[33.5,36],hip:[40.5,43]}],
  wTops:[{s:"XS (2)",bust:[32,33.5],waist:[24,25.5]},{s:"S (4)",bust:[33.5,35],waist:[25.5,27]},{s:"M (6)",bust:[35,37],waist:[27,29]},{s:"L (8-10)",bust:[37,39.5],waist:[29,31.5]},{s:"XL (12)",bust:[39.5,42],waist:[31.5,34]}],
  wBot:[{s:"XS (2)",waist:[24,25.5],hip:[34,35.5]},{s:"S (4)",waist:[25.5,27],hip:[35.5,37]},{s:"M (6)",waist:[27,29],hip:[37,39]},{s:"L (8-10)",waist:[29,31.5],hip:[39,41.5]},{s:"XL (12)",waist:[31.5,34],hip:[41.5,44]}]},
fashionnova:{name:"Fashion Nova",i:"FN",c:"#FF1493",cat:"fast",tag:"Runs very small, body-con",big:false,small:true,tts:false,mNote:"Men's TTS.",wNote:"Extremely body-con. Runs 1-2 sizes small.",
  mTops:[{s:"S",bust:[34,36],waist:[28,30]},{s:"M",bust:[36,39],waist:[30,33]},{s:"L",bust:[39,42],waist:[33,36]}],
  mBot:[{s:"30 (S)",waist:[28,30],hip:[35,37]},{s:"32 (M)",waist:[30,33],hip:[37,40]},{s:"34 (L)",waist:[33,36],hip:[40,43]}],
  wTops:[{s:"XS (1)",bust:[31,33],waist:[23,25]},{s:"S (3-5)",bust:[33,35],waist:[25,27]},{s:"M (7-9)",bust:[35,37.5],waist:[27,29.5]},{s:"L (11-13)",bust:[37.5,40],waist:[29.5,32]},{s:"XL (15)",bust:[40,42.5],waist:[32,34.5]},{s:"2XL (17-19)",bust:[42.5,46],waist:[34.5,38]}],
  wBot:[{s:"1 (XS)",waist:[23,25],hip:[33,35]},{s:"3-5 (S)",waist:[25,27],hip:[35,37]},{s:"7-9 (M)",waist:[27,29.5],hip:[37,39.5]},{s:"11-13 (L)",waist:[29.5,32],hip:[39.5,42]},{s:"15 (XL)",waist:[32,34.5],hip:[42,44.5]},{s:"17-19 (2XL)",waist:[34.5,38],hip:[44.5,48]}]},
skims:{name:"SKIMS",i:"SK",c:"#C4A882",cat:"intimates",tag:"Shapewear tight, lounge TTS",big:false,small:true,tts:false,mNote:null,wNote:"Shapewear: size up. Lounge: TTS. Fits Everybody stretchy.",
  mTops:null,mBot:null,
  wTops:[{s:"XXS (00)",bust:[30,31.5],waist:[22,23.5]},{s:"XS (0-2)",bust:[31.5,33.5],waist:[23.5,25.5]},{s:"S (4-6)",bust:[33.5,36],waist:[25.5,28]},{s:"M (8-10)",bust:[36,38.5],waist:[28,30.5]},{s:"L (12-14)",bust:[38.5,41.5],waist:[30.5,33.5]},{s:"XL (16-18)",bust:[41.5,44.5],waist:[33.5,36.5]}],
  wBot:[{s:"XXS (00)",waist:[22,23.5],hip:[32.5,34]},{s:"XS (0-2)",waist:[23.5,25.5],hip:[34,36]},{s:"S (4-6)",waist:[25.5,28],hip:[36,38.5]},{s:"M (8-10)",waist:[28,30.5],hip:[38.5,41]},{s:"L (12-14)",waist:[30.5,33.5],hip:[41,44]},{s:"XL (16-18)",waist:[33.5,36.5],hip:[44,47]}]},
victoriassecret:{name:"Victoria's Secret",i:"VS",c:"#E91E8C",cat:"intimates",tag:"Apparel TTS",big:false,small:false,tts:true,mNote:null,wNote:"Apparel/PINK TTS. Bras use band+cup.",
  mTops:null,mBot:null,
  wTops:[{s:"XS (0-2)",bust:[32,33.5],waist:[24,25.5]},{s:"S (4-6)",bust:[34,35.5],waist:[26,27.5]},{s:"M (8-10)",bust:[36,38],waist:[28,30]},{s:"L (12-14)",bust:[38.5,40.5],waist:[30.5,32.5]},{s:"XL (16-18)",bust:[41,43.5],waist:[33,35.5]}],
  wBot:[{s:"XS (0-2)",waist:[24,25.5],hip:[34.5,36]},{s:"S (4-6)",waist:[26,27.5],hip:[36.5,38]},{s:"M (8-10)",waist:[28,30],hip:[38.5,40.5]},{s:"L (12-14)",waist:[30.5,32.5],hip:[41,43]},{s:"XL (16-18)",waist:[33,35.5],hip:[43.5,46]}]},
};
const BL=Object.values(DB),BK=Object.keys(DB);

// ── Prediction Engine ──
function predict(arr,m){
  if(!arr)return {s:"N/A",conf:0};
  let best=null,bs=Infinity;
  for(const e of arr){
    let sc=0,f=0;
    if(m.bust&&e.bust){sc+=Math.abs(m.bust-(e.bust[0]+e.bust[1])/2);f++}
    if(m.waist&&e.waist){sc+=Math.abs(m.waist-(e.waist[0]+e.waist[1])/2);f++}
    if(m.hip&&e.hip){sc+=Math.abs(m.hip-(e.hip[0]+e.hip[1])/2);f++}
    if(f>0){sc/=f;if(sc<bs){bs=sc;best=e}}
  }
  if(!best) return {s:"—",conf:0};
  // Smarter confidence: check how well each measurement fits in range
  let inRange=0, total=0, sumPct=0;
  [["bust",m.bust],["waist",m.waist],["hip",m.hip]].forEach(([k,v])=>{
    if(v&&best[k]){
      total++;
      const lo=best[k][0], hi=best[k][1], range=hi-lo;
      if(v>=lo&&v<=hi){inRange++;sumPct+=100} // dead center of range
      else if(v>=lo-0.5&&v<=hi+0.5){sumPct+=88} // just barely outside
      else if(v>=lo-1.5&&v<=hi+1.5){sumPct+=74} // close
      else if(v>=lo-3&&v<=hi+3){sumPct+=60} // stretching it
      else{sumPct+=45} // pretty far off
    }
  });
  // Factor in how many measurements we matched on (more data = more confident)
  let c = total>0 ? Math.round(sumPct/total) : 50;
  // Bonus for matching on multiple measurements
  if(total>=3 && inRange>=2) c=Math.min(c+3,99);
  // Penalty for only one measurement
  if(total===1) c=Math.min(c,85);
  // Add some natural variation based on brand position in array (subtle)
  const idx=arr.indexOf(best);
  const jitter=((idx*7+arr.length*3)%7)-3; // -3 to +3
  c=Math.max(45,Math.min(97,c+jitter));
  return {s:best.s,conf:c};
}

function willFit(arr,sLabel,m){if(!arr)return null;const e=arr.find(x=>x.s===sLabel);if(!e)return null;let t=0,n=0,ok=true;[["bust",m.bust],["waist",m.waist],["hip",m.hip]].forEach(([k,v])=>{if(v&&e[k]){const mid=(e[k][0]+e[k][1])/2;t+=v-mid;n++;if(v<e[k][0]-1||v>e[k][1]+1)ok=false}});if(!n)return null;const a=t/n;if(ok&&Math.abs(a)<=1)return {v:"Perfect fit",e:"💚",c:"#4CAF50",d:"This size should fit you beautifully."};if(a>1&&a<=3)return {v:"Might be snug",e:"🧡",c:"#FF9800",d:"Consider going up one size."};if(a>3)return {v:"Too small",e:"❤️",c:"#f44336",d:"Definitely go up a size or two."};if(a<-1&&a>=-3)return {v:"Might be loose",e:"💙",c:"#2196F3",d:"Could size down for a fitted look."};if(a<-3)return {v:"Too roomy",e:"💜",c:"#9C27B0",d:"Size down for a better fit."};return {v:"Should work",e:"💚",c:"#4CAF50",d:"Close enough — should be fine."}}

function getMFromKnown(slug,cat,sLabel,gender){const b=DB[slug];if(!b)return null;const arr=gender==="male"?(cat==="tops"?b.mTops:b.mBot):(cat==="tops"?b.wTops:b.wBot);if(!arr)return null;const x=arr.find(e=>e.s===sLabel);if(!x)return null;return {bust:x.bust?(x.bust[0]+x.bust[1])/2:null,waist:x.waist?(x.waist[0]+x.waist[1])/2:null,hip:x.hip?(x.hip[0]+x.hip[1])/2:null}}

// ══════════════════════════════════════════
// STYLES — warm, clean, soft
// ══════════════════════════════════════════
const T={
  bg:"#FAFAF7",card:"#FFFFFF",card2:"#F5F3EE",bd:"#E8E4DC",
  tx:"#1A1A1A",tx2:"#6B6560",tx3:"#9B9590",
  ac:"#2D5A3D",ac2:"#E8F0EB",acText:"#FFFFFF",
  warm:"#D4A574",pink:"#E8A0BF",
  fd:"'Instrument Serif',Georgia,serif",
  fb:"'DM Sans',system-ui,sans-serif",
  fm:"'JetBrains Mono',monospace",
  r:16,rs:"12px",
};

// ── Shared components ──
function Pill({children,active,onClick,style={}}){return <button onClick={onClick} style={{background:active?T.ac:T.card,color:active?T.acText:T.tx2,border:`1px solid ${active?T.ac:T.bd}`,borderRadius:100,padding:"8px 16px",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:T.fb,transition:"all .2s",...style}}>{children}</button>}

function Fld({label,value,onChange,placeholder,type="number"}){return <div style={{marginBottom:16}}><label style={{display:"block",fontSize:12,fontWeight:600,color:T.tx2,marginBottom:5,letterSpacing:".03em"}}>{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",background:T.card2,border:`1.5px solid ${T.bd}`,borderRadius:T.r,padding:"13px 16px",color:T.tx,fontFamily:T.fb,fontSize:15,outline:"none",transition:"border .2s"}}/></div>}

function Sel({label,value,onChange,options}){return <div style={{marginBottom:16}}><label style={{display:"block",fontSize:12,fontWeight:600,color:T.tx2,marginBottom:5,letterSpacing:".03em"}}>{label}</label><select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",background:T.card2,border:`1.5px solid ${T.bd}`,borderRadius:T.r,padding:"13px 16px",color:T.tx,fontFamily:T.fb,fontSize:15,outline:"none",cursor:"pointer"}}>{options.map(o=> <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>}

// ══════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════
export default function App(){
  const[page,setPage]=useState("home");
  const[selBrand,setSelBrand]=useState(null);
  useEffect(()=>{window.scrollTo(0,0)},[page]);

  return <div style={{background:T.bg,color:T.tx,fontFamily:T.fb,minHeight:"100vh"}}>
    {/* Nav */}
    <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",backdropFilter:"blur(20px)",background:"rgba(250,250,247,.85)",borderBottom:`1px solid ${T.bd}`}}>
      <a onClick={()=>setPage("home")} style={{fontFamily:T.fd,fontSize:20,color:T.tx,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
        <span style={{width:8,height:8,background:T.ac,borderRadius:"50%"}}/>whatsmysize</a>
      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        <a onClick={()=>setPage("brands")} style={{color:T.tx2,fontSize:13,fontWeight:500,cursor:"pointer"}}>Brands</a>
        <a onClick={()=>setPage("tool")} style={{background:T.ac,color:T.acText,padding:"8px 20px",borderRadius:100,fontWeight:600,fontSize:13,cursor:"pointer"}}>Find My Size</a>
      </div>
    </nav>

    {page==="home" && <HomePage setPage={setPage} setSelBrand={setSelBrand}/>}
    {page==="brands" && <BrandsPage setPage={setPage} setSelBrand={setSelBrand}/>}
    {page==="brand" && selBrand && <BrandPage b={selBrand} setPage={setPage}/>}
    {page==="tool" && <ToolPage/>}
  </div>;
}

// ── HOME ──
function HomePage({setPage}){
  return <>
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"100px 24px 60px"}}>
      <p style={{fontSize:13,color:T.ac,fontWeight:600,letterSpacing:".08em",textTransform:"uppercase",marginBottom:16}}>
        {BL.length} brands · Men & Women
      </p>
      <h1 style={{fontFamily:T.fd,fontSize:"clamp(40px,8vw,72px)",lineHeight:1.05,letterSpacing:"-.02em",maxWidth:600,marginBottom:16}}>
        Know your size,<br/><em style={{fontStyle:"italic",color:T.ac}}>everywhere.</em>
      </h1>
      <p style={{fontSize:16,color:T.tx2,maxWidth:420,lineHeight:1.6,marginBottom:36}}>
        Tell us what you wear or your measurements. We'll find your perfect size across every major brand.
      </p>
      <button onClick={()=>setPage("tool")} style={{background:T.ac,color:T.acText,padding:"16px 40px",borderRadius:100,fontWeight:600,fontSize:16,border:"none",cursor:"pointer",fontFamily:T.fb,display:"flex",alignItems:"center",gap:8}}>
        Find My Size <span style={{fontSize:20}}>→</span>
      </button>
      <div style={{display:"flex",gap:32,marginTop:48,flexWrap:"wrap",justifyContent:"center"}}>
        {[{v:"30-40%",l:"of returns are wrong size"},{v:"20 sec",l:"to build your profile"},{v:BL.length+"+",l:"brands covered"}].map((s,i)=>
          <div key={i} style={{textAlign:"center"}}><strong style={{fontSize:22,color:T.ac,display:"block",fontWeight:700}}>{s.v}</strong><span style={{fontSize:12,color:T.tx3}}>{s.l}</span></div>
        )}
      </div>
    </div>
    {/* Categories preview */}
    <section style={{padding:"40px 24px 60px",maxWidth:640,margin:"0 auto"}}>
      <h2 style={{fontFamily:T.fd,fontSize:28,marginBottom:20,textAlign:"center"}}>Brands we cover</h2>
      {Object.entries(CATS).map(([k,label])=>{
        const brands=BL.filter(b=>b.cat===k);
        if(!brands.length) return null;
        return <div key={k} style={{marginBottom:20}}>
          <p style={{fontSize:12,fontWeight:600,color:T.tx3,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>{label}</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {brands.map(b=> <span key={b.name} onClick={()=>{}} style={{background:T.card,border:`1px solid ${T.bd}`,borderRadius:100,padding:"6px 14px",fontSize:13,fontWeight:500,color:T.tx,cursor:"pointer"}}>{b.name}</span>)}
          </div>
        </div>;
      })}
    </section>
    <footer style={{padding:"24px",textAlign:"center",fontSize:12,color:T.tx3,borderTop:`1px solid ${T.bd}`}}>whatsmysize — data-driven sizing</footer>
  </>;
}

// ── BRANDS PAGE ──
function BrandsPage({setPage,setSelBrand}){
  return <div style={{padding:"90px 20px 60px",maxWidth:640,margin:"0 auto"}}>
    <h1 style={{fontFamily:T.fd,fontSize:32,marginBottom:8}}>All Brands</h1>
    <p style={{color:T.tx2,fontSize:14,marginBottom:28}}>{BL.length} brands with full sizing data</p>
    {Object.entries(CATS).map(([k,label])=>{
      const brands=BL.filter(b=>b.cat===k);
      if(!brands.length) return null;
      return <div key={k} style={{marginBottom:28}}>
        <p style={{fontSize:11,fontWeight:600,color:T.tx3,textTransform:"uppercase",letterSpacing:".1em",marginBottom:10}}>{label}</p>
        <div style={{display:"grid",gap:8}}>
          {brands.map(b=>{
            const fc=b.big?"#FF9800":b.small?"#2196F3":"#4CAF50";
            const fl=b.big?"Runs Big":b.small?"Runs Small":"TTS";
            const hasM=!!b.mTops,hasW=!!b.wTops;
            return <div key={b.name} onClick={()=>{setSelBrand(b);setPage("brand")}} style={{background:T.card,border:`1px solid ${T.bd}`,borderRadius:T.r,padding:"16px 18px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <span style={{fontWeight:600,fontSize:15}}>{b.name}</span>
                <div style={{display:"flex",gap:6,marginTop:4}}>
                  {hasM && <span style={{fontSize:10,color:T.tx3,background:T.card2,padding:"2px 6px",borderRadius:4}}>Men</span>}
                  {hasW && <span style={{fontSize:10,color:T.tx3,background:T.card2,padding:"2px 6px",borderRadius:4}}>Women</span>}
                </div>
              </div>
              <span style={{fontSize:11,fontWeight:600,color:fc,background:fc+"15",padding:"4px 10px",borderRadius:100}}>{fl}</span>
            </div>;
          })}
        </div>
      </div>;
    })}
  </div>;
}

// ── BRAND DETAIL ──
function BrandPage({b,setPage}){
  const fc=b.big?"#FF9800":b.small?"#2196F3":"#4CAF50";
  const fl=b.big?"Runs Big":b.small?"Runs Small":"True to Size";
  const Tbl=({data,showH})=>!data?null: <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
    <thead><tr style={{borderBottom:`1px solid ${T.bd}`}}>
      <th style={{padding:"8px 10px",textAlign:"left",color:T.tx3,fontWeight:500,fontSize:11}}>Size</th>
      <th style={{padding:"8px 10px",textAlign:"left",color:T.tx3,fontWeight:500,fontSize:11}}>Bust/Chest</th>
      <th style={{padding:"8px 10px",textAlign:"left",color:T.tx3,fontWeight:500,fontSize:11}}>Waist</th>
      {showH && <th style={{padding:"8px 10px",textAlign:"left",color:T.tx3,fontWeight:500,fontSize:11}}>Hip</th>}
    </tr></thead>
    <tbody>{data.map((r,i)=> <tr key={i} style={{borderBottom:`1px solid ${T.card2}`}}>
      <td style={{padding:"10px",fontWeight:600,color:T.ac,fontSize:12}}>{r.s}</td>
      <td style={{padding:"10px"}}>{r.bust?`${r.bust[0]}–${r.bust[1]}″`:""}</td>
      <td style={{padding:"10px"}}>{r.waist?`${r.waist[0]}–${r.waist[1]}″`:""}</td>
      {showH && <td style={{padding:"10px"}}>{r.hip?`${r.hip[0]}–${r.hip[1]}″`:""}</td>}
    </tr>)}</tbody>
  </table></div>;
  return <div style={{padding:"90px 20px 60px",maxWidth:640,margin:"0 auto"}}>
    <button onClick={()=>setPage("brands")} style={{background:"none",border:"none",color:T.tx2,fontSize:13,cursor:"pointer",fontFamily:T.fb,marginBottom:20}}>← All Brands</button>
    <h1 style={{fontFamily:T.fd,fontSize:32,marginBottom:4}}>{b.name}</h1>
    <p style={{color:T.tx2,fontSize:14,marginBottom:12}}>{b.tag}</p>
    <span style={{display:"inline-block",fontSize:12,fontWeight:600,color:fc,background:fc+"15",padding:"4px 12px",borderRadius:100,marginBottom:24}}>{fl}</span>
    {b.wNote && <div style={{background:T.card,border:`1px solid ${T.bd}`,borderRadius:T.r,padding:18,marginBottom:12}}>
      <p style={{fontSize:11,fontWeight:600,color:T.tx3,marginBottom:6}}>WOMEN'S FIT NOTES</p>
      <p style={{fontSize:14,lineHeight:1.6,color:T.tx}}>{b.wNote}</p>
    </div>}
    {b.mNote && <div style={{background:T.card,border:`1px solid ${T.bd}`,borderRadius:T.r,padding:18,marginBottom:12}}>
      <p style={{fontSize:11,fontWeight:600,color:T.tx3,marginBottom:6}}>MEN'S FIT NOTES</p>
      <p style={{fontSize:14,lineHeight:1.6,color:T.tx}}>{b.mNote}</p>
    </div>}
    {b.wTops && <div style={{background:T.card,border:`1px solid ${T.bd}`,borderRadius:T.r,padding:18,marginBottom:10}}><p style={{fontSize:11,fontWeight:600,color:T.tx3,marginBottom:10}}>WOMEN'S TOPS</p><Tbl data={b.wTops} showH={false}/></div>}
    {b.wBot && <div style={{background:T.card,border:`1px solid ${T.bd}`,borderRadius:T.r,padding:18,marginBottom:10}}><p style={{fontSize:11,fontWeight:600,color:T.tx3,marginBottom:10}}>WOMEN'S BOTTOMS</p><Tbl data={b.wBot} showH={true}/></div>}
    {b.mTops && <div style={{background:T.card,border:`1px solid ${T.bd}`,borderRadius:T.r,padding:18,marginBottom:10}}><p style={{fontSize:11,fontWeight:600,color:T.tx3,marginBottom:10}}>MEN'S TOPS</p><Tbl data={b.mTops} showH={false}/></div>}
    {b.mBot && <div style={{background:T.card,border:`1px solid ${T.bd}`,borderRadius:T.r,padding:18,marginBottom:10}}><p style={{fontSize:11,fontWeight:600,color:T.tx3,marginBottom:10}}>MEN'S BOTTOMS</p><Tbl data={b.mBot} showH={true}/></div>}
    <div style={{background:T.ac2,borderRadius:T.r,padding:24,textAlign:"center",marginTop:20}}>
      <p style={{fontFamily:T.fd,fontSize:20,marginBottom:8}}>Not sure which size?</p>
      <button onClick={()=>setPage("tool")} style={{background:T.ac,color:T.acText,border:"none",borderRadius:100,padding:"10px 28px",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:T.fb}}>Find My Size</button>
    </div>
  </div>;
}

// ══════════════════════════════════════════
// THE TOOL — Form disappears after submit
// ══════════════════════════════════════════
function ToolPage(){
  const[gender,setGender]=useState("female");
  const[mode,setMode]=useState("measure");
  const[height,setHeight]=useState("");const[weight,setWeight]=useState("");const[waistM,setWaistM]=useState("");
  const[kTopBrand,setKTopBrand]=useState("");const[kTopSize,setKTopSize]=useState("");
  const[kBotBrand,setKBotBrand]=useState("");const[kBotSize,setKBotSize]=useState("");
  const[vibe,setVibe]=useState("");
  const[results,setResults]=useState(null);
  const[showAll,setShowAll]=useState(false);
  // Check
  const[chkBrand,setChkBrand]=useState("");const[chkCat,setChkCat]=useState("tops");const[chkSize,setChkSize]=useState("");const[chkRes,setChkRes]=useState(null);
  const[copied,setCopied]=useState(false);

  const topOpts=useMemo(()=>{if(!kTopBrand)return[];const b=DB[kTopBrand];const a=gender==="male"?b.mTops:b.wTops;return a?a.map(x=>({v:x.s,l:x.s})):[]},[kTopBrand,gender]);
  const botOpts=useMemo(()=>{if(!kBotBrand)return[];const b=DB[kBotBrand];const a=gender==="male"?b.mBot:b.wBot;return a?a.map(x=>({v:x.s,l:x.s})):[]},[kBotBrand,gender]);
  const chkOpts=useMemo(()=>{if(!chkBrand)return[];const b=DB[chkBrand];const a=gender==="male"?(chkCat==="tops"?b.mTops:b.mBot):(chkCat==="tops"?b.wTops:b.wBot);return a?a.map(x=>({v:x.s,l:x.s})):[]},[chkBrand,chkCat,gender]);
  const bOpts=useMemo(()=>[{v:"",l:"Select brand..."},...BK.filter(k=>gender==="male"?!!DB[k].mTops:!!DB[k].wTops).map(k=>({v:k,l:DB[k].name}))],[gender]);
  const bOptsBot=useMemo(()=>[{v:"",l:"Select brand..."},...BK.filter(k=>gender==="male"?!!DB[k].mBot:!!DB[k].wBot).map(k=>({v:k,l:DB[k].name}))],[gender]);

  function run(){
    let m={bust:null,waist:null,hip:null};
    if(mode==="measure"){const h=parseFloat(height),w=parseFloat(weight),wa=parseFloat(waistM);if(h&&w)m.bust=estBust(h,w,gender);if(wa){m.waist=wa;m.hip=estHip(wa,gender)}}
    else{if(kTopBrand&&kTopSize){const tm=getMFromKnown(kTopBrand,"tops",kTopSize,gender);if(tm){m.bust=tm.bust;if(tm.waist)m.waist=tm.waist}}if(kBotBrand&&kBotSize){const bm=getMFromKnown(kBotBrand,"bottoms",kBotSize,gender);if(bm){if(bm.waist)m.waist=bm.waist;if(bm.hip)m.hip=bm.hip}}}
    if(!m.bust&&!m.waist&&!m.hip)return;
    const preds=BL.map(b=>{const tA=gender==="male"?b.mTops:b.wTops;const bA=gender==="male"?b.mBot:b.wBot;return {brand:b,top:predict(tA,m),bot:predict(bA,m)}}).filter(p=>p.top.s!=="N/A"||p.bot.s!=="N/A");
    preds.sort((a,b)=>{const ac=Math.max(a.top.conf,a.bot.conf);const bc=Math.max(b.top.conf,b.bot.conf);return bc-ac});
    setResults({m,preds});setShowAll(false);setChkRes(null);
  }

  const canRun=mode==="measure"?((height&&weight)||waistM):(kTopBrand&&kTopSize)||(kBotBrand&&kBotSize);
  const fitId=results?`WMS-${String(Math.abs(JSON.stringify(results.m).split('').reduce((a,b)=>((a<<5)-a)+b.charCodeAt(0),0)%99999)).padStart(5,'0')}`:null;
  const topResults=results?results.preds.slice(0,5):[];
  const restResults=results?results.preds.slice(5):[];
  const grouped=useMemo(()=>{if(!results)return {};const all=showAll?results.preds:topResults;const g={};all.forEach(p=>{const c=p.brand.cat;if(!g[c])g[c]=[];g[c].push(p)});return g},[results,showAll]);

  // ── If no results yet: show form ──
  if(!results){
    return <div style={{padding:"90px 20px 60px",maxWidth:480,margin:"0 auto"}}>
      <h1 style={{fontFamily:T.fd,fontSize:28,marginBottom:4,textAlign:"center"}}>Find your perfect size</h1>
      <p style={{color:T.tx2,fontSize:14,marginBottom:24,textAlign:"center"}}>{BL.length} brands. Takes 20 seconds.</p>

      {/* Gender */}
      <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:20}}>
        {["female","male"].map(g=> <Pill key={g} active={gender===g} onClick={()=>{setGender(g);setKTopBrand("");setKBotBrand("");setKTopSize("");setKBotSize("")}}>{g==="female"?"Women's":"Men's"}</Pill>)}
      </div>

      {/* Mode */}
      <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:24}}>
        {[{k:"measure",l:"My measurements"},{k:"known",l:"I know my size"}].map(m=> <Pill key={m.k} active={mode===m.k} onClick={()=>setMode(m.k)}>{m.l}</Pill>)}
      </div>

      <div style={{background:T.card,border:`1px solid ${T.bd}`,borderRadius:20,padding:24}}>
        {mode==="measure"?<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Fld label="Height (inches)" value={height} onChange={setHeight} placeholder="e.g. 65"/>
            <Fld label="Weight (lbs)" value={weight} onChange={setWeight} placeholder="e.g. 140"/>
          </div>
          <Fld label="Waist (inches)" value={waistM} onChange={setWaistM} placeholder="e.g. 28"/>
          <p style={{fontSize:12,color:T.tx3}}>Height + weight estimates your bust. Waist predicts bottoms.</p>
        </>:<>
          <p style={{fontSize:14,fontWeight:600,color:T.tx,marginBottom:10}}>What top fits you well?</p>
          <Sel label="Brand" value={kTopBrand} onChange={v=>{setKTopBrand(v);setKTopSize("")}} options={bOpts}/>
          {kTopBrand && <Sel label="Your size" value={kTopSize} onChange={setKTopSize} options={[{v:"",l:"Select..."},...topOpts]}/>}
          <p style={{fontSize:14,fontWeight:600,color:T.tx,marginBottom:10,marginTop:12}}>What bottoms fit you well?</p>
          <Sel label="Brand" value={kBotBrand} onChange={v=>{setKBotBrand(v);setKBotSize("")}} options={bOptsBot}/>
          {kBotBrand && <Sel label="Your size" value={kBotSize} onChange={setKBotSize} options={[{v:"",l:"Select..."},...botOpts]}/>}
          <p style={{fontSize:12,color:T.tx3,marginTop:8}}>Fill in at least one. Both = better results.</p>
        </>}

        {/* Optional vibe */}
        <div style={{marginTop:20,paddingTop:16,borderTop:`1px solid ${T.bd}`}}>
          <p style={{fontSize:12,fontWeight:600,color:T.tx2,marginBottom:8}}>Body type (optional — for your Fit ID)</p>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {VIBES.map(v=> <button key={v} onClick={()=>setVibe(vibe===v?"":v)} style={{background:vibe===v?T.ac:T.card2,color:vibe===v?T.acText:T.tx2,border:`1px solid ${vibe===v?T.ac:T.bd}`,borderRadius:100,padding:"6px 14px",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:T.fb,transition:"all .2s"}}>{v}</button>)}
          </div>
        </div>

        <button onClick={run} disabled={!canRun} style={{width:"100%",marginTop:20,background:canRun?T.ac:"#ccc",color:canRun?T.acText:"#999",border:"none",borderRadius:T.r,padding:16,fontSize:16,fontWeight:600,cursor:canRun?"pointer":"not-allowed",fontFamily:T.fb}}>
          Get My Sizes
        </button>
      </div>
    </div>;
  }

  // ── RESULTS VIEW — form is gone ──
  return <div style={{padding:"80px 16px 40px",maxWidth:500,margin:"0 auto"}}>
    {/* Fit ID card — tap to edit */}
    <div onClick={()=>setResults(null)} style={{
      background:"linear-gradient(135deg, #2D5A3D 0%, #1a3a28 50%, #2D5A3D 100%)",
      borderRadius:24,padding:"24px 22px",marginBottom:28,cursor:"pointer",
      boxShadow:"0 8px 32px rgba(45,90,61,.25), 0 2px 8px rgba(0,0,0,.1)",
      position:"relative",overflow:"hidden"
    }}>
      {/* Decorative circles */}
      <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,.05)"}}/>
      <div style={{position:"absolute",bottom:-20,left:-20,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,.03)"}}/>
      <div style={{position:"relative"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <p style={{fontSize:10,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:".15em",fontWeight:600}}>Your Fit ID</p>
            <p style={{fontFamily:T.fm,fontSize:28,fontWeight:700,color:"#CDFF50",marginTop:4,letterSpacing:".02em"}}>{fitId}</p>
            {vibe && <div style={{display:"inline-flex",alignItems:"center",gap:4,marginTop:6,background:"rgba(255,255,255,.1)",borderRadius:100,padding:"4px 12px"}}>
              <span style={{fontSize:12}}>✨</span>
              <span style={{fontSize:12,color:"rgba(255,255,255,.85)",fontWeight:500}}>{vibe}</span>
            </div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
            <button onClick={e=>{e.stopPropagation();navigator.clipboard?.writeText(`${fitId}${vibe?` · ${vibe}`:""} — whatsmysize.ai`);setCopied(true);setTimeout(()=>setCopied(false),2000)}} style={{
              background:copied?"rgba(205,255,80,.2)":"rgba(255,255,255,.1)",
              border:`1px solid ${copied?"rgba(205,255,80,.4)":"rgba(255,255,255,.15)"}`,
              borderRadius:10,padding:"8px 16px",fontSize:12,fontWeight:600,cursor:"pointer",
              fontFamily:T.fb,color:copied?"#CDFF50":"rgba(255,255,255,.85)",
              backdropFilter:"blur(4px)",transition:"all .2s"
            }}>{copied?"Copied!":"📋 Share"}</button>
            <p style={{fontSize:10,color:"rgba(255,255,255,.35)"}}>Tap card to edit</p>
          </div>
        </div>
      </div>
    </div>

    {/* Results header */}
    <h2 style={{fontFamily:T.fd,fontSize:24,marginBottom:4}}>Your sizes</h2>
    <p style={{color:T.tx2,fontSize:13,marginBottom:20}}>{gender==="female"?"Women's":"Men's"} · Top {showAll?results.preds.length:Math.min(5,results.preds.length)} matches</p>

    {/* Grouped results */}
    {Object.entries(grouped).map(([catKey,preds])=> <div key={catKey} style={{marginBottom:20}}>
      <p style={{fontSize:11,fontWeight:600,color:T.tx3,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>{CATS[catKey]||catKey}</p>
      <div style={{display:"grid",gap:8}}>
        {preds.map(({brand:b,top,bot})=>{
          const fc2=b.big?"#FF9800":b.small?"#2196F3":"#4CAF50";
          return <div key={b.name} style={{background:T.card,border:`1px solid ${T.bd}`,borderRadius:T.r,padding:"14px 16px",boxShadow:"0 1px 4px rgba(0,0,0,.03)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontWeight:600,fontSize:14}}>{b.name}</span>
                <span style={{fontSize:10,color:fc2,fontWeight:600}}>{b.big?"Runs Big":b.small?"Runs Small":"TTS"}</span>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {top.s!=="N/A" && <div style={{background:T.card2,borderRadius:10,padding:"10px 12px"}}>
                <p style={{fontSize:10,color:T.tx3,marginBottom:2}}>Tops</p>
                <p style={{fontSize:18,fontWeight:700,color:T.ac}}>{top.s}</p>
                <p style={{fontSize:10,color:top.conf>=85?"#4CAF50":top.conf>=70?T.tx2:"#FF9800"}}>{top.conf>=85?"Great match":top.conf>=70?"Good match":"Close match"} · {top.conf}%</p>
              </div>}
              {bot.s!=="N/A" && <div style={{background:T.card2,borderRadius:10,padding:"10px 12px"}}>
                <p style={{fontSize:10,color:T.tx3,marginBottom:2}}>Bottoms</p>
                <p style={{fontSize:18,fontWeight:700,color:T.ac}}>{bot.s}</p>
                <p style={{fontSize:10,color:bot.conf>=85?"#4CAF50":bot.conf>=70?T.tx2:"#FF9800"}}>{bot.conf>=85?"Great match":bot.conf>=70?"Good match":"Close match"} · {bot.conf}%</p>
              </div>}
            </div>
          </div>;
        })}
      </div>
    </div>)}

    {/* Show more */}
    {!showAll && restResults.length>0 && <button onClick={()=>setShowAll(true)} style={{width:"100%",background:T.card,border:`1px solid ${T.bd}`,borderRadius:T.r,padding:14,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:T.fb,color:T.tx2,marginBottom:20}}>
      Show {restResults.length} more brands
    </button>}

    {/* Will this fit? */}
    <div style={{background:T.card,border:`1px solid ${T.bd}`,borderRadius:20,padding:20,marginTop:8}}>
      <p style={{fontWeight:600,fontSize:15,marginBottom:4}}>Will this fit me?</p>
      <p style={{color:T.tx2,fontSize:12,marginBottom:14}}>Check a specific brand + size</p>
      <Sel label="Brand" value={chkBrand} onChange={v=>{setChkBrand(v);setChkSize("");setChkRes(null)}} options={bOpts}/>
      <Sel label="Category" value={chkCat} onChange={v=>{setChkCat(v);setChkSize("");setChkRes(null)}} options={[{v:"tops",l:"Tops"},{v:"bottoms",l:"Bottoms"}]}/>
      {chkBrand && <Sel label="Size" value={chkSize} onChange={v=>{setChkSize(v);setChkRes(null)}} options={[{v:"",l:"Select..."},...chkOpts]}/>}
      <button onClick={()=>{if(!chkBrand||!chkSize||!results)return;const b=DB[chkBrand];const arr=gender==="male"?(chkCat==="tops"?b.mTops:b.mBot):(chkCat==="tops"?b.wTops:b.wBot);const r=willFit(arr,chkSize,results.m);setChkRes({b,size:chkSize,cat:chkCat,r})}} disabled={!chkBrand||!chkSize} style={{width:"100%",background:chkBrand&&chkSize?T.ac2:T.card2,color:chkBrand&&chkSize?T.ac:T.tx3,border:`1px solid ${T.bd}`,borderRadius:10,padding:12,fontSize:14,fontWeight:600,cursor:chkBrand&&chkSize?"pointer":"not-allowed",fontFamily:T.fb}}>Check fit</button>
      {chkRes&&chkRes.r && <div style={{marginTop:12,padding:14,borderRadius:12,background:chkRes.r.c+"10",border:`1px solid ${chkRes.r.c}30`}}>
        <p style={{fontSize:16,marginBottom:4}}><span style={{marginRight:6}}>{chkRes.r.e}</span><strong style={{color:chkRes.r.c}}>{chkRes.r.v}</strong></p>
        <p style={{fontSize:13,color:T.tx}}>{chkRes.b.name} {chkRes.size}: {chkRes.r.d}</p>
      </div>}
    </div>
  </div>;
}
