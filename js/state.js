export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function normalize(s) {
  return (s || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/’/g, "'")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeSourcePath(s) {
  return (s || "")
    .toString()
    .trim()
    .replace(/^https?:\/\/[^/]+\/?/i, "")
    .replace(/^\/+/, "")
    .replace(/^data\//i, "");
}

// Canonicalise Trigger values for reliable matching (presets + URL params).
// - lowercases, trims, normalises apostrophes
// - removes bracketed glosses: "i (to)" -> "i"; "y [the]" -> "y"
export function canonicalTrigger(s) {
  let x = (s == null ? "" : String(s));
  // Normalise apostrophes early
  x = x.replace(/’/g, "'");
  // Remove bracketed glosses anywhere in the string
  x = x.replace(/\([^)]*\)/g, " ");
  x = x.replace(/\[[^\]]*\]/g, " ");
  // Collapse whitespace + normalise case/diacritics
  x = normalize(x);
  // If someone used multiple tokens (e.g. "o (from)"), keep the first meaningful token
  // but only if there are still multiple words after gloss removal.
  if (x.includes(" ")) x = x.split(" ")[0].trim();
  return x;
}

export function esc(s) {
  return (s == null ? "" : String(s)).replace(/[&<>"]/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
  }[ch]));
}

export function getParam(k) {
  return new URLSearchParams(location.search).get(k);
}

export function saveLS(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {}
}

export function loadLS(k, d) {
  try {
    const r = localStorage.getItem(k);
    return r ? JSON.parse(r) : d;
  } catch (e) {
    return d;
  }
}

/* Robust language getter (matches navbar.js behaviour) */
export function wmGetLangLocal() {
  const raw = localStorage.getItem("wm_lang");
  if (!raw) return "en";
  try {
    const v = JSON.parse(raw);
    return (v === "cy" || v === "en") ? v : "en";
  } catch {
    return (raw === "cy" || raw === "en") ? raw : "en";
  }
}

export const LEITNER_LS_KEY = "wm_leitner_boxes_v1";
export const PRACTICE_MODE_LS_KEY = "wm_practice_mode_v1";

/* ========= App State ========= */
export const state = {
  sourceScope: loadLS("wm_source_scope", []), // restrict cards to specific CSV sources (presets)
  rows: [],
  filtered: [],
  families: loadLS("wm_families", ["Soft","Aspirate","Nasal","None"]),
  categories: loadLS("wm_categories", []),
  triggerQuery: loadLS("wm_trig", ""),
  // Presets are implemented as a thin layer over filters.
  activePreset: loadLS("wm_active_preset", ""),
  activePackKey: loadLS("wm_active_pack", null),
  presetTriggers: loadLS("wm_preset_triggers", []), // canonical triggers for the active preset
  presetForceFamily: loadLS("wm_preset_force_family", null),
  presetLimitComplexity: loadLS("wm_preset_limit_complexity", false),
  presetCategory: loadLS("wm_preset_category", null),
  showMoreFilters: loadLS("wm_show_more_filters", false),
  nilOnly: loadLS("wm_nil", false),
  mode: loadLS("wm_mode", "practice"),
  practiceMode: loadLS(PRACTICE_MODE_LS_KEY, "shuffle"),
  leitner: loadLS(LEITNER_LS_KEY, {}),
  streakResetAt: loadLS("wm_streak_reset", 0),
  smartIdx: null,
  smartCount: 0,
  smartQueue: [],
  deck: [],
  p: 0,
  guess: "",
  revealed: false,
  lastResult: null,
  history: loadLS("wm_hist", []),
  freezeIdx: null,
  freezePos: null,
  lang: wmGetLangLocal(),   // IMPORTANT: read same as navbar.js
  currentIdx: 0,
  currentDeckPos: -1,
  reportContext: null,
};

export function normalizeCategoryList(list) {
  return Array.from(new Set((list || []).filter(Boolean).filter(c => c !== "All")));
}

export function hasCustomFilters() {
  const activeCategories = state.categories.filter(c => c !== "All");
  return (
    (state.families.length && state.families.length < 4) ||
    activeCategories.length ||
    (state.triggerQuery && state.triggerQuery.trim()) ||
    state.nilOnly
  );
}

export function setCategories(next) {
  state.categories = normalizeCategoryList(next);
  saveLS("wm_categories", state.categories);
}

export function resetFilters() {
  state.families = ["Soft","Aspirate","Nasal","None"];
  state.categories = [];
  state.triggerQuery = "";
  state.nilOnly = false;

  saveLS("wm_families", state.families);
  saveLS("wm_categories", state.categories);
  saveLS("wm_trig", state.triggerQuery);
  saveLS("wm_nil", state.nilOnly);
}

state.families = Array.isArray(state.families) && state.families.length
  ? state.families
  : ["Soft","Aspirate","Nasal","None"];
state.categories = normalizeCategoryList(Array.isArray(state.categories) ? state.categories : []);
state.presetTriggers = Array.isArray(state.presetTriggers) ? state.presetTriggers : [];
state.sourceScope = Array.isArray(state.sourceScope) ? state.sourceScope : [];
state.presetForceFamily = state.presetForceFamily || null;
state.presetCategory = state.presetCategory || null;
state.presetLimitComplexity = Boolean(state.presetLimitComplexity);

/* ========= UI Translations ========= */
export const LABEL = {
  en: {
    headings: { focus:"Focus", rulefamily:"Mutation type", outcome:"Outcome", categories:"Categories", trigger:"Filter by Trigger", nilOnly:"Nil-cases only (no mutation expected)", presets:"Quick packs" },
    presets: {
      starterPrepsTitle: "Starter prepositions",
      starterPrepsDesc: "Common contact-mutation prepositions",
      starterPrepsTip: "Common prepositions that usually trigger soft mutation in simple phrases.",
      numbersTitle: "Numbers 1–10",
      numbersDesc: "Un, dau, tri ... deg",
      numbersTip: "Count through the first ten numerals and the mutations they trigger.",
      articlesTitle: "Articles",
      articlesDesc: "y / yr / 'r (starter set)",
      articlesTip: "Definite articles and the mutation patterns they create.",
      placeNamesTitle: "Place-name starter pack",
      placeNamesDesc: "Early nasal-mutation practice",
      placeNamesTip: "Place names often take nasal mutation in common patterns (e.g. after certain structures)."
    },
    categoryView: { showAll: "Show all categories", showCommon: "Show common categories" },
    categories: {
      All:"All","Adjective+Noun":"Adjective+Noun",Article:"Article","Bod+yn":"Bod+Yn",Complement:"Complement",Conjunction:"Conjunction",
      Deictic:"Deictic",Determiner:"Determiner",Intensifier:"Intensifier",Interrogative:"Interrogative",Idiom: "Idiom",Negation:"Negation",Numerals:"Numerals",
      Particle:"Particle",PlaceName:"Place names",Possessive:"Possessive",Preposition:"Preposition",Presentative:"Presentative",Relative:"Relative",
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
    statuses:{ correct:"Correct!", wrong:"Not quite", skipped:"Skipped", revealed:"Revealed" },
    youTyped:"You typed",
    blank:"(blank)",
    hear:"Hear",
    meaningAria:"Meaning",
    onboardDismiss:"Got it",
    resetStats:"Reset stats",
    backToTop:"Back to top",
    ui: {
      coreFilters: "Filters",
      advancedFilters: "More filters",
      advancedFiltersOpen: "Fewer filters",
      advancedFiltersClosed: "More filters",
      categoriesMoreFilters: "More filters ▾",
      categoriesFewerFilters: "Fewer filters ▴",
      sessionTitle: "This session",
      newSession: "New",
      clearFilters: "Clear filters",
      focusHelper: "Start with a pack or fine-tune below.",
      presetsHelper: "Curated guided sets to jump into a topic.",
      coreFiltersHelper: "Fine-tune across all cards.",
      triggerPlaceholder: "e.g. i, o, dwy, tri, y (article), neu",
      accuracyTitle: "Accuracy",
      streakTitle: "Streak",
      resetStreakTitle: "Reset streak",
      moreStats: "More stats",
      cardTitle: "Card",
      cardHint: "Use New to start a fresh run.",
      masteryTitle: "Mastery (this focus)",
      byOutcomeTitle: "By outcome",
      legend: "Legend: <b>SM</b>=Soft, <b>AM</b>=Aspirate, <b>NM</b>=Nasal, <b>NONE</b>=No mutation",
      byCategoryTitle: "By category",
      moreInfo: "More info",
      statsAccuracyTitle: "Accuracy",
      statsByOutcomeTitle: "By outcome",
      reset: "Reset",
      bestLabel: "Best",
      clear: "Clear",
      progressAllCards: "All cards",
      progressCustomFilters: "Custom filters",
      presetClearTitle: "Clear preset",
      deckProgressLabel: "Deck progress",
      cardsRemainingLabel: "Remaining",
      cardIdLabel: "Card ID",
      reportIssue: "Noticed an error?",
      reportModalTitle: "Report an issue",
      reportModalIntro: "We’ll pre-fill the card context to make reporting quick.",
      reportFieldCardIdLabel: "Card ID",
      reportFieldBaseLabel: "Base word",
      reportFieldSentenceLabel: "Full sentence (CY)",
      reportFieldTranslationLabel: "English translation (if available)",
      reportFieldFocusLabel: "Focus label",
      reportFieldMutationLabel: "Mutation type / outcome",
      reportDetailsLabel: "What looks wrong?",
      reportDetailsPlaceholder: "Describe what seems wrong or missing.",
      reportSubmit: "Open GitHub issue draft",
      reportCancel: "Cancel",
      reportSuccess: "Issue draft opened in a new tab.",
      reportIssueTitlePrefix: "Card issue: Card ID",
      whyLabel: "Why",
    },
  },
  cy: {
    headings: { focus:"Ffocws", rulefamily:"Math treiglad", outcome:"Canlyniad", categories:"Categorïau", trigger:"Hidlo yn ôl y sbardun", nilOnly:"Achosion dim-treiglad yn unig (dim treiglad disgwyliedig)", presets:"Pecynnau cyflym" },
    presets: {
      starterPrepsTitle: "Arddodiaid dechreuol",
      starterPrepsDesc: "Arddodiaid treiglad-cyswllt cyffredin",
      starterPrepsTip: "Arddodiaid cyffredin sy’n achosi treiglad meddal yn rheolaidd mewn ymadroddion syml.",
      numbersTitle: "Rhifau 1–10",
      numbersDesc: "Un, dau, tri ... deg",
      numbersTip: "Cyfrif drwy’r deg rhif cyntaf a’r treigladau maen nhw’n eu hysgogi.",
      articlesTitle: "Erthyglau",
      articlesDesc: "y / yr / 'r (set gychwynnol)",
      articlesTip: "Erthyglau pendant a’r patrymau treiglo sy’n eu dilyn.",
      placeNamesTitle: "Pecyn cychwyn enwau lleoedd",
      placeNamesDesc: "Ymarfer treiglad trwynol cynnar",
      placeNamesTip: "Mae enwau lleoedd yn aml yn treiglo’n drwynol mewn patrymau cyffredin (e.e. ar ôl rhai strwythurau)."
    },
    categoryView: { showAll: "Dangos pob categori", showCommon: "Dangos categorïau cyffredin" },
    categories: {
      All:"Pob","Adjective+Noun":"Ansoddair+Enw",Article:"Erthygl",Bod+yn:"Bod+Yn",Complement:"Cwblhad",Conjunction:"Cydgysylltydd",
      Deictic:"Deictig",Determiner:"Pennod",Intensifier:"Dwysydd",Interrogative:"Holiadol",Idiom: "Idiom",Negation:"Negydd",Numerals:"Rhifau",
      Particle:"Gronyn",PlaceName:"Enw lle",Possessive:"Perchenogol",Preposition:"Arddodiad",Presentative:"Dangosol",Relative:"Perthynol",
      SubjectBoundary:"Ffin pwnc",Subordinator:"Isgysylltydd",TimeExpressions:"Mynegiadau amser"
    },
    rulefamily: { Soft:"Meddal", Aspirate:"Llaes", Nasal:"Trwynol", None:"Dim", SM:"Meddal", AM:"Llaes", NM:"Trwynol", NONE:"Dim" },
    instruction: "Teipiwch y ffurf gywir. Os nad oes newid, defnyddiwch y ffurf sylfaenol.",
    hint:"Awgrym", reveal:"Dangos", skip:"Sgipio", check:"Gwirio", next:"Nesaf",
    shuffleModeDesc:"Adolygu ar hap: mae cardiau’n ymddangos mewn trefn wirioneddol ar hap.",
    smartModeDesc:"Adolygu clyfar: addasu i’ch cynnydd a phwysleisio camgymeriadau; mae’n ailadrodd cardiau anghywir yn amlach.",
    shuffleNowDesc:"Ailgymysgu’r dec presennol (yn ddefnyddiwch os ydych chi’n gweld yr un cardiau dro ar ôl tro).",
    shuffleNow:"Cymysgu cardiau",
    shuffleModeShort:"Ar hap",
    smartModeShort:"Clyfar",
    cardLabel:"Cerdyn",
    reviewedLabel:"Adolygwyd",
    poolLabel:"Pwll",
    answerLabel:"Ateb",
    statuses:{ correct:"Cywir!", wrong:"Bron", skipped:"Sgipiwyd", revealed:"Dangoswyd" },
    youTyped:"Rydych wedi teipio",
    blank:"(gwag)",
    hear:"Clywed",
    meaningAria:"Ystyr",
    onboardDismiss:"Iawn",
    resetStats:"Ailosod ystadegau",
    backToTop:"Yn ôl i'r top",
    ui: {
      coreFilters: "Hidlwyr",
      advancedFilters: "Mwy o hidlwyr",
      advancedFiltersOpen: "Llai o hidlwyr",
      advancedFiltersClosed: "Mwy o hidlwyr",
      categoriesMoreFilters: "Mwy o hidlwyr ▾",
      categoriesFewerFilters: "Llai o hidlwyr ▴",
      sessionTitle: "Sesiwn yma",
      newSession: "Newydd",
      clearFilters: "Clirio hidlwyr",
      focusHelper: "Cychwynwch gyda phac neu addaswch isod.",
      presetsHelper: "Setiau dan arweiniad i neidio i bwnc.",
      coreFiltersHelper: "Addaswch ar draws pob cerdyn.",
      triggerPlaceholder: "e.e. i, o, dwy, tri, y (erthygl), neu",
      accuracyTitle: "Cywirdeb",
      streakTitle: "Rhediad",
      resetStreakTitle: "Ailosod rhediad",
      moreStats: "Mwy o ystadegau",
      cardTitle: "Cerdyn",
      cardHint: "Defnyddiwch Newydd i ddechrau rhediad newydd.",
      masteryTitle: "Meistrolaeth (y ffocws hwn)",
      byOutcomeTitle: "Yn ôl canlyniad",
      legend: "Chwedl: <b>SM</b>=Meddal, <b>AM</b>=Llaes, <b>NM</b>=Trwynol, <b>NONE</b>=Dim treiglad",
      byCategoryTitle: "Yn ôl categori",
      moreInfo: "Mwy o wybodaeth",
      statsAccuracyTitle: "Cywirdeb",
      statsByOutcomeTitle: "Yn ôl canlyniad",
      reset: "Ailosod",
      bestLabel: "Gorau",
      clear: "Clirio",
      progressAllCards: "Pob cerdyn",
      progressCustomFilters: "Hidlwyr personol",
      presetClearTitle: "Clirio'r preset",
      deckProgressLabel: "Cynnydd y dec",
      cardsRemainingLabel: "Ar ôl",
      cardIdLabel: "ID Cerdyn",
      reportIssue: "Wedi sylwi ar gamgymeriad?",
      reportModalTitle: "Adrodd problem",
      reportModalIntro: "Byddwn yn llenwi manylion y cerdyn ymlaen llaw er hwylustod.",
      reportFieldCardIdLabel: "ID Cerdyn",
      reportFieldBaseLabel: "Gair sylfaenol",
      reportFieldSentenceLabel: "Brawddeg lawn (CY)",
      reportFieldTranslationLabel: "Cyfieithiad Saesneg (os ar gael)",
      reportFieldFocusLabel: "Label ffocws",
      reportFieldMutationLabel: "Math treiglad / canlyniad",
      reportDetailsLabel: "Beth sy’n anghywir?",
      reportDetailsPlaceholder: "Disgrifiwch beth sy’n edrych yn anghywir neu ar goll.",
      reportSubmit: "Agor drafft mater GitHub",
      reportCancel: "Canslo",
      reportSuccess: "Agorwyd drafft mater mewn tab newydd.",
      reportIssueTitlePrefix: "Problem gyda cherdyn: ID Cerdyn",
      whyLabel: "Pam",
    },
  }
};

export function label(section, key) {
  const lang = state.lang || "en";
  return (LABEL?.[lang]?.[section]?.[key]) || key;
}
