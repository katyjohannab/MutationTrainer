/* =========================================================
   Welsh Mutation Trainer — mutation-trainer.js (clean rebuild)
   Implements:
   - Robust presets (Phase 2)
   - Common vs All categories (Phase 3)
   - Pack scoping (starter-preps uses data/prep.csv only)
   - i18n for all new UI
   - Avoids rebuilding filter DOM on every click (prevents layout break)
   ========================================================= */

/* ========= Utilities ========= */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function normalize(s) {
  return (s || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/’/g, "'")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function esc(s) {
  return (s == null ? "" : String(s)).replace(/[&<>"]/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
  }[ch]));
}

function getParam(k) {
  return new URLSearchParams(location.search).get(k);
}

function saveLS(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
}
function loadLS(k, d) {
  try {
    const r = localStorage.getItem(k);
    return r ? JSON.parse(r) : d;
  } catch (e) {
    return d;
  }
}

function download(text, filename, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* Robust language getter (matches navbar.js behaviour) */
function wmGetLangLocal() {
  const raw = localStorage.getItem("wm_lang");
  if (!raw) return "en";
  try {
    const v = JSON.parse(raw);
    return (v === "cy" || v === "en") ? v : "en";
  } catch {
    return (raw === "cy" || raw === "en") ? raw : "en";
  }
}

/* ========= Canonical trigger (preset-safe) =========
   - lowercase, trims, normalises apostrophes
   - removes bracketed glosses: "i (to)" -> "i"; "y [the]" -> "y"
*/
function canonicalTrigger(s) {
  let x = (s == null ? "" : String(s));
  x = x.replace(/’/g, "'");           // normalise curly apostrophe
  x = x.replace(/\([^)]*\)/g, " ");   // remove (...) gloss
  x = x.replace(/\[[^\]]*\]/g, " ");  // remove [...] gloss
  x = normalize(x);
  if (x.includes(" ")) x = x.split(" ")[0].trim();
  return x;
}

/* ========= Smart review (Leitner) ========= */
const LEITNER_LS_KEY = "wm_leitner_boxes_v1";
const PRACTICE_MODE_LS_KEY = "wm_practice_mode_v1";
const LEITNER_MAX_BOX = 5;
const LEITNER_WEIGHTS = [0, 50, 25, 15, 7, 3]; // index 1..5

function getCardId(card, idxFallback) {
  const raw = (card && (card.CardId ?? card.CardID ?? card.ID ?? card.Id ?? card.id));
  const s = (raw == null ? "" : String(raw)).trim();
  return s ? s : `row_${idxFallback}`;
}
function clampBox(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 1;
  return Math.max(1, Math.min(LEITNER_MAX_BOX, Math.round(x)));
}
function getBoxFor(cardId) {
  return clampBox(state.leitner?.[cardId] ?? 1);
}
function setBoxFor(cardId, box) {
  if (!state.leitner) state.leitner = {};
  state.leitner[cardId] = clampBox(box);
  saveLS(LEITNER_LS_KEY, state.leitner);
}
function updateLeitner(cardId, result) {
  const cur = getBoxFor(cardId);
  const next = (result === "correct") ? Math.min(LEITNER_MAX_BOX, cur + 1) : 1;
  setBoxFor(cardId, next);
}
function weightedPickBox(candidatesByBox) {
  let total = 0;
  for (let b = 1; b <= LEITNER_MAX_BOX; b++) {
    if (candidatesByBox[b]?.length) total += LEITNER_WEIGHTS[b];
  }
  if (!total) return 1;
  let r = Math.random() * total;
  for (let b = 1; b <= LEITNER_MAX_BOX; b++) {
    if (!candidatesByBox[b]?.length) continue;
    r -= LEITNER_WEIGHTS[b];
    if (r <= 0) return b;
  }
  return 1;
}
function pickNextSmartIdx() {
  const n = state.filtered?.length || 0;
  if (!n) return 0;

  if (!Array.isArray(state.smartQueue)) state.smartQueue = [];

  if (state.smartQueue.length) {
    state.smartQueue.forEach(item => item.dueAfter = Math.max(0, (item.dueAfter || 0) - 1));
    const duePos = state.smartQueue.findIndex(item => (item.dueAfter || 0) === 0 && item.idx !== state.smartIdx);
    if (duePos >= 0) {
      const item = state.smartQueue.splice(duePos, 1)[0];
      return item.idx;
    }
  }

  const byBox = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (let i = 0; i < n; i++) {
    const id = getCardId(state.filtered[i], i);
    const box = getBoxFor(id);
    byBox[box].push(i);
  }

  let chosenBox = weightedPickBox(byBox);
  if (!byBox[chosenBox].length) {
    for (let b = 1; b <= LEITNER_MAX_BOX; b++) {
      if (byBox[b].length) { chosenBox = b; break; }
    }
  }

  const pool = byBox[chosenBox] || [];
  if (!pool.length) return Math.floor(Math.random() * n);

  let idx = pool[Math.floor(Math.random() * pool.length)];
  for (let tries = 0; tries < 6 && idx === state.smartIdx && pool.length > 1; tries++) {
    idx = pool[Math.floor(Math.random() * pool.length)];
  }
  return idx;
}

/* ========= Data coercion ========= */
const PREP = new Set(["am","ar","at","dan","dros","tros","drwy","trwy","gan","heb","hyd","i","o","tan","wrth","yng","yn","gyda","hefo","â"]);

function getVal(row, names) {
  const keys = Object.keys(row || {});
  for (const key of keys) {
    if (names.some(n => key.trim().toLowerCase() === n.trim().toLowerCase())) {
      return (row[key] ?? "").toString().trim();
    }
  }
  return "";
}

function familyFromOutcome(outcome) {
  const o = (outcome || "").toUpperCase();
  if (o === "SM") return "Soft";
  if (o === "AM") return "Aspirate";
  if (o === "NM") return "Nasal";
  if (o === "NONE") return "None";
  return "";
}

function coerceRow(row) {
  const r = row || {};
  const rawOutcome = getVal(r, ["Outcome","Result","Mutation","Mut"]);
  const o = (rawOutcome || "").replace(/["']/g, "").toUpperCase();
  const trig = getVal(r, ["Trigger","Trigger/Structure","Structure","Preposition"]);

  let famRaw = getVal(r, ["RuleFamily","Rule Family","Family"]).trim();
  if (!famRaw) famRaw = familyFromOutcome(o);
  let fam = famRaw;
  if (famRaw.includes(",")) fam = famRaw.split(",")[0].trim();

  const trigCanon = canonicalTrigger(trig);

  return {
    CardId: getVal(r, ["CardId","Card ID","ID","Id","id","cardId","card_id"]) || "",
    RuleFamily: fam,
    RuleCategory: getVal(r, ["RuleCategory","Rule Category","Category"]) || (PREP.has(trigCanon) ? "Preposition" : ""),
    Trigger: trig,
    TriggerCanon: trigCanon,
    Base: getVal(r, ["Base","Radical","Word","Base word","BaseWord"]),
    WordCategory: getVal(r, ["WordCategory","Word Category","POS","Part of speech"]),
    Before: getVal(r, ["Before","PromptBefore","Left","SentenceBefore"]),
    After: getVal(r, ["After","PromptAfter","Right","SentenceAfter"]),
    Answer: getVal(r, ["Answer","Expected","Mutated","Target"]),
    Outcome: o,
    Why: getVal(r, ["Why","Note","Rule","Explanation","Notes"]),
    WhyCym: getVal(r, ["Why-Cym","WhyCym","Why Cym","Why (Cym)","Why Welsh","Why-Welsh"]),
    Translate: getVal(r, ["Translate","Translation","Gloss","Meaning"]),
  };
}

/* ========= App State ========= */
const state = {
  // Pack/source scoping (presets can lock to specific CSV source files)
  sourceScope: loadLS("wm_source_scope", []), // e.g. ["data/prep.csv"]

  rows: [],
  filtered: [],

  families: loadLS("wm_families", ["Soft","Aspirate","Nasal","None"]),
  categories: loadLS("wm_categories", []),
  outcomes: loadLS("wm_outcomes", ["SM","AM","NM","NONE"]),

  triggerQuery: loadLS("wm_trig", ""),
  nilOnly: loadLS("wm_nil", false),

  // Preset layer
  activePreset: loadLS("wm_active_preset", ""),
  presetTriggers: loadLS("wm_preset_triggers", []), // canonical triggers

  // Category UI
  showAllCategories: loadLS("wm_show_all_cats", false),

  mode: loadLS("wm_mode", "practice"),
  practiceMode: loadLS(PRACTICE_MODE_LS_KEY, "shuffle"),

  leitner: loadLS(LEITNER_LS_KEY, {}),

  smartIdx: null,
  smartCount: 0,
  smartQueue: [],

  deck: [],
  p: 0,
  guess: "",
  revealed: false,
  lastResult: null,

  history: loadLS("wm_hist", []),

  admin: getParam("admin") === "1",

  freezeIdx: null,
  freezePos: null,

  lang: wmGetLangLocal(),

  currentIdx: 0,
  currentDeckPos: -1,

  // Guard so we don’t rebind events repeatedly
  _filtersBound: false,
};

/* ========= UI Translations ========= */
const LABEL = {
  en: {
    headings: {
      focus:"Focus",
      presets:"Start here",
      rulefamily:"RuleFamily",
      outcome:"Outcome",
      categories:"Categories",
      trigger:"Filter by Trigger",
      nilOnly:"Nil-cases only (no mutation expected)"
    },
    presets: {
      starterPrepsTitle: "Starter prepositions",
      starterPrepsDesc: "Core / starter set of common prepositions",
      numbersTitle: "Numbers 1–10",
      numbersDesc: "Un, dau, tri ... deg",
      articlesTitle: "Articles",
      articlesDesc: "y / yr / 'r (starter set)",
      placeNamesTitle: "Place names",
      placeNamesDesc: "Early nasal-mutation practice",
      placeNamesTip: "Place names often take nasal mutation in common patterns."
    },
    categoryView: {
      showAll: "Show all categories",
      showCommon: "Show common categories"
    },
    categories: {
      All:"All",
      "Adjective+Noun":"Adjective+Noun",
      Article:"Article",
      "Bod+yn":"Bod+Yn",
      Complement:"Complement",
      Conjunction:"Conjunction",
      Deictic:"Deictic",
      Determiner:"Determiner",
      Idiom:"Idiom",
      Intensifier:"Intensifier",
      Interrogative:"Interrogative",
      Negation:"Negation",
      Numerals:"Numerals",
      Particle:"Particle",
      PlaceName:"PlaceName",
      Possessive:"Possessive",
      Preposition:"Preposition",
      Presentative:"Presentative",
      Relative:"Relative",
      SubjectBoundary:"SubjectBoundary",
      Subordinator:"Subordinator",
      TimeExpressions:"TimeExpressions"
    },
    rulefamily: { Soft:"Soft", Aspirate:"Aspirate", Nasal:"Nasal", None:"None", SM:"Soft", AM:"Aspirate", NM:"Nasal", NONE:"None" },
    instruction: "Type the correct form. If no change is needed, repeat the base form.",
    hint:"Hint", reveal:"Reveal", skip:"Skip", check:"Check", next:"Next",
    shuffleModeDesc:"Random review: cards appear in a truly random order.",
    smartModeDesc:"Smart review: adapts to your progress and focuses on mistakes, repeating those cards more often.",
    shuffleNowDesc:"Reshuffle the current deck (useful if you are seeing the same cards repeatedly).",
    shuffleNow:"Shuffle cards",
    shuffleModeShort:"Random",
    smartModeShort:"Smart",
    cardLabel:"Card",
    reviewedLabel:"Reviewed",
    poolLabel:"Pool",
    answerLabel:"Answer",
    statuses:{ correct:"Correct!", wrong:"Not quite", skipped:"Skipped" },
    youTyped:"You typed",
    blank:"(blank)",
    hear:"Hear",
    meaningAria:"Meaning",
    onboardDismiss:"Got it",
    resetStats:"Reset stats",
    backToTop:"Back to top",
    clearFilters:"Clear filters",
    triggerChip:"Trigger",
  },
  cy: {
    headings: {
      focus:"Ffocws",
      presets:"Dechreuwch yma",
      rulefamily:"Math Treiglad",
      outcome:"Canlyniad",
      categories:"Categorïau",
      trigger:"Hidlo yn ôl y sbardun",
      nilOnly:"Achosion dim-treiglad yn unig (dim treiglad disgwyliedig)"
    },
    presets: {
      starterPrepsTitle: "Arddodiaid sylfaenol",
      starterPrepsDesc: "Set ddechreuol o arddodiaid cyffredin",
      numbersTitle: "Rhifau 1–10",
      numbersDesc: "un, dau, tri ... deg",
      articlesTitle: "Erthyglau",
      articlesDesc: "y / yr / 'r (set ddechrau)",
      placeNamesTitle: "Enwau lleoedd",
      placeNamesDesc: "Ymarfer treiglad trwynol cynnar",
      placeNamesTip: "Mae enwau lleoedd yn aml yn cymryd treiglad trwynol mewn patrymau cyffredin."
    },
    categoryView: {
      showAll: "Dangos pob categori",
      showCommon: "Dangos categorïau cyffredin"
    },
    categories: {
      All:"Pob un",
      "Adjective+Noun":"Ansoddair+Enw",
      Article:"Erthygl",
      "Bod+yn":"Bod+Yn",
      Complement:"Cyflenwad",
      Conjunction:"Cysylltair",
      Deictic:"Deictig",
      Determiner:"Penderfyniadur",
      Idiom:"Idiom",
      Intensifier:"Dwysydd",
      Interrogative:"Holiadol",
      Negation:"Negydd",
      Numerals:"Rhifau",
      Particle:"Gronyn",
      PlaceName:"Enw lle",
      Possessive:"Meddiannol",
      Preposition:"Arddodiad",
      Presentative:"Cyflwyniadur",
      Relative:"Perthynol",
      SubjectBoundary:"Ar ôl pwnc",
      Subordinator:"Isgysylltair",
      TimeExpressions:"Mynegiadau Amser"
    },
    rulefamily: { Soft:"Meddal", Aspirate:"Llaes", Nasal:"Trwynol", None:"Dim", SM:"Meddal", AM:"Llaes", NM:"Trwynol", NONE:"Dim" },
    instruction: "Teipiwch y ffurf gywir. Os nad oes treiglad, ailysgrifennwch y ffurf wreiddiol.",
    hint:"Awgrym", reveal:"Datgelu", skip:"Hepgor", check:"Gwirio", next:"Nesaf",
    shuffleModeDesc:"Adolygu ar hap: mae cardiau’n ymddangos mewn trefn wirioneddol ar hap.",
    smartModeDesc:"Adolygu clyfar: addasu i’ch cynnydd a phwysleisio camgymeriadau; mae’n ailadrodd cardiau anghywir yn amlach.",
    shuffleNowDesc:"Ailgymysgu’r dec presennol (os ydych chi’n gweld yr un cardiau dro ar ôl tro).",
    shuffleNow:"Cymysgu cardiau",
    shuffleModeShort:"Ar hap",
    smartModeShort:"Clyfar",
    cardLabel:"Cerdyn",
    reviewedLabel:"Wedi adolygu",
    poolLabel:"Set",
    answerLabel:"Ateb",
    statuses:{ correct:"Cywir!", wrong:"Dim yn hollol gywir", skipped:"Wedi ei hepgor" },
    youTyped:"Teipioch chi",
    blank:"(gwag)",
    hear:"Gwrando",
    meaningAria:"Ystyr",
    onboardDismiss:"Iawn",
    resetStats:"Ailosod ystadegau",
    backToTop:"Yn ôl i’r brig",
    clearFilters:"Clirio hidlau",
    triggerChip:"Sbardun",
  }
};

function label(section, key) {
  const lang = state.lang || "en";
  return (LABEL?.[lang]?.[section]?.[key]) || key;
}

/* ========= Presets + Category view ========= */
const COMMON_CATEGORIES = [
  "Preposition",
  "Article",
  "Numerals",
  "Possessive",
  "Bod+yn",
  "Adjective+Noun",
  "Negation",
  "PlaceName",
];

const PRESET_DEFS = {
  "starter-preps": {
    id: "starter-preps",
    titleKey: "starterPrepsTitle",
    descKey: "starterPrepsDesc",
    category: "Preposition",
    triggers: ["am","ar","at","gan","i","o","trwy","drwy","tan","dros","tros","heb","hyd","wrth"],
    // Pack scoping:
    sourceScope: ["data/prep.csv"],
  },
  "numbers-1-10": {
    id: "numbers-1-10",
    titleKey: "numbersTitle",
    descKey: "numbersDesc",
    category: "Numerals",
    triggers: ["un","dau","tri","pedwar","pump","chwech","saith","wyth","naw","deg"],
  },
  "articles": {
    id: "articles",
    titleKey: "articlesTitle",
    descKey: "articlesDesc",
    category: "Article",
    triggers: ["y","yr","'r","r"],
    limitComplexity: true,
  },
  "place-names": {
    id: "place-names",
    titleKey: "placeNamesTitle",
    descKey: "placeNamesDesc",
    category: "PlaceName",
    triggers: [],
    forceFamily: "Nasal",
    tipKey: "placeNamesTip",
  },
};

const PRESET_ORDER = ["starter-preps","numbers-1-10","articles","place-names"];

function clearPresetLayer({ keepActivePreset = false } = {}) {
  if (!keepActivePreset) state.activePreset = "";
  state.presetTriggers = [];
  state.sourceScope = [];
  saveLS("wm_active_preset", state.activePreset);
  saveLS("wm_preset_triggers", state.presetTriggers);
  saveLS("wm_source_scope", state.sourceScope);
}

function buildCompleteSentence(card) {
  const before = (card.Before || "").trimEnd();
  const answer = (card.Answer || "").trim();
  const after  = (card.After  || "").trimStart();
  let s = [before, answer, after].filter(Boolean).join(" ");
  s = s.replace(/\s+/g, " ").trim();
  s = s.replace(/\s+([,.;:!?])/g, "$1");
  return s;
}

/* Heuristic until you have a Complexity column */
function isLikelyComplexRow(card) {
  const s = buildCompleteSentence(card);
  const w = normalize(s).split(" ").filter(Boolean);
  if (w.length > 14) return true;
  if (/[;:]/.test(s)) return true;
  const commas = (s.match(/,/g) || []).length;
  if (commas >= 1 && w.length > 12) return true;

  const low = normalize(s);
  const markers = ["achos","ond","pan","tra","er","os","lle","pryd","gan fod","sy'n","sydd"];
  if (markers.some(m => low.includes(m)) && w.length > 10) return true;
  return false;
}

function applyPreset(presetId, { fromUrl = false } = {}) {
  const p = PRESET_DEFS[presetId];
  if (!p) return;

  // Clear conflicting filters (but keep outcomes broad)
  state.triggerQuery = "";
  state.nilOnly = false;

  // Core preset selections
  state.activePreset = presetId;
  state.categories = [p.category];
  state.presetTriggers = (p.triggers || []).map(canonicalTrigger).filter(Boolean);

  // Families default (unless preset forces)
  state.families = p.forceFamily ? [p.forceFamily] : ["Soft","Aspirate","Nasal","None"];

  // Pack scoping (starter-preps only)
  state.sourceScope = Array.isArray(p.sourceScope) ? p.sourceScope.slice() : [];

  // Persist
  saveLS("wm_active_preset", state.activePreset);
  saveLS("wm_categories", state.categories);
  saveLS("wm_preset_triggers", state.presetTriggers);
  saveLS("wm_families", state.families);
  saveLS("wm_trig", state.triggerQuery);
  saveLS("wm_nil", state.nilOnly);
  saveLS("wm_source_scope", state.sourceScope);

  // UX: keep category view simple by default
  state.showAllCategories = false;
  saveLS("wm_show_all_cats", state.showAllCategories);

  applyFilters();
  rebuildDeck();
  render();         // IMPORTANT: do not rebuild filter DOM here
  updatePresetActiveClasses();
}

function updatePresetActiveClasses() {
  $$("[data-preset]").forEach(el => {
    const id = el.getAttribute("data-preset");
    if (!id) return;
    el.classList.toggle("preset-on", id === state.activePreset);
  });
}

function renderPresetTiles() {
  const container = $("#presetBtns");
  if (!container) return;

  container.innerHTML = "";
  const lang = state.lang || "en";

  for (const id of PRESET_ORDER) {
    const p = PRESET_DEFS[id];
    if (!p) continue;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `preset-btn ${state.activePreset === id ? "preset-on" : ""}`;
    btn.dataset.preset = id;

    const title = document.createElement("div");
    title.className = "preset-title";
    title.textContent = LABEL[lang].presets[p.titleKey];

    const desc = document.createElement("div");
    desc.className = "preset-desc";
    desc.textContent = LABEL[lang].presets[p.descKey];

    if (p.tipKey) btn.title = LABEL[lang].presets[p.tipKey];

    btn.appendChild(title);
    btn.appendChild(desc);
    btn.addEventListener("click", () => applyPreset(id));
    container.appendChild(btn);
  }
}

/* ========= Data loading ========= */
const FALLBACK_INDEX_URL = "https://katyjohannab.github.io/MutationTrainer/data/index.json";
const FALLBACK_SITE_ROOT = "https://katyjohannab.github.io/MutationTrainer/";

async function loadCsvUrl(u) {
  return new Promise((resolve, reject) => {
    Papa.parse(u, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => resolve(res.data),
      error: reject
    });
  });
}
function isAbsUrl(u) { return /^https?:\/\//i.test(u || ""); }
function resolveFromRoot(path, root) {
  const p = (path || "").toString().trim();
  if (!p) return "";
  if (isAbsUrl(p)) return p;
  return new URL(p.replace(/^\/+/, ""), root).toString();
}
async function fetchIndexList(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error("Failed to fetch index: " + url);
  const j = await r.json();
  if (!Array.isArray(j)) throw new Error("Index JSON is not an array: " + url);
  return j;
}

async function loadAllDefault() {
  let list = null;
  let usingFallbackRoot = false;

  try {
    list = await fetchIndexList("data/index.json");
  } catch (e) {
    list = await fetchIndexList(FALLBACK_INDEX_URL);
    usingFallbackRoot = true;
  }

  const root = usingFallbackRoot ? FALLBACK_SITE_ROOT : new URL(".", location.href).toString();
  let merged = [];

  for (const p of list) {
    const url = resolveFromRoot(p, root);
    if (!url) continue;

    try {
      const d = await loadCsvUrl(url);

      // Stamp each row with its index.json entry (e.g. "data/cards.csv" / "data/prep.csv")
      d.forEach(row => {
        if (row && typeof row === "object") row.__src = p;
      });

      merged = merged.concat(d);
    } catch (err) {
      console.warn("Failed to load source:", url, err);
    }
  }

  return merged;
}

async function initData() {
  const sheet = getParam("sheet");
  let rows = [];

  try {
    rows = sheet ? await loadCsvUrl(sheet) : await loadAllDefault();
  } catch (e) {
    console.warn("Data load failed; trying fallback", e);
    rows = await loadAllDefault();
  }

  // If loading a custom sheet, stamp the source
  if (sheet) {
    rows.forEach(row => {
      if (row && typeof row === "object") row.__src = sheet;
    });
  }

  // Keep source + trigger canon in cleaned rows
  const expected = ["CardId","RuleFamily","RuleCategory","Trigger","TriggerCanon","Base","WordCategory","Translate","Before","After","Answer","Outcome","Why","WhyCym","Source"];

  const cleaned = rows.map(r => {
    const src = (r && typeof r === "object" && r.__src) ? String(r.__src) : "";
    const m = coerceRow(r);
    const o = {};
    for (const k of expected) o[k] = (m?.[k] ?? "").toString().trim();
    o.Source = src;
    // Ensure TriggerCanon exists even if missing
    o.TriggerCanon = canonicalTrigger(o.Trigger);
    return o;
  });

  state.rows = cleaned;

  applyFilters();
  rebuildDeck();

  // Build UI now that categories exist
  buildFiltersUI();

  // Apply URL preset (shareable tutor links)
  const presetRaw = (getParam("preset") || "").trim();
  const mapped = (presetRaw === "prepositions") ? "starter-preps" : presetRaw;
  if (mapped && PRESET_DEFS[mapped]) {
    applyPreset(mapped, { fromUrl: true });
  } else {
    render();
  }
}

/* ========= Filters & Deck ========= */
function toggleBtn(text, active, onToggle) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = `pill ${active ? "pill-on" : ""}`;
  b.textContent = text;
  b.addEventListener("click", () => onToggle(!active));
  return b;
}

function applyFilters() {
  const allowedOutcomes = (state.outcomes && state.outcomes.length) ? state.outcomes : ["SM","AM","NM","NONE"];

  let list = state.rows.filter(r =>
    (state.families.length ? state.families.includes(r.RuleFamily) : true) &&
    (state.categories.length ? state.categories.includes(r.RuleCategory) : true) &&
    (allowedOutcomes.includes((r.Outcome || "").toUpperCase()))
  );

  if (state.nilOnly) list = list.filter(r => (r.Outcome || "").toUpperCase() === "NONE");

  // Preset triggers (canonical)
  if (state.presetTriggers && state.presetTriggers.length) {
    const set = new Set(state.presetTriggers.map(canonicalTrigger));
    list = list.filter(r => set.has(r.TriggerCanon || canonicalTrigger(r.Trigger)));
  }

  // Articles preset: simple only until true Complexity column exists
  if (state.activePreset && PRESET_DEFS[state.activePreset]?.limitComplexity) {
    list = list.filter(r => !isLikelyComplexRow(r));
  }

  if ((state.triggerQuery || "").trim()) {
    const q = normalize(state.triggerQuery);
    list = list.filter(r => normalize(r.Trigger).includes(q));
  }

  // Pack scope (only when preset sets it)
  if (Array.isArray(state.sourceScope) && state.sourceScope.length) {
    const allowed = new Set(state.sourceScope);
    list = list.filter(r => allowed.has(r.Source));
  }

  state.filtered = list;
}

function rebuildDeck() {
  const n = state.filtered.length;
  const d = Array.from({ length: n }, (_, i) => i);

  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }

  state.deck = d;
  state.p = 0;
  state.guess = "";
  state.revealed = false;
  state.lastResult = null;
  state.freezeIdx = null;
  state.freezePos = null;
  state.smartQueue = [];

  if (state.practiceMode === "smart") {
    state.smartCount = 0;
    state.smartIdx = pickNextSmartIdx();
  } else {
    state.smartIdx = null;
    state.smartCount = 0;
  }
}

/* ========= Build filter UI (one-time + lightweight updates) ========= */
function buildFiltersUI() {
  // Title labels (if your HTML uses these IDs)
  const lang = state.lang || "en";
  if ($("#focusTitle")) $("#focusTitle").textContent = LABEL[lang].headings.focus;
  if ($("#presetsTitle")) $("#presetsTitle").textContent = LABEL[lang].headings.presets;
  if ($("#rulefamilyTitle")) $("#rulefamilyTitle").textContent = LABEL[lang].headings.rulefamily;
  if ($("#outcomeTitle")) $("#outcomeTitle").textContent = LABEL[lang].headings.outcome;
  if ($("#categoriesTitle")) $("#categoriesTitle").textContent = LABEL[lang].headings.categories;
  if ($("#triggerLabel")) $("#triggerLabel").textContent = LABEL[lang].headings.trigger;
  if ($("#nilOnlyText")) $("#nilOnlyText").textContent = LABEL[lang].headings.nilOnly;

  // Preset tiles
  renderPresetTiles();

  // Derive category set from data
  const cats = new Set();
  for (const r of state.rows) if (r.RuleCategory) cats.add(r.RuleCategory);
  const allCats = Array.from(cats).sort();

  // Families
  const famEl = $("#familyBtns");
  if (famEl) {
    famEl.innerHTML = "";
    for (const f of ["Soft","Aspirate","Nasal","None"]) {
      const b = toggleBtn(label("rulefamily", f), state.families.includes(f), (on) => {
        state.families = on ? Array.from(new Set([...state.families, f])) : state.families.filter(x => x !== f);
        saveLS("wm_families", state.families);
        applyFilters();
        rebuildDeck();
        render();
      });
      b.dataset.key = f;
      famEl.appendChild(b);
    }
  }

  // Outcomes
  const outEl = $("#outcomeBtns");
  if (outEl) {
    outEl.innerHTML = "";
    const outcomes = ["SM","AM","NM","NONE"];
    for (const o of outcomes) {
      const b = toggleBtn(o, state.outcomes.includes(o), (on) => {
        state.outcomes = on ? Array.from(new Set([...state.outcomes, o])) : state.outcomes.filter(x => x !== o);
        saveLS("wm_outcomes", state.outcomes);
        applyFilters();
        rebuildDeck();
        render();
      });
      outEl.appendChild(b);
    }
  }

  // Categories — BASIC (common vs all)
  const basicCatEl = $("#basicCatBtns");
  if (basicCatEl) {
    basicCatEl.innerHTML = "";

    const showAll = !!state.showAllCategories;
    const displayCats = showAll
      ? allCats
      : COMMON_CATEGORIES.filter(c => cats.has(c));

    for (const c of displayCats) {
      if (!cats.has(c)) continue;
      const b = toggleBtn(label("categories", c), state.categories.includes(c), (on) => {
        // Any manual category selection exits preset mode
        clearPresetLayer();
        state.categories = on ? [c] : [];
        saveLS("wm_categories", state.categories);
        applyFilters();
        rebuildDeck();
        render();
        updatePresetActiveClasses();
      });
      basicCatEl.appendChild(b);
    }

    // Add toggle button beneath basic category pills
    const toggle = $("#catViewToggle") || document.createElement("button");
    toggle.id = "catViewToggle";
    toggle.type = "button";
    toggle.className = "btn btn-ghost";
    toggle.style.marginTop = "8px";
    toggle.textContent = showAll ? LABEL[lang].categoryView.showCommon : LABEL[lang].categoryView.showAll;

    toggle.onclick = () => {
      state.showAllCategories = !state.showAllCategories;
      saveLS("wm_show_all_cats", state.showAllCategories);
      buildFiltersUI(); // rebuild only the UI section (safe)
      updatePresetActiveClasses();
    };

    // Ensure it sits after the pills
    basicCatEl.parentElement?.appendChild(toggle);
  }

  // Categories — ADVANCED (full list always)
  const advCatEl = $("#catBtns");
  if (advCatEl) {
    advCatEl.innerHTML = "";
    for (const c of allCats) {
      const b = toggleBtn(label("categories", c), state.categories.includes(c), (on) => {
        clearPresetLayer();
        // advanced supports multi-select (optional); keep consistent with your current behaviour
        state.categories = on
          ? Array.from(new Set([...state.categories, c]))
          : state.categories.filter(x => x !== c);

        saveLS("wm_categories", state.categories);
        applyFilters();
        rebuildDeck();
        render();
        updatePresetActiveClasses();
      });
      advCatEl.appendChild(b);
    }
  }

  // Trigger filter
  const trig = $("#triggerFilter");
  if (trig) {
    trig.value = state.triggerQuery || "";
    trig.oninput = (e) => {
      // any manual trigger search exits preset mode
      clearPresetLayer();
      state.triggerQuery = e.target.value;
      saveLS("wm_trig", state.triggerQuery);
      applyFilters();
      rebuildDeck();
      render();
      updatePresetActiveClasses();
    };
  }

  // Nil-only toggle (keep functional; if you remove it from HTML it will no-op)
  const nil = $("#nilOnly");
  if (nil) {
    nil.checked = !!state.nilOnly;
    nil.onchange = (e) => {
      clearPresetLayer();
      state.nilOnly = e.target.checked;
      saveLS("wm_nil", state.nilOnly);
      applyFilters();
      rebuildDeck();
      render();
      updatePresetActiveClasses();
    };
  }

  state._filtersBound = true;
}

/* ========= Language sync ========= */
function applyLanguage() {
  state.lang = (state.lang === "cy" ? "cy" : "en");
  document.documentElement.setAttribute("lang", state.lang);

  buildFiltersUI();  // rebuild UI strings
  render();          // keep numbers stable
}

function syncLangFromNavbar() {
  const lang = wmGetLangLocal();
  if (lang !== "en" && lang !== "cy") return;
  if (state.lang === lang) return;
  state.lang = lang;
  applyLanguage();
}

// Listen for clicks on navbar language toggle (navbar.js owns it)
document.addEventListener("click", (e) => {
  const btn = e.target?.closest?.("#btnLangToggle");
  if (!btn) return;
  setTimeout(syncLangFromNavbar, 0);
}, true);

/* ========= TTS (Polly via Lambda URL) ========= */
const POLLY_FUNCTION_URL = "https://pl6xqfeht2hhbruzlhm3imcpya0upied.lambda-url.eu-west-2.on.aws/";
const ttsCache = new Map();

async function playPollySentence(sentence) {
  if (!sentence) throw new Error("No sentence to speak.");
  if (!POLLY_FUNCTION_URL) throw new Error("POLLY_FUNCTION_URL isn't set.");

  const cachedUrl = ttsCache.get(sentence);
  if (cachedUrl) {
    const audio = new Audio(cachedUrl);
    await audio.play();
    return;
  }

  const res = await fetch(POLLY_FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: sentence })
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `TTS failed (${res.status})`);
  }

  const ct = (res.headers.get("content-type") || "").toLowerCase();
  let url = null;

  if (ct.includes("audio") || ct.includes("octet-stream")) {
    const buf = await res.arrayBuffer();
    const blob = new Blob([buf], { type: "audio/mpeg" });
    url = URL.createObjectURL(blob);
  } else {
    const j = await res.json();
    if (j.url) url = j.url;
    else if (j.audioBase64 || j.audioContent) {
      const b64 = j.audioBase64 || j.audioContent;
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      url = URL.createObjectURL(blob);
    } else {
      throw new Error("TTS response wasn't audio and didn't include url/audioBase64/audioContent.");
    }
  }

  ttsCache.set(sentence, url);
  const audio = new Audio(url);
  await audio.play();
}

/* ========= Base word “?” translation UI ========= */
function mountBaseTranslationUI(capsuleEl, card) {
  if (!capsuleEl) return;

  const meaning = (card?.Translate || "").trim();
  if (!meaning) return;

  capsuleEl.style.position = "relative";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "base-info-btn";
  btn.textContent = "?";
  btn.setAttribute("aria-label", LABEL[state.lang || "en"].meaningAria || "Meaning");
  btn.setAttribute("title", LABEL[state.lang || "en"].meaningAria || "Meaning");

  const pop = document.createElement("div");
  pop.className = "base-info-popover hidden animate-pop";
  pop.setAttribute("role", "dialog");

  const close = document.createElement("button");
  close.type = "button";
  close.className = "base-info-close";
  close.setAttribute("aria-label", "Close");
  close.textContent = "×";

  const cat = (card?.WordCategory || "").trim();
  pop.innerHTML = `
    <div class="base-info-meaning">${esc(meaning)}</div>
    <div class="base-info-meta">
      ${cat ? `<span>${esc(state.lang === "cy" ? "Categori:" : "Category:")}</span><span class="base-info-tag">${esc(cat)}</span>` : ""}
    </div>
  `;
  pop.appendChild(close);

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isHidden = pop.classList.contains("hidden");
    $$(".base-info-popover").forEach(p => p.classList.add("hidden"));
    if (isHidden) pop.classList.remove("hidden");
    else pop.classList.add("hidden");
  });

  close.addEventListener("click", (e) => {
    e.stopPropagation();
    pop.classList.add("hidden");
  });

  pop.addEventListener("click", (e) => e.stopPropagation());

  capsuleEl.appendChild(btn);
  capsuleEl.appendChild(pop);
}

document.addEventListener("click", () => {
  $$(".base-info-popover").forEach(p => p.classList.add("hidden"));
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    $$(".base-info-popover").forEach(p => p.classList.add("hidden"));
  }
});

/* ========= Render helpers ========= */
function btn(labelText, extraClass, onClick) {
  const b = document.createElement("button");
  b.className = `btn ${extraClass}`.trim();
  b.type = "button";
  b.textContent = labelText;
  b.onclick = onClick;
  return b;
}

/* ========= Render ========= */
function renderPractice() {
  const host = $("#practiceCard");
  if (!host) return;
  host.innerHTML = "";

  const lang = state.lang || "en";
  const t = LABEL[lang] || LABEL.en;
  const n = state.filtered.length;

  if (!n) {
    host.innerHTML = `
      <div class="text-slate-700 panel rounded-xl p-4">
        No cards match your filters.
        <button id="btnClearFilters" class="ml-2 btn btn-ghost px-2 py-1">${esc(t.clearFilters)}</button>
      </div>`;
    $("#btnClearFilters")?.addEventListener("click", () => {
      clearPresetLayer();
      state.families = ["Soft","Aspirate","Nasal","None"];
      state.categories = [];
      state.outcomes = ["SM","AM","NM","NONE"];
      state.triggerQuery = "";
      state.nilOnly = false;
      saveLS("wm_families", state.families);
      saveLS("wm_categories", state.categories);
      saveLS("wm_outcomes", state.outcomes);
      saveLS("wm_trig", state.triggerQuery);
      saveLS("wm_nil", state.nilOnly);
      applyFilters(); rebuildDeck(); render(); updatePresetActiveClasses();
    });
    return;
  }

  let idxNow;
  let posText = "";
  if (state.practiceMode === "smart") {
    if (state.smartIdx == null) state.smartIdx = pickNextSmartIdx();
    idxNow = state.smartIdx;
    state.currentDeckPos = -1;
    const reviewed = (state.smartCount || 0) + 1;
    posText = `${t.reviewedLabel} ${reviewed} · ${t.poolLabel} ${n}`;
    const cp = $("#cardPos");
    if (cp) cp.textContent = `${t.smartModeShort} · ${posText}`;
  } else {
    const deckIdx = state.p % state.deck.length;
    idxNow = state.deck[deckIdx];
    state.currentDeckPos = deckIdx;
    const pos = state.deck.length ? (deckIdx + 1) : 0;
    posText = `${t.cardLabel} ${pos} / ${state.deck.length || 0}`;
    const cp = $("#cardPos");
    if (cp) cp.textContent = posText;
  }

  const idxShown = (state.revealed && state.freezeIdx != null) ? state.freezeIdx : idxNow;
  const card = state.filtered[idxShown];
  state.currentIdx = idxNow;

  const wrap = document.createElement("div");

  const header = document.createElement("div");
  header.className = "flex flex-wrap items-center justify-between gap-2 mb-2";

  const headerLeft = document.createElement("div");
  headerLeft.className = "flex flex-wrap items-center gap-2 text-xs text-slate-500";
  const posSpan = document.createElement("span");
  posSpan.textContent = posText;
  headerLeft.appendChild(posSpan);

  const headerRight = document.createElement("div");
  headerRight.className = "flex items-center gap-2";

  const seg = document.createElement("div");
  seg.className = "seg";

  const mkSegBtn = (labelText, value) => {
    const b = document.createElement("button");
    b.type = "button";
    const on = state.practiceMode === value;
    b.className = `seg-btn ${on ? "is-on" : ""}`;
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.title = (value === "shuffle") ? (t.shuffleModeDesc || "") : (t.smartModeDesc || "");
    b.textContent = String(labelText).toUpperCase();
    b.onclick = () => {
      if (state.practiceMode === value) return;
      state.practiceMode = value;
      saveLS(PRACTICE_MODE_LS_KEY, state.practiceMode);
      rebuildDeck();
      render();
    };
    return b;
  };

  seg.append(
    mkSegBtn(t.shuffleModeShort, "shuffle"),
    mkSegBtn(t.smartModeShort, "smart")
  );

  headerRight.appendChild(seg);
  header.append(headerLeft, headerRight);

  const summary = document.createElement("div");
  summary.className = "flex flex-wrap items-center gap-2 mb-4";

  const addChip = (text, onClear) => {
    const c = document.createElement("button");
    c.type = "button";
    c.className = "chip";
    c.innerHTML = `<span>${esc(text)}</span>`;
    if (onClear) {
      const x = document.createElement("span");
      x.className = "ml-1";
      x.textContent = "✕";
      c.appendChild(x);
      c.onclick = onClear;
      c.style.cursor = "pointer";
    } else {
      c.style.cursor = "default";
    }
    return c;
  };

  const anyRestriction =
    (state.families.length && state.families.length < 4) ||
    (state.outcomes.length && state.outcomes.length < 4) ||
    state.categories.length ||
    (state.triggerQuery && state.triggerQuery.trim()) ||
    state.nilOnly ||
    (state.activePreset && state.activePreset.trim());

  if (anyRestriction) {
    if (state.activePreset) {
      const p = PRESET_DEFS[state.activePreset];
      if (p) summary.appendChild(addChip((LABEL[lang].presets[p.titleKey]), null));
    }

    if (state.families.length && state.families.length < 4) {
      state.families.forEach(f => summary.appendChild(addChip(label("rulefamily", f))));
    }
    if (state.outcomes.length && state.outcomes.length < 4) {
      state.outcomes.forEach(o => summary.appendChild(addChip(label("rulefamily", o))));
    }
    if (state.categories.length) {
      state.categories.forEach(ca => summary.appendChild(addChip(label("categories", ca))));
    }
    if (state.triggerQuery && state.triggerQuery.trim()) {
      summary.appendChild(addChip(`${LABEL[lang].triggerChip}: ${state.triggerQuery.trim()}`));
    }
    if (state.nilOnly) summary.appendChild(addChip(label("headings", "nilOnly")));

    summary.appendChild(addChip(lang === "cy" ? "Clirio" : "Clear", () => {
      clearPresetLayer();
      state.families = ["Soft","Aspirate","Nasal","None"];
      state.categories = [];
      state.outcomes = ["SM","AM","NM","NONE"];
      state.triggerQuery = "";
      state.nilOnly = false;
      saveLS("wm_families", state.families);
      saveLS("wm_categories", state.categories);
      saveLS("wm_outcomes", state.outcomes);
      saveLS("wm_trig", state.triggerQuery);
      saveLS("wm_nil", state.nilOnly);
      applyFilters(); rebuildDeck(); render(); updatePresetActiveClasses();
    }));
  } else {
    summary.classList.add("hidden");
  }

  const instruction = document.createElement("div");
  instruction.className = "practice-instruction text-lg md:text-xl text-slate-700 mb-6";
  instruction.textContent = t.instruction;

  const chips = document.createElement("div");
  chips.className = "practice-base text-2xl md:text-3xl font-medium";

  const capsule = document.createElement("div");
  capsule.className = "inline-flex items-baseline bg-indigo-100 ring-1 ring-indigo-300 rounded-2xl px-5 py-2.5 shadow-sm";
  capsule.style.position = "relative";

  const baseSpan = document.createElement("span");
  baseSpan.className = "base-word-text text-indigo-900 text-3xl md:text-4xl font-bold tracking-tight";
  baseSpan.textContent = (card.Base || "—");

  capsule.appendChild(baseSpan);
  chips.appendChild(capsule);
  mountBaseTranslationUI(capsule, card);

  const row = document.createElement("div");
  row.className = "practice-sentence";
  row.innerHTML = `
    <div class="practice-sentenceLine flex flex-wrap items-baseline gap-2 text-xl md:text-2xl">
      <span class="text-slate-600">${esc(card.Before || "")}</span>
      <input id="answerBox"
             class="border-2 border-slate-300 focus:border-cyan-600 outline-none bg-amber-50 px-3 py-2 rounded-xl text-2xl md:text-3xl leading-tight shadow-sm w-auto md:w-60 flex-shrink-0"
             placeholder="${esc(t.answerLabel)}"
             aria-label="${esc(t.answerLabel)}" />
      <span class="text-slate-600">${esc(card.After || "")}</span>
    </div>
  `;

  const actions = document.createElement("div");
  actions.className = "practice-actions flex flex-wrap gap-3";

  const main = document.createElement("div");
  main.className = "practice-actions-main";

  const aux = document.createElement("div");
  aux.className = "practice-actions-aux";

  const onCheck = () => {
    const ok = normalize(state.guess) === normalize(card.Answer);
    state.revealed = true;
    state.lastResult = ok ? "correct" : "wrong";
    state.freezeIdx = idxNow;
    state.freezePos = state.currentDeckPos;

    const shownIdx = idxShown;
    const shownCard = state.filtered[shownIdx];
    const cardId = getCardId(shownCard, shownIdx);

    const rec = {
      t: Date.now(),
      ok,
      key: `${shownCard.RuleCategory}:${shownCard.Trigger}:${shownCard.Base}`,
      cardId,
      expected: shownCard.Answer,
      got: state.guess,
      mode: state.practiceMode
    };
    state.history = [rec, ...state.history].slice(0, 500);
    saveLS("wm_hist", state.history);

    updateLeitner(cardId, ok ? "correct" : "wrong");
    if (!ok && state.practiceMode === "smart") {
      state.smartQueue.push({ idx: shownIdx, dueAfter: 2 });
    }

    const ab2 = $("#answerBox");
    if (ab2) {
      ab2.disabled = true;
      ab2.classList.add("opacity-70", "cursor-not-allowed");
    }
    render();
    setTimeout(() => $("#inlineNext")?.focus({ preventScroll: true }), 0);
  };

  const btnCheck = btn(t.check, "btn-primary shadow", onCheck);
  btnCheck.id = "btnCheck";
  btnCheck.title = `${t.check} (Enter)`;

  const hint = document.createElement("div");
  hint.className = "hidden practice-hint text-sm text-slate-600";
  hint.innerHTML = `${esc(t.hint)}: starts with <b>${esc((card.Answer || "").slice(0, 1) || "?")}</b>`;

  const btnHint = btn(t.hint, "btn-ghost", () => {
    hint.classList.toggle("hidden");
    $("#answerBox")?.focus();
  });
  btnHint.id = "btnHint";
  btnHint.title = `${t.hint} (H)`;

  const btnReveal = btn(t.reveal, "btn-ghost", () => {
    state.revealed = !state.revealed;
    render();
  });

  const btnSkip = btn(t.skip, "btn-ghost", () => {
    state.guess = "";
    state.revealed = true;
    state.lastResult = "skipped";
    state.freezeIdx = idxNow;
    state.freezePos = state.currentDeckPos;

    const shownIdx = idxShown;
    const shownCard = state.filtered[shownIdx];
    const cardId = getCardId(shownCard, shownIdx);

    state.history = [{
      t: Date.now(),
      ok: false,
      key: `${shownCard.RuleCategory}:${shownCard.Trigger}:${shownCard.Base}`,
      cardId,
      expected: shownCard.Answer,
      got: "",
      mode: state.practiceMode,
      skipped: true,
    }, ...state.history].slice(0, 500);
    saveLS("wm_hist", state.history);

    updateLeitner(cardId, "skipped");
    if (state.practiceMode === "smart") {
      state.smartQueue.push({ idx: shownIdx, dueAfter: 2 });
    }

    const ab2 = $("#answerBox");
    if (ab2) {
      ab2.disabled = true;
      ab2.classList.add("opacity-70", "cursor-not-allowed");
    }

    render();
  });

  const btnShuffle = document.createElement("button");
  btnShuffle.type = "button";
  btnShuffle.className = "btn btn-shuffle";
  btnShuffle.title = t.shuffleNowDesc || "";
  btnShuffle.innerHTML = `<span aria-hidden="true">🔀</span><span>${esc(t.shuffleNow)}</span>`;
  btnShuffle.onclick = () => { rebuildDeck(); render(); };

  main.append(btnCheck, btnHint, btnReveal, btnSkip);
  aux.append(btnShuffle);
  actions.append(main, aux);

  const feedback = document.createElement("div");
  feedback.className = "practice-feedback";
  feedback.setAttribute("aria-live", "polite");

  if (state.revealed) {
    const ok = state.lastResult === "correct";
    const skipped = state.lastResult === "skipped";

    const statusIcon = skipped ? "⏭️" : (ok ? "✅" : "❌");
    const statusColor = skipped ? "text-slate-800" : (ok ? "text-indigo-900" : "text-rose-900");
    const statusText = skipped ? t.statuses.skipped : (ok ? t.statuses.correct : t.statuses.wrong);

    feedback.innerHTML = `
      <div class="feedback-box">
        <div class="flex items-center gap-2 ${statusColor} text-2xl md:text-3xl font-semibold">
          ${statusIcon} ${esc(statusText)}
        </div>

        ${(!ok && !skipped)
          ? `<div class="mt-1 text-slate-700">${esc(t.youTyped)}: <b>${esc(state.guess) || esc(t.blank)}</b></div>`
          : ""
        }

        <div class="mt-4 text-slate-800 text-xl md:text-2xl flex items-baseline flex-wrap gap-x-3 gap-y-2">
          <span>${esc(card.Before || "")}</span>
          <span class="font-semibold bg-indigo-100 text-indigo-900 px-1 rounded">${esc(card.Answer)}</span>
          <span>${esc(card.After || "")}</span>

          <button id="btnHear" class="btn-hear" type="button">
            <span class="icon" aria-hidden="true">▶︎</span>
            <span>${esc(t.hear)}</span>
          </button>
        </div>

        ${(() => {
          const whyText = (state.lang === "cy" ? (card.WhyCym || card.Why) : card.Why) || "";
          return whyText ? `<div class="mt-4 text-slate-700">${esc(whyText)}</div>` : "";
        })()}

        <div class="mt-4 flex justify-end">
          <button id="inlineNext"
                  class="btn btn-primary shadow transition"
                  type="button"
                  title="${esc(t.next)} (Enter)">
            ${esc(t.next)}
          </button>
        </div>
      </div>
    `;

    setTimeout(() => {
      const hearBtn = $("#btnHear");
      if (hearBtn) {
        hearBtn.onclick = async () => {
          try {
            const sentence = buildCompleteSentence({ Before: card.Before, Answer: card.Answer, After: card.After });
            await playPollySentence(sentence);
          } catch (e) {
            alert("Couldn't play audio: " + (e?.message || e));
          }
        };
      }
      $("#inlineNext")?.addEventListener("click", () => nextCard(1));
    }, 0);
  }

  const answerBlock = document.createElement("div");
  answerBlock.className = "practice-answerBlock";
  answerBlock.append(row, actions, hint, feedback);

  wrap.append(header, summary, instruction, chips, answerBlock);
  host.appendChild(wrap);

  const ab = $("#answerBox");
  if (ab) {
    ab.value = state.guess;
    ab.focus();
    ab.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); onCheck(); }
    });
    ab.addEventListener("input", (e) => { state.guess = e.target.value; });
  }
}

function renderBrowse() {
  const head = $("#browseHead");
  const body = $("#browseBody");
  if (!head || !body) return;

  head.innerHTML = "";
  body.innerHTML = "";
  const cols = ["RuleFamily","RuleCategory","Trigger","Base","WordCategory","Before","After","Answer","Outcome","Why"];

  for (const h of cols) {
    const th = document.createElement("th");
    th.className = "text-left p-2 border-b";
    th.textContent = h;
    head.appendChild(th);
  }

  state.filtered.forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.className = (i % 2 ? "bg-white" : "bg-slate-50");
    for (const k of cols) {
      const td = document.createElement("td");
      td.className = "p-2 align-top";
      td.textContent = (k === "Outcome" ? (r[k] || "").toUpperCase() : (r[k] || ""));
      if (k === "Answer") td.classList.add("font-semibold");
      if (k === "Why") td.classList.add("text-slate-600");
      tr.appendChild(td);
    }
    body.appendChild(tr);
  });
}

function computeStats() {
  const total = state.history.length;
  const correct = state.history.filter(h => h.ok).length;
  const acc = total ? Math.round((correct / total) * 100) : 0;

  const by = {};
  for (const h of state.history) {
    const r = state.rows.find(r => `${r.RuleCategory}:${r.Trigger}:${r.Base}` === h.key);
    const out = (r?.Outcome || "?").toUpperCase();
    by[out] = by[out] || { total: 0, ok: 0 };
    by[out].total++;
    if (h.ok) by[out].ok++;
  }
  return { total, correct, acc, by };
}

function renderStatsPanels() {
  const s = computeStats();

  if ($("#accBig")) $("#accBig").textContent = `${s.acc}%`;
  if ($("#accText")) $("#accText").textContent = `${s.correct} / ${s.total} correct`;
  if ($("#statsAcc")) $("#statsAcc").textContent = `${s.acc}%`;
  if ($("#statsText")) $("#statsText").textContent = `${s.correct} correct out of ${s.total}`;

  const ul1 = $("#byOutcome");
  const ul2 = $("#statsByOutcome");
  if (ul1) ul1.innerHTML = "";
  if (ul2) ul2.innerHTML = "";

  for (const [k, v] of Object.entries(s.by)) {
    const li1 = document.createElement("li");
    li1.className = "flex justify-between";
    li1.innerHTML = `<span>${esc(k)}</span><span class="text-slate-600">${v.ok}/${v.total}</span>`;
    ul1?.appendChild(li1);

    const li2 = document.createElement("li");
    li2.className = "flex justify-between";
    li2.innerHTML = `<span>${esc(k)}</span><span class="text-slate-600">${v.ok}/${v.total}</span>`;
    ul2?.appendChild(li2);
  }
}

function render() {
  $("#practiceView")?.classList.toggle("hidden", state.mode !== "practice");
  $("#browseView")?.classList.toggle("hidden", state.mode !== "browse");
  $("#statsView")?.classList.toggle("hidden", state.mode !== "stats");

  renderPractice();
  if (state.mode === "browse") renderBrowse();
  renderStatsPanels();

  // Keep preset buttons visually correct
  updatePresetActiveClasses();
}

function nextCard(offset = 1) {
  if (state.practiceMode === "smart") {
    if (!state.filtered.length) return;
    state.freezeIdx = null;
    state.freezePos = null;
    state.smartIdx = pickNextSmartIdx();
    state.smartCount = (state.smartCount || 0) + 1;
    state.guess = "";
    state.revealed = false;
    state.lastResult = null;
    render();
    return;
  }

  if (!state.deck.length) return;

  if (state.lastResult === "wrong" && state.freezeIdx != null && state.freezePos != null) {
    const idxVal = state.freezeIdx;
    let deckPos = state.freezePos;
    if (state.deck[deckPos] !== idxVal) deckPos = state.deck.indexOf(idxVal);
    if (deckPos >= 0) {
      const newDeck = state.deck.slice();
      newDeck.splice(deckPos, 1);
      const insertAt = Math.min(deckPos + 3, newDeck.length);
      newDeck.splice(insertAt, 0, idxVal);
      state.deck = newDeck;
    }
  }

  state.freezeIdx = null;
  state.freezePos = null;
  state.p = (state.p + offset + state.deck.length) % state.deck.length;
  state.guess = "";
  state.revealed = false;
  state.lastResult = null;
  render();
}

/* ========= Event wiring ========= */
function wireUi() {
  // NOTE: Do NOT bind #btnLangToggle here. navbar.js owns it.

  $("#onboardDismiss")?.addEventListener("click", () => $("#onboard")?.classList.add("hidden"));

  $("#btnResetStats")?.addEventListener("click", () => {
    state.history = [];
    saveLS("wm_hist", state.history);
    renderStatsPanels();
    render();
  });

  $("#btnResetStats2")?.addEventListener("click", () => {
    state.history = [];
    saveLS("wm_hist", state.history);
    renderStatsPanels();
    render();
  });

  $("#btnTop")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  document.addEventListener("keydown", (e) => {
    const tag = (e.target && e.target.tagName) || "";
    if (["INPUT", "TEXTAREA"].includes(tag.toUpperCase())) return;
    if (state.mode !== "practice") return;

    if (e.key === "Enter") {
      e.preventDefault();
      if (!state.revealed) $("#btnCheck")?.click();
      else $("#inlineNext")?.click();
    } else if (e.key.toLowerCase() === "n") {
      $("#inlineNext")?.click();
    } else if (e.key.toLowerCase() === "h") {
      $("#btnHint")?.click();
    } else if (e.key.toLowerCase() === "s") {
      nextCard(1);
    }
  });

  $("#mbCheck")?.addEventListener("click", () => $("#btnCheck")?.click());
  $("#mbNext")?.addEventListener("click", () => $("#inlineNext")?.click() || nextCard(1));
  $("#mbHint")?.addEventListener("click", () => $("#btnHint")?.click());

  if (state.admin) {
    $("#adminPanel")?.classList.remove("hidden");

    const dataUrl = $("#dataUrl");
    if (dataUrl) dataUrl.value = getParam("sheet") || "";

    $("#btnLoadUrl")?.addEventListener("click", async () => {
      const u = ($("#dataUrl")?.value || "").trim();
      if (!u) return;
      const d = await loadCsvUrl(u);
      // Stamp source
      d.forEach(row => { if (row && typeof row === "object") row.__src = u; });

      state.rows = d.map(r => {
        const m = coerceRow(r);
        m.Source = u;
        m.TriggerCanon = canonicalTrigger(m.Trigger);
        return m;
      });

      clearPresetLayer();
      applyFilters(); rebuildDeck(); buildFiltersUI(); render();
    });

    $("#btnShareable")?.addEventListener("click", () => {
      const u = ($("#dataUrl")?.value || "").trim();
      if (!u) return alert("Enter a URL first.");
      const link = location.origin + location.pathname + `?sheet=${encodeURIComponent(u)}`;
      navigator.clipboard?.writeText(link);
      alert("Copied: " + link);
    });

    $("#btnExportMisses")?.addEventListener("click", () => {
      const misses = state.history.filter(h => !h.ok);
      const lines = ["RuleCategory,Trigger,Base,Expected,Got,When"];
      for (const m of misses) {
        const [cat, trig, base] = (m.key || "").split(":");
        lines.push([cat, trig, base, m.expected, m.got, new Date(m.t).toISOString()]
          .map(s => `"${(s || "").replaceAll('"','""')}"`).join(","));
      }
      download(lines.join("\n"), "mutation-trainer-misses.csv", "text/csv");
    });

    $("#fileCsv")?.addEventListener("change", (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      Papa.parse(f, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          res.data.forEach(row => { if (row && typeof row === "object") row.__src = f.name; });
          state.rows = res.data.map(r => {
            const m = coerceRow(r);
            m.Source = f.name;
            m.TriggerCanon = canonicalTrigger(m.Trigger);
            return m;
          });
          clearPresetLayer();
          applyFilters(); rebuildDeck(); buildFiltersUI(); render();
        }
      });
    });
  }
}

/* ========= Boot ========= */
(async function boot() {
  wireUi();
  await initData();

  // Apply current language immediately (navbar.js also applies [data-lang] visibility)
  syncLangFromNavbar();

  // Ensure labels render even if language was already correct
  applyLanguage();
})();


