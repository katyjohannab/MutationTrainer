
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
function download(text, filename, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
function getParam(k) { return new URLSearchParams(location.search).get(k); }
function saveLS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function loadLS(k, d) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : d; } catch (e) { return d; } }

function formatTpl(tpl, vars) {
  const s = (tpl == null ? "" : String(tpl));
  return s.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars?.[k];
    return (v == null) ? "" : String(v);
  });
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

/* ========= Smart review (Leitner) ========= */
const LEITNER_LS_KEY = "wm_leitner_boxes_v1";
const PRACTICE_MODE_LS_KEY = "wm_practice_mode_v1";

/* ========= Session stats (device-local) ========= */
const SESSION_LS_KEY = "wm_session_v1";
const SESSION_POINTS_PER_CORRECT = 10;

function bumpSessionBucket(bucket, key, ok) {
  if (!bucket || typeof bucket !== "object") return;
  const k = (key == null ? "" : String(key)).trim() || "Unknown";
  if (!bucket[k]) bucket[k] = { done: 0, correct: 0 };
  bucket[k].done = (bucket[k].done || 0) + 1;
  if (ok) bucket[k].correct = (bucket[k].correct || 0) + 1;
}

function defaultSession() {
  return {
    startedAt: Date.now(),
    done: 0,
    correct: 0,
    points: 0,
    streak: 0,
    bestStreak: 0,
    byOutcome: {},
    byCategory: {},
  };
}

function loadSession() {
  const toInt = (v, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : d;
  };
  const fixBuckets = (obj) => {
    const out = {};
    if (!obj || typeof obj !== "object") return out;
    for (const [k, v] of Object.entries(obj)) {
      if (!v || typeof v !== "object") continue;
      out[k] = { done: toInt(v.done), correct: toInt(v.correct) };
    }
    return out;
  };

  const raw = loadLS(SESSION_LS_KEY, null);
  if (!raw || typeof raw !== "object") {
    const fresh = defaultSession();
    saveSession(fresh);
    return fresh;
  }

  const sess = defaultSession();
  sess.startedAt = Number.isFinite(Number(raw.startedAt)) ? Number(raw.startedAt) : sess.startedAt;
  sess.done = toInt(raw.done);
  sess.correct = toInt(raw.correct);
  sess.points = toInt(raw.points);
  sess.streak = toInt(raw.streak);
  sess.bestStreak = toInt(raw.bestStreak);
  sess.byOutcome = fixBuckets(raw.byOutcome);
  sess.byCategory = fixBuckets(raw.byCategory);

  // Persist any repaired/defaulted fields back to storage.
  saveSession(sess);
  return sess;
}

function saveSession(sess) {
  if (!sess || typeof sess !== "object") return;
  saveLS(SESSION_LS_KEY, sess);
}

function resetSession() {
  const fresh = defaultSession();
  saveSession(fresh);
  // Safe: state is defined later; this will only run after init.
  try {
    if (typeof state === "object" && state) state.session = fresh;
  } catch (e) {}
  return fresh;
}

function resetStreak(sess) {
  const s = (sess && typeof sess === "object") ? sess : (state?.session || null);
  if (!s) return null;
  s.streak = 0;
  saveSession(s);
  return s;
}

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

  return {
    CardId: getVal(r, ["CardId","Card ID","ID","Id","id","cardId","card_id"]) || "",
    RuleFamily: fam,
    RuleCategory: getVal(r, ["RuleCategory","Rule Category","Category"]) || (PREP.has((trig || "").toLowerCase()) ? "Preposition" : ""),
    Trigger: trig,
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
  rows: [],
  filtered: [],
  families: loadLS("wm_families", ["Soft","Aspirate","Nasal","None"]),
  categories: loadLS("wm_categories", []),
  outcomes: loadLS("wm_outcomes", ["SM","AM","NM","NONE"]),
  triggerQuery: loadLS("wm_trig", ""),
  nilOnly: loadLS("wm_nil", false),
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
  usedRevealThisCard: false,
  lastResult: null,
  history: loadLS("wm_hist", []),
  session: loadSession(),
  admin: getParam("admin") === "1",
  freezeIdx: null,
  freezePos: null,
  lang: wmGetLangLocal(),   // IMPORTANT: read same as navbar.js
  currentIdx: 0,
  currentDeckPos: -1,
};

/* ========= UI Translations ========= */
const LABEL = {
  en: {
    headings: { focus:"Focus", rulefamily:"RuleFamily", outcome:"Outcome", categories:"Categories", trigger:"Filter by Trigger", nilOnly:"Nil-cases only (no mutation expected)" },
    categories: {
      All:"All","Adjective+Noun":"Adjective+Noun",Article:"Article","Bod+yn":"Bod+Yn",Complement:"Complement",Conjunction:"Conjunction",
      Deictic:"Deictic",Determiner:"Determiner",Intensifier:"Intensifier",Interrogative:"Interrogative",Idiom: "Idiom",Negation:"Negation",Numerals:"Numerals",
      Particle:"Particle",PlaceName:"PlaceName",Possessive:"Possessive",Preposition:"Preposition",Presentative:"Presentative",Relative:"Relative",
      SubjectBoundary:"SubjectBoundary",Subordinator:"Subordinator",TimeExpressions:"TimeExpressions"
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
    resetStats:"Clear device stats",
    backToTop:"Back to top",

    // Session panel (practice sidebar)
    sessionTitle:"This session",
    sessionNew:"New",
    sessionAccuracy:"Accuracy",
    sessionStreak:"Streak",
    sessionResetStreak:"Reset streak",
    sessionBestFmt:"Best: {n}",
    sessionCard:"Card",
    sessionUseNewHint:"Use New to start a fresh run.",
    sessionMasteryFocus:"Mastery (this focus)",
    sessionMasteredFmt:"Mastered: {mastered} / {pool}",
    sessionBox1Fmt:"Box 1: {n}",
    sessionMoreInfo:"More info",
    sessionByOutcome:"By outcome",
    sessionLegendHtml:"Legend: <b>SM</b>=Soft, <b>AM</b>=Aspirate, <b>NM</b>=Nasal, <b>NONE</b>=No mutation",
    sessionByCategory:"By category",
    sessionOther:"Other",
    sessionCorrectFmt:"{correct} / {done} correct",

    // Preset + focus labels
    startHereTitle: "Start here",
    presetStarterPreps: "Starter prepositions",
    presetStarterPrepsDesc: "Core / starter set of common prepositions",
    presetNumbers: "Numbers 1–10",
    presetNumbersDesc: "Practice numbers one to ten",
    presetArticles: "Articles",
    presetArticlesDesc: "Practice the definite article with common nouns",
    presetPlaceNames: "Place names",
    presetPlaceNamesDesc: "Practice mutations after place names",
    advancedFiltersTitle: "Advanced filters",
    commonCategoriesTitle: "Categories",
    advancedCategoriesTitle: "Categories",
    presetSoftBasics: "Soft basics",
    presetSoftBasicsDesc: "Soft mutation basics (common structures)",
  },
  cy: {
    headings: { focus:"Ffocws", rulefamily:"Math Treiglad", outcome:"Canlyniad", categories:"Categorïau", trigger:"Hidlo yn ôl y sbardun", nilOnly:"Achosion dim-treiglad yn unig (dim treiglad disgwyliedig)" },
    categories: {
      All:"Pob un","Adjective+Noun":"Ansoddair+Enw",Article:"Erthygl","Bod+yn":"Bod+Yn",Complement:"Cyflenwad",Conjunction:"Cysylltair",
      Deictic:"Deictig",Determiner:"Penderfyniadur",Idiom:"Idiom",Intensifier:"Dwysydd",Interrogative:"Holiadol",Negation:"Negydd",Numerals:"Rhifau",
      Particle:"Gronyn",PlaceName:"Enw lle",Possessive:"Meddiannol",Preposition:"Arddodiad",Presentative:"Cyflwyniadur",Relative:"Perthynol",
      SubjectBoundary:"Ar ôl pwnc",Subordinator:"Isgysylltair",TimeExpressions:"Mynegiadau Amser"
    },
    rulefamily: { Soft:"Meddal", Aspirate:"Llaes", Nasal:"Trwynol", None:"Dim", SM:"Meddal", AM:"Llaes", NM:"Trwynol", NONE:"Dim" },
    instruction: "Teipiwch y ffurf gywir. Os nad oes treiglad, ailysgrifennwch y ffurf wreiddiol.",
    hint:"Awgrym", reveal:"Datgelu", skip:"Hepgor", check:"Gwirio", next:"Nesaf",
    shuffleModeDesc:"Adolygu ar hap: mae cardiau’n ymddangos mewn trefn wirioneddol ar hap.",
    smartModeDesc:"Adolygu clyfar: addasu i’ch cynnydd a phwysleisio camgymeriadau; mae’n ailadrodd cardiau anghywir yn amlach.",
    shuffleNowDesc:"Ailgymysgu’r dec presennol (yn ddefnyddiol os ydych chi’n gweld yr un cardiau dro ar ôl tro).",
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
    resetStats:"Clirio ystadegau'r ddyfais",
    backToTop:"Yn ôl i’r brig",

    // Panel sesiwn (bar ochr ymarfer)
    sessionTitle:"Y sesiwn hon",
    sessionNew:"Newydd",
    sessionAccuracy:"Cywirdeb",
    sessionStreak:"Rhediad",
    sessionResetStreak:"Ailosod y rhediad",
    sessionBestFmt:"Gorau: {n}",
    sessionCard:"Cerdyn",
    sessionUseNewHint:"Defnyddiwch Newydd i ddechrau rhediad newydd.",
    sessionMasteryFocus:"Meistrolaeth (y ffocws hwn)",
    sessionMasteredFmt:"Wedi meistroli: {mastered} / {pool}",
    sessionBox1Fmt:"Blwch 1: {n}",
    sessionMoreInfo:"Rhagor o wybodaeth",
    sessionByOutcome:"Yn ôl canlyniad",
    sessionLegendHtml:"Allwedd: <b>SM</b>=Meddal, <b>AM</b>=Llaes, <b>NM</b>=Trwynol, <b>NONE</b>=Dim treiglad",
    sessionByCategory:"Yn ôl categori",
    sessionOther:"Arall",
    sessionCorrectFmt:"{correct} / {done} yn gywir",

    // Preset + focus labels
    startHereTitle: "Dechreuwch yma",
    presetStarterPreps: "Arddodiaid cychwynnol",
    presetStarterPrepsDesc: "Set cychwynnol o arddodiaid cyffredin",
    presetNumbers: "Rhifau 1–10",
    presetNumbersDesc: "Ymarfer rhifau un i ddeg",
    presetArticles: "Erthyglau",
    presetArticlesDesc: "Ymarfer yr erthygl ddiffiniol gyda enwau cyffredin",
    presetPlaceNames: "Enwau lleoedd",
    presetPlaceNamesDesc: "Ymarfer treigladau ar ôl enwau lleoedd",
    advancedFiltersTitle: "Hidlau uwch",
    commonCategoriesTitle: "Categorïau",
    advancedCategoriesTitle: "Categorïau",
    presetSoftBasics: "Meddal sylfaenol",
    presetSoftBasicsDesc: "Elfennau sylfaenol treiglad meddal (strwythurau cyffredin)",
  }
};

function label(section, key) {
  const lang = state.lang || "en";
  return (LABEL?.[lang]?.[section]?.[key]) || key;
}

/* IMPORTANT: This does NOT toggle the navbar. navbar.js owns that.
   This only updates ynamic UI and labels to match state.lang. */
function applyLanguage() {
  const lang = (state.lang === "cy" ? "cy" : "en");

  // keep html lang in sync (navbar.js also sets it, but harmless)
  document.documentElement.setAttribute("lang", lang);

  if ($("#focusTitle")) $("#focusTitle").textContent = LABEL[lang].headings.focus;
  if ($("#rulefamilyTitle")) $("#rulefamilyTitle").textContent = LABEL[lang].headings.rulefamily;
  if ($("#outcomeTitle")) $("#outcomeTitle").textContent = LABEL[lang].headings.outcome;
  if ($("#categoriesTitle")) $("#categoriesTitle").textContent = LABEL[lang].headings.categories;
  if ($("#triggerLabel")) $("#triggerLabel").textContent = LABEL[lang].headings.trigger;
  if ($("#nilOnlyText")) $("#nilOnlyText").textContent = LABEL[lang].headings.nilOnly;

  const dismiss = $("#onboardDismiss");
  if (dismiss) dismiss.textContent = LABEL[lang].onboardDismiss;

  if ($("#btnResetStats")) $("#btnResetStats").textContent = LABEL[lang].resetStats;
  if ($("#btnResetStats2")) $("#btnResetStats2").textContent = LABEL[lang].resetStats;
  if ($("#btnTop")) $("#btnTop").textContent = LABEL[lang].backToTop;

  // ---- Session panel static labels (practice sidebar) ----
  const sp = $("#sessionPanel");
  if (sp) {
    // Header title
    const headerRow = sp.querySelector(":scope > div.flex.items-center.justify-between");
    const titleEl = headerRow?.querySelector(":scope > div.text-sm.font-medium");
    if (titleEl) titleEl.textContent = LABEL[lang].sessionTitle;

    // Header buttons
    if ($("#btnNewSession")) $("#btnNewSession").textContent = LABEL[lang].sessionNew;

    const rs = $("#btnResetStreak");
    if (rs) {
      rs.title = LABEL[lang].sessionResetStreak;
      rs.setAttribute("aria-label", LABEL[lang].sessionResetStreak);
    }

    // Tile headings
    const accBig = $("#accBig");
    if (accBig) {
      const tile = accBig.closest("div.p-3") || accBig.parentElement;
      const h = tile?.querySelector(":scope > div");
      if (h) h.textContent = LABEL[lang].sessionAccuracy;
    }

    if (rs) {
      const h = rs.parentElement?.querySelector(":scope > div");
      if (h) h.textContent = LABEL[lang].sessionStreak;
    }

    const cardPos = $("#cardPos");
    if (cardPos) {
      const tile = cardPos.closest("div.p-3") || cardPos.parentElement;
      const h = tile?.querySelector(":scope > div");
      if (h) h.textContent = LABEL[lang].sessionCard;
      const hint = tile?.querySelector(":scope > div.text-xs");
      if (hint) hint.textContent = LABEL[lang].sessionUseNewHint;
    }

    // Mastery label
    const masteryText = $("#masteryText");
    if (masteryText) {
      const row = masteryText.parentElement;
      const h = row?.querySelector(":scope > div");
      if (h) h.textContent = LABEL[lang].sessionMasteryFocus;
    }

    // Details labels
    const sum = sp.querySelector("details > summary");
    if (sum) sum.textContent = LABEL[lang].sessionMoreInfo;

    const byOutcome = $("#byOutcome");
    if (byOutcome) {
      const h = byOutcome.previousElementSibling;
      if (h) h.textContent = LABEL[lang].sessionByOutcome;
      const legend = byOutcome.nextElementSibling;
      if (legend) legend.innerHTML = LABEL[lang].sessionLegendHtml;
    }

    const byCat = $("#sessByCategory");
    if (byCat) {
      const h = byCat.previousElementSibling;
      if (h) h.textContent = LABEL[lang].sessionByCategory;
    }
  }

  // ----- Phase 1: Presets & Focus translation -----
  // Presets section labels (Start here)
  const presetsTitle = $("#presetsTitle");
  if (presetsTitle) presetsTitle.textContent = LABEL[lang].startHereTitle || "Start here";
  // Advanced filters summary text
  const advToggle = $("#advToggle");
  if (advToggle) advToggle.textContent = LABEL[lang].advancedFiltersTitle || "Advanced filters";
  // Basic categories heading
  const basicCatTitle = $("#basicCategoriesTitle");
  if (basicCatTitle) basicCatTitle.textContent = LABEL[lang].commonCategoriesTitle || LABEL[lang].headings.categories;
  // Advanced categories heading
  const advCatTitle = $("#advCategoriesTitle");
  if (advCatTitle) advCatTitle.textContent = LABEL[lang].advancedCategoriesTitle || LABEL[lang].headings.categories;

  buildFilters();
  render();
}

function syncLangFromNavbar() {
  const lang = wmGetLangLocal();
  if (lang !== "en" && lang !== "cy") return;
  state.lang = lang;
  applyLanguage(); // this rebuilds your dynamic UI with the right labels
}

// Listen for clicks on the navbar language toggle.
// Use CAPTURE so we can run after navbar.js has handled the click.
document.addEventListener("click", (e) => {
  const btn = e.target?.closest?.("#btnLangToggle");
  if (!btn) return;

  // navbar.js will update localStorage + hide/show [data-lang] immediately.
  // Then we sync our dynamic UI right after.
  setTimeout(syncLangFromNavbar, 0);
}, true);


/* ========= Data loading (index list) ========= */
const FALLBACK_INDEX_URL = "https://katyjohannab.github.io/mutationtrainer/data/index.json";
const FALLBACK_SITE_ROOT = "https://katyjohannab.github.io/mutationtrainer/";

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
    try {
      list = await fetchIndexList(FALLBACK_INDEX_URL);
      usingFallbackRoot = true;
    } catch (e2) {
      console.warn("Failed to load both local and fallback index.json", e, e2);
      return [];
    }
  }

  const root = usingFallbackRoot ? FALLBACK_SITE_ROOT : new URL(".", location.href).toString();
  let merged = [];
  for (const p of list) {
    const url = resolveFromRoot(p, root);
    if (!url) continue;
    try {
      const d = await loadCsvUrl(url);
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

  const expected = ["CardId","RuleFamily","RuleCategory","Trigger","Base","WordCategory","Translate","Before","After","Answer","Outcome","Why","WhyCym"];
  const cleaned = rows.map(r => {
    const m = coerceRow(r);
    const o = {};
    for (const k of expected) o[k] = (m?.[k] ?? "").toString().trim();
    return o;
  });

  state.rows = cleaned;

  applyFilters();
  rebuildDeck();
  buildFilters();
  render();
}

/* ========= Filters & Deck ========= */
function toggleBtn(text, active, onToggle) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = `pill ${active ? "pill-on" : ""}`;
  b.textContent = text;
  b.onclick = () => onToggle(!active);
  return b;
}
function buildFilters() {
  // ---- Phase 1: Build preset buttons ----
  buildPresetButtons();
  const cats = new Set();
  for (const r of state.rows) if (r.RuleCategory) cats.add(r.RuleCategory);
  const outcomes = ["SM","AM","NM","NONE"];

  const famEl = $("#familyBtns");
  if (famEl) {
    famEl.innerHTML = "";
    for (const f of ["Soft","Aspirate","Nasal","None"]) {
      const labelText = label("rulefamily", f);
      const b = toggleBtn(labelText, state.families.includes(f), (on) => {
        state.families = on ? Array.from(new Set([...state.families, f])) : state.families.filter(x => x !== f);
        saveLS("wm_families", state.families);
        applyFilters(); rebuildDeck(); buildFilters(); render();
      });
      b.dataset.key = f;
      famEl.appendChild(b);
    }
  }

  const outEl = $("#outcomeBtns");
  if (outEl) {
    outEl.innerHTML = "";
    const outcomeCounts = {};
    state.filtered.forEach(r => {
      const o = (r.Outcome || "").toUpperCase();
      if (!o) return;
      outcomeCounts[o] = (outcomeCounts[o] || 0) + 1;
    });
    for (const o of outcomes) {
      const count = outcomeCounts[o] || 0;
      const txt = `${o} (${count})`;
      outEl.appendChild(toggleBtn(txt, state.outcomes.includes(o), (on) => {
        state.outcomes = on ? Array.from(new Set([...state.outcomes, o])) : state.outcomes.filter(x => x !== o);
        saveLS("wm_outcomes", state.outcomes);
        applyFilters(); rebuildDeck(); buildFilters(); render();
      }));
    }
  }

  // ----- Phase 1: Categories -----
  // Basic (common) categories
  const basicCatEl = $("#basicCatBtns");
  if (basicCatEl) {
    basicCatEl.innerHTML = "";
    const commonCats = COMMON_CATEGORIES && COMMON_CATEGORIES.length ? COMMON_CATEGORIES : Array.from(cats).sort().slice(0, 8);
    for (const c of commonCats) {
      const active = (!state.categories.length) || state.categories.includes(c);
      const cLabel = label("categories", c);
      const b = toggleBtn(cLabel, active, (on) => {
        if (on) {
          state.categories = Array.from(new Set([...state.categories, c]));
        } else {
          state.categories = state.categories.filter(x => x !== c);
        }
        saveLS("wm_categories", state.categories);
        applyFilters(); rebuildDeck(); buildFilters(); render();
      });
      b.dataset.key = c;
      basicCatEl.appendChild(b);
    }
  }
  // Advanced categories (full list)
  const catEl = $("#catBtns");
  if (catEl) {
    catEl.innerHTML = "";
    const allCatsActive = !state.categories.length;
    const allLabel = label("categories", "All");
    const allBtn = toggleBtn(allLabel, allCatsActive, () => {
      state.categories = [];
      saveLS("wm_categories", state.categories);
      applyFilters(); rebuildDeck(); buildFilters(); render();
    });
    allBtn.dataset.key = "All";
    catEl.appendChild(allBtn);
    for (const c of Array.from(cats).sort()) {
      const active = state.categories.includes(c);
      const cLabel = label("categories", c);
      const b = toggleBtn(cLabel, active, (on) => {
        if (on) {
          state.categories = Array.from(new Set([...state.categories, c]));
        } else {
          state.categories = state.categories.filter(x => x !== c);
        }
        saveLS("wm_categories", state.categories);
        applyFilters(); rebuildDeck(); buildFilters(); render();
      });
      b.dataset.key = c;
      catEl.appendChild(b);
    }
  }

  const trig = $("#triggerFilter");
  if (trig) {
    trig.value = state.triggerQuery;
    trig.oninput = (e) => {
      state.triggerQuery = e.target.value;
      saveLS("wm_trig", state.triggerQuery);
      applyFilters(); rebuildDeck(); buildFilters(); render();
    };
  }

  const nil = $("#nilOnly");
  if (nil) {
    nil.checked = !!state.nilOnly;
    nil.onchange = (e) => {
      state.nilOnly = e.target.checked;
      saveLS("wm_nil", state.nilOnly);
      applyFilters(); rebuildDeck(); buildFilters(); render();
    };
  }
}

// ----- Phase 1: Common categories constant -----
// This list defines which categories appear in the basic focus section.
const COMMON_CATEGORIES = [
  "Preposition",
  "Article",
  "Bod+yn",
  "Numerals",
  "Possessive",
  "Adjective+Noun",
  "PlaceName",
  "Negation"
];

// ----- Phase 1: Preset handling -----
function buildPresetButtons() {
  const container = $("#presetBtns");
  if (!container) return;
  container.innerHTML = "";
  // Define presets with keys and translation keys
  const presets = [
    { id: "starter-preps", titleKey: "presetStarterPreps", descKey: "presetStarterPrepsDesc" },
    { id: "numbers-1-10", titleKey: "presetNumbers", descKey: "presetNumbersDesc" },
    { id: "articles", titleKey: "presetArticles", descKey: "presetArticlesDesc" },
    { id: "place-names", titleKey: "presetPlaceNames", descKey: "presetPlaceNamesDesc" },
  ];
  for (const p of presets) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "preset-card";
    btn.dataset.preset = p.id;
    const title = LABEL[state.lang || "en"]?.[p.titleKey] || p.id;
    const desc = LABEL[state.lang || "en"]?.[p.descKey] || "";
    btn.innerHTML = `<div class="preset-title">${esc(title)}</div><div class="preset-desc">${esc(desc)}</div>`;
    btn.addEventListener("click", () => {
      applyPreset(p.id);
    });
    container.appendChild(btn);
  }
}

function applyPreset(name) {
  // Reset filters first to defaults
  state.categories = [];
  state.families = ["Soft", "Aspirate", "Nasal", "None"];
  state.outcomes = ["SM", "AM", "NM", "NONE"];
  state.triggerQuery = "";
  state.nilOnly = false;
  if (name === "starter-preps") {
    state.categories = ["Preposition"];
  } else if (name === "numbers-1-10") {
    state.categories = ["Numerals"];
  } else if (name === "articles") {
    state.categories = ["Article"];
  } else if (name === "place-names") {
    state.categories = ["PlaceName"];
  }
  // Persist to localStorage
  saveLS("wm_families", state.families);
  saveLS("wm_categories", state.categories);
  saveLS("wm_outcomes", state.outcomes);
  saveLS("wm_trig", state.triggerQuery);
  saveLS("wm_nil", state.nilOnly);
  applyFilters();
  rebuildDeck();
  buildFilters();
  render();
}
function applyFilters() {
  const allowedOutcomes = (state.outcomes && state.outcomes.length) ? state.outcomes : ["SM","AM","NM","NONE"];
  let list = state.rows.filter(r =>
    (state.families.length ? state.families.includes(r.RuleFamily) : true) &&
    (state.categories.length ? state.categories.includes(r.RuleCategory) : true) &&
    (allowedOutcomes.includes((r.Outcome || "").toUpperCase()))
  );
  if (state.nilOnly) list = list.filter(r => (r.Outcome || "").toUpperCase() === "NONE");
  if ((state.triggerQuery || "").trim()) {
    const q = normalize(state.triggerQuery);
    list = list.filter(r => normalize(r.Trigger).includes(q));
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
  state.usedRevealThisCard = false;
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

/* ========= TTS (Polly via Lambda URL) ========= */
const POLLY_FUNCTION_URL = "https://pl6xqfeht2hhbruzlhm3imcpya0upied.lambda-url.eu-west-2.on.aws/";
const ttsCache = new Map();

function buildCompleteSentence(card) {
  const before = (card.Before || "").trimEnd();
  const answer = (card.Answer || "").trim();
  const after  = (card.After  || "").trimStart();
  let s = [before, answer, after].filter(Boolean).join(" ");
  s = s.replace(/\s+/g, " ").trim();
  s = s.replace(/\s+([,.;:!?])/g, "$1");
  return s;
}
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
        <button id="btnClearFilters" class="ml-2 btn btn-ghost px-2 py-1">Clear filters</button>
      </div>`;
    $("#btnClearFilters")?.addEventListener("click", () => {
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
      applyFilters(); rebuildDeck(); buildFilters(); render();
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
    state.nilOnly;

  if (anyRestriction) {
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
      const trigLabel = (lang === "cy" ? "Sbardun" : "Trigger");
      summary.appendChild(addChip(`${trigLabel}: ${state.triggerQuery.trim()}`));
    }
    if (state.nilOnly) summary.appendChild(addChip(label("headings", "nilOnly")));

    summary.appendChild(addChip(lang === "cy" ? "Clirio" : "Clear", () => {
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
      applyFilters(); rebuildDeck(); buildFilters(); render();
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
    // Prevent double-counting if the user triggers Check more than once.
    if (state.lastResult) return;
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

    // --- session stats (device-local) ---
    const sess = state.session || loadSession();
    sess.done += 1;
    if (ok) {
      sess.correct += 1;
      sess.points += SESSION_POINTS_PER_CORRECT;
      if (!state.usedRevealThisCard) sess.streak += 1;
      else sess.streak = 0;
      if (sess.streak > sess.bestStreak) sess.bestStreak = sess.streak;
    } else {
      sess.streak = 0;
    }
    bumpSessionBucket(sess.byOutcome, (shownCard.Outcome || "?").toUpperCase(), ok);
    bumpSessionBucket(sess.byCategory, shownCard.RuleCategory || "Uncategorised", ok);
    state.session = sess;
    saveSession(sess);

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
    // Reveal counts as "used" for streak purposes on this card.
    const turningOn = !state.revealed;
    if (turningOn) state.usedRevealThisCard = true;
    state.revealed = !state.revealed;
    render();
  });

  const btnSkip = btn(t.skip, "btn-ghost", () => {
    // Prevent double-counting if the user triggers Skip after already checking.
    if (state.lastResult) return;
    state.guess = "";
    state.revealed = true;
    state.lastResult = "skipped";
    state.freezeIdx = idxNow;
    state.freezePos = state.currentDeckPos;

    const shownIdx = idxShown;
    const shownCard = state.filtered[shownIdx];
    const cardId = getCardId(shownCard, shownIdx);

    state.history.push({
      t: Date.now(),
      ok: false,
      key: `${shownCard.RuleCategory}:${shownCard.Trigger}:${shownCard.Base}`,
      cardId,
      expected: shownCard.Answer,
      got: "",
      mode: state.practiceMode,
      skipped: true,
    });
    saveLS("wm_hist", state.history);

    // --- session stats (device-local) ---
    const sess = state.session || loadSession();
    sess.done += 1;
    sess.streak = 0;
    bumpSessionBucket(sess.byOutcome, (shownCard.Outcome || "?").toUpperCase(), false);
    bumpSessionBucket(sess.byCategory, shownCard.RuleCategory || "Uncategorised", false);
    state.session = sess;
    saveSession(sess);

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

function renderSessionPanel() {
  // Session panel lives in the practice view sidebar.
  // It should show *session* stats (device-local), not lifetime.
  const sess = state.session || loadSession();

  const lang = (state.lang === "cy" ? "cy" : "en");
  const L = LABEL[lang];

  const done = Number(sess.done) || 0;
  const correct = Number(sess.correct) || 0;
  const acc = done ? Math.round((correct / done) * 100) : 0;

  // Accuracy tile
  if ($("#accBig")) $("#accBig").textContent = `${acc}%`;
  if ($("#accText")) $("#accText").textContent = formatTpl(L.sessionCorrectFmt, { correct, done });

  // Streak tile
  const currentStreak = Number(sess.streak) || 0;
  const prevStreak = (typeof state._lastRenderedSessStreak === "number") ? state._lastRenderedSessStreak : null;
  if ($("#sessStreak")) $("#sessStreak").textContent = String(currentStreak);
  if ($("#sessBestStreak")) $("#sessBestStreak").textContent = formatTpl(L.sessionBestFmt, { n: Number(sess.bestStreak) || 0 });

  // Tiny “pop” when streak increases
  if (prevStreak != null && currentStreak > prevStreak) {
    const span = $("#sessStreak");
    const tile = span?.closest?.("div.p-3") || span?.closest?.("div.rounded-2xl");
    if (tile) {
      tile.classList.remove("animate-pop");
      // force reflow so the animation restarts
      void tile.offsetWidth;
      tile.classList.add("animate-pop");
      setTimeout(() => tile.classList.remove("animate-pop"), 200);
    }
  }
  state._lastRenderedSessStreak = currentStreak;

  // ---- Mastery (this focus) ----
  const pool = (state.filtered?.length || 0);
  const boxCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (let i = 0; i < pool; i++) {
    const id = getCardId(state.filtered[i], i);
    const box = getBoxFor(id);
    boxCounts[box] = (boxCounts[box] || 0) + 1;
  }
  const mastered = (boxCounts[4] || 0) + (boxCounts[5] || 0);
  const masteryPct = pool ? Math.round((mastered / pool) * 100) : 0;

  if ($("#masteryText")) $("#masteryText").textContent = formatTpl(L.sessionMasteredFmt, { mastered, pool });
  const mb = $("#masteryBar");
  if (mb) mb.style.width = `${masteryPct}%`;
  if ($("#masteryBoxes")) $("#masteryBoxes").textContent = formatTpl(L.sessionBox1Fmt, { n: boxCounts[1] || 0 });

  // ---- More info: by outcome (session) ----
  const ulOutcome = $("#byOutcome");
  if (ulOutcome) {
    ulOutcome.innerHTML = "";
    const entries = Object.entries(sess.byOutcome || {});
    // stable order preferred (SM/AM/NM/NONE), then others.
    const order = ["SM", "AM", "NM", "NONE"];
    entries.sort((a, b) => {
      const ak = String(a[0]).toUpperCase();
      const bk = String(b[0]).toUpperCase();
      const ai = order.indexOf(ak);
      const bi = order.indexOf(bk);
      if (ai !== -1 || bi !== -1) {
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      }
      return ak.localeCompare(bk);
    });

    for (const [k, v] of entries) {
      const tot = Number(v?.done) || 0;
      const ok = Number(v?.correct) || 0;
      const li = document.createElement("li");
      li.className = "flex justify-between";
      li.innerHTML = `<span>${esc(String(k).toUpperCase())}</span><span class="text-slate-600">${ok}/${tot}</span>`;
      ulOutcome.appendChild(li);
    }
  }

  // ---- More info: by category (session) ----
  const ulCat = $("#sessByCategory");
  if (ulCat) {
    ulCat.innerHTML = "";
    const catEntries = Object.entries(sess.byCategory || {})
      .map(([k, v]) => ({
        k: String(k || "Uncategorised"),
        done: Number(v?.done) || 0,
        correct: Number(v?.correct) || 0
      }))
      .filter(x => x.done > 0)
      .sort((a, b) => b.done - a.done);

    const MAX = 6;
    let shown = catEntries.slice(0, MAX);
    const rest = catEntries.slice(MAX);
    for (const it of shown) {
      const li = document.createElement("li");
      li.className = "flex justify-between";
      li.innerHTML = `<span>${esc(label("categories", it.k))}</span><span class="text-slate-600">${it.correct}/${it.done}</span>`;
      ulCat.appendChild(li);
    }
    if (rest.length) {
      const otherDone = rest.reduce((a, x) => a + x.done, 0);
      const otherCorrect = rest.reduce((a, x) => a + x.correct, 0);
      const li = document.createElement("li");
      li.className = "flex justify-between";
      li.innerHTML = `<span>${esc(L.sessionOther)}</span><span class="text-slate-600">${otherCorrect}/${otherDone}</span>`;
      ulCat.appendChild(li);
    }
  }
}

function renderLifetimeStatsView() {
  // Stats page should show lifetime accuracy based on history.
  const s = computeStats();
  if ($("#statsAcc")) $("#statsAcc").textContent = `${s.acc}%`;
  if ($("#statsText")) $("#statsText").textContent = `${s.correct} correct out of ${s.total}`;

  const ul = $("#statsByOutcome");
  if (ul) ul.innerHTML = "";
  for (const [k, v] of Object.entries(s.by)) {
    const li = document.createElement("li");
    li.className = "flex justify-between";
    li.innerHTML = `<span>${esc(k)}</span><span class="text-slate-600">${v.ok}/${v.total}</span>`;
    ul?.appendChild(li);
  }
}

function render() {
  $("#practiceView")?.classList.toggle("hidden", state.mode !== "practice");
  $("#browseView")?.classList.toggle("hidden", state.mode !== "browse");
  $("#statsView")?.classList.toggle("hidden", state.mode !== "stats");

  renderPractice();
  if (state.mode === "browse") renderBrowse();

  // Always update the session sidebar (it exists on the practice page).
  renderSessionPanel();

  // Only update the lifetime stats view when visible.
  if (state.mode === "stats") renderLifetimeStatsView();
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
    state.usedRevealThisCard = false;
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
  state.usedRevealThisCard = false;
  state.lastResult = null;
  render();
}

/* ========= Event wiring ========= */
function wireUi() {
  // NOTE: Do NOT bind #btnLangToggle here. navbar.js owns that button.

  $("#onboardDismiss")?.addEventListener("click", () => $("#onboard")?.classList.add("hidden"));

  // Session panel buttons
  $("#btnNewSession")?.addEventListener("click", () => {
    resetSession();
    render();
  });

  $("#btnResetStreak")?.addEventListener("click", () => {
    resetStreak(state.session);
    render();
  });

  // Device reset (clears device-local progress and stats)
  const confirmClearDevice = () => {
    const msg = (state.lang === "cy")
      ? "Bydd hyn yn clirio eich cynnydd a’ch ystadegau sydd wedi’u cadw ar y ddyfais hon (hanes, blychau Leitner, a’r sesiwn bresennol). Ni ellir dadwneud hyn. Parhau?"
      : "This will clear your progress and stats saved on this device (history, Leitner boxes, and the current session). This cannot be undone. Continue?";
    return window.confirm(msg);
  };

  const clearDeviceStats = () => {
    try { localStorage.removeItem("wm_hist"); } catch (e) {}
    try { localStorage.removeItem(LEITNER_LS_KEY); } catch (e) {}
    try { localStorage.removeItem(SESSION_LS_KEY); } catch (e) {}

    state.history = [];
    state.leitner = {};
    state.session = resetSession(); // creates a fresh session and persists it
    state.usedRevealThisCard = false;
    render();
  };

  $("#btnResetStats")?.addEventListener("click", () => {
    if (!confirmClearDevice()) return;
    clearDeviceStats();
  });
  $("#btnResetStats2")?.addEventListener("click", () => {
    if (!confirmClearDevice()) return;
    clearDeviceStats();
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
      state.rows = d.map(coerceRow);
      applyFilters(); rebuildDeck(); buildFilters(); render();
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
          state.rows = res.data.map(coerceRow);
          applyFilters(); rebuildDeck(); buildFilters(); render();
        }
      });
    });
  }

  if (getParam("preset") === "prepositions") {
    state.categories = ["Preposition"];
    saveLS("wm_categories", state.categories);
  }
}

/* ========= Boot ========= */
(async function boot() {
  wireUi();
  await initData();

  // Apply current language immediately (navbar.js also applies [data-lang] visibility)
  syncLangFromNavbar();

})();




