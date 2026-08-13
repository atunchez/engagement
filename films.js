// ===================================================================
//  FILM STOCKS
//
//  Each entry is one look guests can pick on the camera page. Tweak the
//  numbers freely — every field is optional except id and name.
//
//    mul        per-channel multiplier [r, g, b]. >1 boosts, <1 cuts.
//    add        per-channel offset, applied after mul.
//    lift       how far the blacks are lifted [r, g, b]. Bigger = more faded.
//    fade       overall compression toward the lift. Lower = flatter.
//    contrast   S-curve strength. 1 is neutral.
//    saturation 1 is untouched, 0 is black and white, >1 is punchier.
//    grain      0 turns it off. 26 is the classic disposable look.
//    vignette   edge colour multiplied in, or null for none.
//    leak       corner light leak colour, or null for none.
//    stamp      whether to burn the date into the corner.
//
//  The first entry is the default.
// ===================================================================

const FILMS = [
  {
    id: "disposable",
    name: "Disposable",
    mul: [1.07, 1.01, 0.92],
    add: [6, 2, -4],
    lift: [20, 16, 22],
    fade: 0.9,
    contrast: 1.1,
    saturation: 1,
    grain: 26,
    vignette: "#a2887a",
    leak: "rgba(255, 138, 60, 0.30)",
    stamp: true,
  },
  {
    id: "gold",
    name: "Gold",
    mul: [1.1, 1.02, 0.88],
    add: [10, 4, -6],
    lift: [14, 12, 16],
    fade: 0.94,
    contrast: 1.06,
    saturation: 1.12,
    grain: 14,
    vignette: "#b49a86",
    leak: "rgba(255, 170, 80, 0.20)",
    stamp: true,
  },
  {
    id: "portra",
    name: "Portra",
    mul: [1.03, 1.0, 0.99],
    add: [8, 6, 4],
    lift: [22, 20, 20],
    fade: 0.9,
    contrast: 0.96,
    saturation: 0.92,
    grain: 8,
    vignette: "#c3b3a6",
    leak: null,
    stamp: false,
  },
  {
    id: "flash",
    name: "Night Flash",
    mul: [1.02, 1.0, 1.05],
    add: [-6, -4, 2],
    lift: [6, 6, 12],
    fade: 1.0,
    contrast: 1.28,
    saturation: 1.05,
    grain: 22,
    vignette: "#5d5f70",
    leak: null,
    stamp: true,
  },
  {
    id: "trix",
    name: "Black & White",
    mul: [1, 1, 1],
    add: [0, 0, 0],
    lift: [14, 14, 14],
    fade: 0.92,
    contrast: 1.25,
    saturation: 0,
    grain: 34,
    vignette: "#8f8f8f",
    leak: null,
    stamp: false,
  },
  {
    id: "faded",
    name: "Faded",
    mul: [1.0, 1.0, 1.02],
    add: [12, 12, 14],
    lift: [34, 32, 36],
    fade: 0.82,
    contrast: 0.92,
    saturation: 0.78,
    grain: 16,
    vignette: "#b9aca3",
    leak: null,
    stamp: true,
  },
  {
    id: "sun",
    name: "Sun-bleached",
    mul: [1.12, 1.06, 0.98],
    add: [18, 14, 10],
    lift: [26, 24, 22],
    fade: 0.9,
    contrast: 0.98,
    saturation: 1.05,
    grain: 10,
    vignette: null,
    leak: "rgba(255, 200, 120, 0.25)",
    stamp: true,
  },
  {
    id: "polaroid",
    name: "Polaroid",
    mul: [1.04, 1.02, 1.0],
    add: [10, 10, 6],
    lift: [26, 26, 22],
    fade: 0.88,
    contrast: 1.0,
    saturation: 0.95,
    grain: 10,
    vignette: "#bdb2a6",
    leak: "rgba(255, 220, 180, 0.15)",
    stamp: false,
  },
  {
    id: "cross",
    name: "Cross Process",
    mul: [1.15, 1.0, 0.85],
    add: [-10, 0, 20],
    lift: [8, 14, 34],
    fade: 0.95,
    contrast: 1.35,
    saturation: 1.3,
    grain: 18,
    vignette: "#8a7f9a",
    leak: "rgba(80, 255, 220, 0.12)",
    stamp: false,
  },
  {
    id: "neon",
    name: "Neon",
    mul: [1.05, 0.98, 1.15],
    add: [-4, -6, 10],
    lift: [18, 10, 30],
    fade: 0.95,
    contrast: 1.2,
    saturation: 1.35,
    grain: 20,
    vignette: "#6a5a8a",
    leak: "rgba(255, 60, 180, 0.18)",
    stamp: false,
  },
];

// Shared across every look.
const FILM_OUTPUT = {
  maxEdge: 1600,      // longest side of the finished photo, in pixels
  quality: 0.88,      // JPEG quality
  keepOriginal: true, // also upload the untouched original
  maxOriginalMB: 20,  // skip originals larger than this
  stampColor: "rgba(255, 168, 60, 0.95)",
};

function filmById(id) {
  return FILMS.find((f) => f.id === id) || FILMS[0];
}
