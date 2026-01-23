import {
  $,
  $$,
  normalize,
  normalizeSourcePath,
  canonicalTrigger,
  esc,
  getParam,
  loadLS,
  saveLS,
  wmGetLangLocal,
  state,
  setCategories,
  resetFilters,
  hasCustomFilters,
  LABEL,
  label,
  getOnboardHelpLabel
} from "./state.js";
import { pickNextSmartIdx } from "./leitner.js";
import { buildCompleteSentence } from "./tts.js";
import {
  renderPractice,
  renderBrowse,
  closeReportModal,
  submitReportIssue,
  initCardUi,
  setCardCallbacks
} from "./card.js";
import { lockScroll, unlockScroll } from "./scroll-lock.js";

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
    TriggerCanon: canonicalTrigger(trig),
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

function setButtonLabel(el, text) {
  if (!el) return;
  const labelEl = el.querySelector(".btn-label");
  if (labelEl) {
    labelEl.textContent = text;
    return;
  }
  el.textContent = text;
}

/* IMPORTANT: This does NOT toggle the navbar. navbar.js owns that.
   This only updates dynamic UI and labels to match state.lang. */
function applyLanguage() {
  const lang = (state.lang === "cy" ? "cy" : "en");

  // keep html lang in sync (navbar.js also sets it, but harmless)
  document.documentElement.setAttribute("lang", lang);

  if ($("#focusTitle")) $("#focusTitle").textContent = LABEL[lang].headings.focus;
  if ($("#focusHelper")) $("#focusHelper").textContent = LABEL[lang].ui.focusHelper;
  if ($("#rulefamilyTitle")) $("#rulefamilyTitle").textContent = LABEL[lang].headings.rulefamily;
  if ($("#categoriesTitle")) $("#categoriesTitle").textContent = LABEL[lang].headings.categories;
  if ($("#triggerLabel")) $("#triggerLabel").textContent = LABEL[lang].headings.trigger;
  if ($("#triggerFilter")) $("#triggerFilter").setAttribute("placeholder", LABEL[lang].ui.triggerPlaceholder);

  $$("[data-onboard-dismiss]").forEach((btn) => {
    btn.textContent = LABEL[lang].onboardDismiss;
  });
  const helpBtn = $("#onboardHelpBtn");
  if (helpBtn) {
    const helpLabel = getOnboardHelpLabel(lang);
    helpBtn.setAttribute("aria-label", helpLabel);
    helpBtn.setAttribute("title", helpLabel);
    const helpLabelEl = helpBtn.querySelector(".onboard-help-label");
    if (helpLabelEl) helpLabelEl.textContent = helpLabel;
    else helpBtn.textContent = helpLabel;
  }
  if ($("#onboardModalTitle")) $("#onboardModalTitle").textContent = LABEL[lang].ui.onboardModalTitle;
  if ($("#onboardModalDesc")) $("#onboardModalDesc").textContent = LABEL[lang].ui.onboardModalDesc;

  if ($("#btnResetStats")) $("#btnResetStats").textContent = LABEL[lang].resetStats;
  if ($("#btnResetStats2")) $("#btnResetStats2").textContent = LABEL[lang].ui.reset;
  if ($("#btnTop")) $("#btnTop").textContent = LABEL[lang].backToTop;
  if ($("#btnResetStatsTop")) $("#btnResetStatsTop").setAttribute("title", LABEL[lang].resetStats);
  if ($("#btnResetStatsTop")) $("#btnResetStatsTop").setAttribute("aria-label", LABEL[lang].resetStats);
  if ($("#btnResetStreakTop")) $("#btnResetStreakTop").setAttribute("title", LABEL[lang].ui.resetStreakTitle);
  if ($("#btnResetStreakTop")) $("#btnResetStreakTop").setAttribute("aria-label", LABEL[lang].ui.resetStreakTitle);

  // New UI translations
  if ($("#presetsHelper")) $("#presetsHelper").textContent = LABEL[lang].ui.presetsHelper;
  if ($("#coreFiltersHelper")) $("#coreFiltersHelper").textContent = LABEL[lang].ui.coreFiltersHelper;
  if ($("#sessionTitle")) $("#sessionTitle").textContent = LABEL[lang].ui.sessionTitle;
  if ($("#btnNewSession")) $("#btnNewSession").textContent = LABEL[lang].ui.newSession;
  const clearFiltersLabel = LABEL[lang].ui.clearFilters;
  const clearFiltersBtn = $("#btnFiltersClear");
  if (clearFiltersBtn) {
    const labelEl = clearFiltersBtn.querySelector(".pill-label");
    if (labelEl) labelEl.textContent = clearFiltersLabel;
    else clearFiltersBtn.textContent = clearFiltersLabel;
  }
  const moreFiltersToggle = $("#moreFiltersToggle");
  if (moreFiltersToggle) {
    const label = state.showMoreFilters
      ? LABEL[lang].ui.advancedFiltersOpen
      : LABEL[lang].ui.advancedFiltersClosed;
    const icon = state.showMoreFilters ? "▴" : "▾";
    const labelEl = moreFiltersToggle.querySelector(".pill-label");
    const iconEl = moreFiltersToggle.querySelector(".pill-icon");
    if (labelEl) labelEl.textContent = label;
    if (iconEl) iconEl.textContent = icon;
    if (!labelEl && !iconEl) moreFiltersToggle.textContent = `${label} ${icon}`;
  }
  if ($("#mobileClearFocus")) $("#mobileClearFocus").textContent = LABEL[lang].ui.clearFocus;
  if ($("#mobileClearFilters")) $("#mobileClearFilters").textContent = LABEL[lang].ui.clearFilters;
  if ($("#accTitle")) $("#accTitle").textContent = LABEL[lang].ui.accuracyTitle;
  if ($("#streakTitle")) $("#streakTitle").textContent = LABEL[lang].ui.streakTitle;
  if ($("#practiceAccTitle")) $("#practiceAccTitle").textContent = LABEL[lang].ui.accuracyTitle;
  if ($("#practiceStreakTitle")) $("#practiceStreakTitle").textContent = LABEL[lang].ui.streakTitle;
  if ($("#statAccuracy")) $("#statAccuracy").setAttribute("aria-label", LABEL[lang].ui.accuracyTitle);
  if ($("#statStreak")) $("#statStreak").setAttribute("aria-label", LABEL[lang].ui.streakTitle);
  if ($("#moreStatsSummary")) $("#moreStatsSummary").textContent = LABEL[lang].ui.moreStats;
  if ($("#btnResetStreak")) $("#btnResetStreak").setAttribute("title", LABEL[lang].ui.resetStreakTitle);
  if ($("#cardTitle")) $("#cardTitle").textContent = LABEL[lang].ui.cardTitle;
  if ($("#cardHint")) {
    // Replace placeholder "New" within the hint with the translated New text in a span
    const newText = `<span class=\"font-medium\">${LABEL[lang].ui.newSession}</span>`;
    const rawHint = LABEL[lang].ui.cardHint;
    $("#cardHint").innerHTML = rawHint.replace(/New|Newydd/, newText);
  }
  if ($("#masteryTitle")) $("#masteryTitle").textContent = LABEL[lang].ui.masteryTitle;
  if ($("#byOutcomeTitle")) $("#byOutcomeTitle").textContent = LABEL[lang].ui.byOutcomeTitle;
  if ($("#legendText")) $("#legendText").innerHTML = LABEL[lang].ui.legend;
  if ($("#byCategoryTitle")) $("#byCategoryTitle").textContent = LABEL[lang].ui.byCategoryTitle;
  if ($("#moreInfoSummary")) $("#moreInfoSummary").textContent = LABEL[lang].ui.moreInfo;
  if ($("#statsAccTitle")) $("#statsAccTitle").textContent = LABEL[lang].ui.statsAccuracyTitle;
  if ($("#statsByOutcomeTitle")) $("#statsByOutcomeTitle").textContent = LABEL[lang].ui.statsByOutcomeTitle;
  setButtonLabel($("#mobileFiltersToggle"), LABEL[lang].ui.filtersToggle);
  if ($("#mobileFiltersApply")) $("#mobileFiltersApply").textContent = LABEL[lang].ui.filtersApply;
  if ($("#mobileFiltersTitle")) $("#mobileFiltersTitle").textContent = LABEL[lang].ui.filtersTitle;
  if ($("#mbCheck")) $("#mbCheck").textContent = LABEL[lang].check;
  if ($("#mbHint")) $("#mbHint").textContent = LABEL[lang].hint;
  if ($("#mbReveal")) $("#mbReveal").textContent = LABEL[lang].reveal;
  if ($("#mbSkip")) $("#mbSkip").textContent = LABEL[lang].skip;
  if ($("#mbNext")) $("#mbNext").textContent = LABEL[lang].next;
  applyReportModalLabels();

  buildFilters();
  render();
}

function applyReportModalLabels() {
  const lang = (state.lang === "cy" ? "cy" : "en");
  if ($("#reportModalTitle")) $("#reportModalTitle").textContent = LABEL[lang].ui.reportModalTitle;
  if ($("#reportModalIntro")) $("#reportModalIntro").textContent = LABEL[lang].ui.reportModalIntro;
  if ($("#reportFieldCardIdLabel")) $("#reportFieldCardIdLabel").textContent = LABEL[lang].ui.reportFieldCardIdLabel;
  if ($("#reportFieldBaseLabel")) $("#reportFieldBaseLabel").textContent = LABEL[lang].ui.reportFieldBaseLabel;
  if ($("#reportFieldSentenceLabel")) $("#reportFieldSentenceLabel").textContent = LABEL[lang].ui.reportFieldSentenceLabel;
  if ($("#reportFieldTranslationLabel")) $("#reportFieldTranslationLabel").textContent = LABEL[lang].ui.reportFieldTranslationLabel;
  if ($("#reportFieldFocusLabel")) $("#reportFieldFocusLabel").textContent = LABEL[lang].ui.reportFieldFocusLabel;
  if ($("#reportFieldMutationLabel")) $("#reportFieldMutationLabel").textContent = LABEL[lang].ui.reportFieldMutationLabel;
  if ($("#reportDetailsLabel")) $("#reportDetailsLabel").textContent = LABEL[lang].ui.reportDetailsLabel;
  if ($("#reportDetails")) $("#reportDetails").setAttribute("placeholder", LABEL[lang].ui.reportDetailsPlaceholder);
  if ($("#reportSubmit")) $("#reportSubmit").textContent = LABEL[lang].ui.reportSubmit;
  if ($("#reportCancel")) $("#reportCancel").textContent = LABEL[lang].ui.reportCancel;
  const success = $("#reportSuccess");
  if (success && !success.classList.contains("hidden")) {
    success.textContent = LABEL[lang].ui.reportSuccess;
  }
}

const ONBOARD_DISMISS_KEY = "wm_onboard_dismissed";
function isOnboardDismissed() {
  return Boolean(loadLS(ONBOARD_DISMISS_KEY, false));
}
function setOnboardDismissed(next) {
  saveLS(ONBOARD_DISMISS_KEY, Boolean(next));
}
function applyOnboardDismissedState() {
  const onboard = $("#onboard");
  if (!onboard) return;
  onboard.classList.toggle("onboard-dismissed", isOnboardDismissed());
}

function syncLangFromNavbar() {
  const lang = wmGetLangLocal();
  if (lang !== "en" && lang !== "cy") return;
  state.lang = lang;
  applyLanguage(); // this rebuilds your dynamic UI with the right labels
}

/* ========= Presets + Category view (progressive disclosure) ========= */

const CORE_CATEGORIES = [
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
    tipKey: "starterPrepsTip",
    triggers: [],
    sourceScope: ["prep.csv"],
  },
  "numbers-1-10": {
    id: "numbers-1-10",
    titleKey: "numbersTitle",
    descKey: "numbersDesc",
    tipKey: "numbersTip",
    triggers: ["un","dwy","dau","tri","tair","pedwar","pedair","pum","pump","chwech","chwe","saith","wyth","naw","deg"],
  },
  "articles": {
    id: "articles",
    titleKey: "articlesTitle",
    descKey: "articlesDesc",
    tipKey: "articlesTip",
    category: "Article",
    triggers: [],
    sourceScope: ["article-sylfaen.csv"],
  },
  "place-names": {
    id: "place-names",
    titleKey: "placeNamesTitle",
    descKey: "placeNamesDesc",
    category: "PlaceName",
    triggers: [],
    tipKey: "placeNamesTip",
  },
};

const PRESET_ORDER = ["starter-preps","numbers-1-10","articles","place-names"];

function getCustomFiltersLabelParts() {
  const lang = state.lang || "en";
  const parts = [];
  const activeCategories = state.categories.filter(c => c !== "All");
  if (state.families.length && state.families.length < 4) {
    state.families.forEach(f => parts.push(label("rulefamily", f)));
  }
  if (activeCategories.length) {
    activeCategories.forEach(ca => parts.push(label("categories", ca)));
  }
  if (state.triggerQuery && state.triggerQuery.trim()) {
    const trigLabel = (lang === "cy" ? "Sbardun" : "Trigger");
    parts.push(`${trigLabel}: ${state.triggerQuery.trim()}`);
  }
  return parts;
}

function getProgressFocusLabel() {
  const lang = state.lang || "en";
  const key = state.activePackKey || state.activePreset;
  if (key) {
    const presetDef = PRESET_DEFS[key];
    if (presetDef?.titleKey) {
      return LABEL?.[lang]?.presets?.[presetDef.titleKey] || key;
    }
    return key;
  }
  const customParts = getCustomFiltersLabelParts();
  if (customParts.length) {
    return customParts.join(", ");
  }
  const fallbackKey = hasCustomFilters() ? "progressCustomFilters" : "progressAllCards";
  return LABEL?.[lang]?.ui?.[fallbackKey] || (hasCustomFilters() ? "Custom filters" : "All cards");
}

function updateProgressLine({ currentIndex, totalCards }) {
  const lang = state.lang || "en";
  const lineEl = $("#practiceProgressLine");
  if (!lineEl) return;
  const safeCurrent = Number.isFinite(currentIndex) ? currentIndex : 0;
  const safeTotal = Number.isFinite(totalCards) ? totalCards : 0;
  lineEl.textContent = `${getProgressFocusLabel()} · ${safeCurrent}/${safeTotal}`;
  const barFill = $("#practiceProgressBarFill");
  if (barFill) {
    const pct = safeTotal > 0 ? Math.min((safeCurrent / safeTotal) * 100, 100) : 0;
    barFill.style.width = `${pct}%`;
  }
  const bar = $("#practiceProgressBar");
  if (bar) bar.classList.toggle("hidden", safeTotal === 0);
}

function isLikelyComplexRow(card) {
  // Heuristic v1 (until a real Complexity column exists):
  // exclude very long / multi-clause sentences from starter article practice.
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

function clearPresetLayer() {
  const hasPresetLayer =
    Boolean(state.activePreset) ||
    Boolean(state.activePackKey) ||
    Boolean(state.presetTriggers?.length) ||
    Boolean(state.sourceScope?.length) ||
    Boolean(state.presetForceFamily) ||
    Boolean(state.presetCategory) ||
    Boolean(state.presetLimitComplexity);

  if (!hasPresetLayer) return;
  state.activePreset = "";
  state.activePackKey = null;
  state.presetTriggers = [];
  state.sourceScope = [];
  state.presetForceFamily = null;
  state.presetCategory = null;
  state.presetLimitComplexity = false;
  saveLS("wm_active_preset", state.activePreset);
  saveLS("wm_active_pack", state.activePackKey);
  saveLS("wm_preset_triggers", state.presetTriggers);
  saveLS("wm_source_scope", state.sourceScope);
  saveLS("wm_preset_force_family", state.presetForceFamily);
  saveLS("wm_preset_category", state.presetCategory);
  saveLS("wm_preset_limit_complexity", state.presetLimitComplexity);
  updateFocusIndicator();
  updatePresetActiveClasses();
}

function updatePresetActiveClasses() {
  $$("[data-preset]").forEach(el => {
    const id = el.getAttribute("data-preset");
    const activeKey = state.activePackKey || state.activePreset;
    const isActive = Boolean(id && id === activeKey);
    el.classList.toggle("preset-on", isActive);
    el.setAttribute("aria-pressed", isActive ? "true" : "false");
    const clearBtn = el.querySelector(".preset-clear");
    if (clearBtn) {
      clearBtn.classList.toggle("hidden", !isActive);
      clearBtn.setAttribute("title", LABEL[state.lang || "en"].ui.presetClearTitle);
      clearBtn.setAttribute("aria-label", LABEL[state.lang || "en"].ui.presetClearTitle);
    }
  });
}

function updateFocusIndicator() {
  const el = $("#focusIndicator");
  if (!el) return;

  const key = state.activePackKey || state.activePreset;
  if (!key) {
    el.classList.add("hidden");
    return;
  }

  const presetDef = PRESET_DEFS[key];
  const lang = state.lang || "en";
  const title = presetDef?.titleKey ? (LABEL?.[lang]?.presets?.[presetDef.titleKey] || key) : key;
  const focusLabel = LABEL?.[lang]?.headings?.focus || (lang === "cy" ? "Ffocws" : "Focus");

  el.textContent = `${focusLabel}: ${title}`;
  el.classList.remove("hidden");
}

function clearFiltersAndRender() {
  resetFilters();
  applyFilters();
  rebuildDeck();
  buildFilters();
  render();
  refreshFilterPills();
  updatePresetActiveClasses();
  updateFocusIndicator();
}

function clearFocusAndRender() {
  clearPresetLayer();
  applyFilters();
  rebuildDeck();
  render();
  refreshFilterPills();
  updatePresetActiveClasses();
  updateFocusIndicator();
}

function renderPresetTiles() {
  wirePresetUi();
  updatePresetActiveClasses();
}

function updatePresetTileContent() {
  const lang = state.lang || "en";
  $$("[data-preset]").forEach(el => {
    const id = el.getAttribute("data-preset");
    if (!id) return;
    const p = PRESET_DEFS[id];
    if (!p) return;
    const title = LABEL[lang].presets[p.titleKey];
    const desc = LABEL[lang].presets[p.descKey];
    const tip = p.tipKey ? LABEL[lang].presets[p.tipKey] : "";
    const tooltip = [desc, tip].filter(Boolean).join(" ");
    const titleEl = el.querySelector(".preset-title");
    const descEl = el.querySelector(".preset-desc");
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
    if (tooltip) {
      el.setAttribute("title", tooltip);
      el.setAttribute("aria-label", `${title}: ${tooltip}`);
    }
    const clearBtn = el.querySelector(".preset-clear");
    if (clearBtn) {
      clearBtn.setAttribute("title", LABEL[lang].ui.presetClearTitle);
      clearBtn.setAttribute("aria-label", LABEL[lang].ui.presetClearTitle);
    }
  });
}

function applyPreset(presetId, { fromUrl = false } = {}) {
  const p = PRESET_DEFS[presetId];
  if (!p) return;

  clearPresetLayer();
  resetFilters();

  // Core preset filter targets.
  state.activePreset = presetId;
  state.activePackKey = presetId;
  saveLS("wm_active_preset", state.activePreset);
  saveLS("wm_active_pack", state.activePackKey);

  state.sourceScope = Array.isArray(p.sourceScope)
    ? p.sourceScope.map(normalizeSourcePath)
    : [];
  saveLS("wm_source_scope", state.sourceScope);

  state.presetTriggers = (p.triggers || []).map(canonicalTrigger).filter(Boolean);
  saveLS("wm_preset_triggers", state.presetTriggers);

  state.presetForceFamily = p.forceFamily || null;
  saveLS("wm_preset_force_family", state.presetForceFamily);

  state.presetCategory = p.category || null;
  saveLS("wm_preset_category", state.presetCategory);

  state.presetLimitComplexity = Boolean(p.limitComplexity);
  saveLS("wm_preset_limit_complexity", state.presetLimitComplexity);

  // UX: start with the simpler category view.
  state.showMoreFilters = false;
  saveLS("wm_show_more_filters", state.showMoreFilters);

  applyFilters();
  rebuildDeck();
  buildFilters();
  render();
  if (typeof refreshFilterPills === "function") {
    try { refreshFilterPills(); } catch (_) {}
  }
  if (typeof updateFocusIndicator === "function") updateFocusIndicator();

  // If we applied it from URL params, don't clutter history - but do keep filters.
  if (fromUrl) {
    // no-op placeholder (kept for future analytics hooks)
  }
}

function wirePresetUi() {
  // Supports either: dynamically generated preset tiles in #presetBtns,
  // OR static HTML buttons with data-preset="...".
  const container = $("#presetBtns");

  if (container && container.children.length === 0) {
    container.innerHTML = "";
    for (const id of PRESET_ORDER) {
      const p = PRESET_DEFS[id];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `preset-btn pill pill-primary ${state.activePreset === id ? "preset-on" : ""}`;
      btn.dataset.preset = id;
      btn.setAttribute("aria-pressed", state.activePreset === id ? "true" : "false");

      const title = document.createElement("div");
      title.className = "preset-title";
      title.textContent = LABEL[state.lang].presets[p.titleKey];

      const desc = document.createElement("div");
      desc.className = "preset-desc";
      desc.textContent = LABEL[state.lang].presets[p.descKey];

      const tipText = p.tipKey ? LABEL[state.lang].presets[p.tipKey] : "";
      const tooltipText = [desc.textContent, tipText].filter(Boolean).join(" ");
      if (tooltipText) {
        btn.title = tooltipText;
        btn.setAttribute("aria-label", `${title.textContent}: ${tooltipText}`);
      }

      const clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.className = "preset-clear hidden";
      clearBtn.textContent = "×";
      clearBtn.setAttribute("aria-label", LABEL[state.lang].ui.presetClearTitle);
      clearBtn.setAttribute("title", LABEL[state.lang].ui.presetClearTitle);
      clearBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        clearPresetLayer();
        applyFilters();
        rebuildDeck();
        buildFilters();
        render();
        if (typeof refreshFilterPills === "function") {
          try { refreshFilterPills(); } catch (_) {}
        }
      });

      btn.appendChild(title);
      btn.appendChild(desc);
      btn.appendChild(clearBtn);
      container.appendChild(btn);
    }
  }

  // Static buttons (or the ones we just created)
  $$("[data-preset]").forEach(el => {
    if (el.dataset._wmPresetBound === "1") return;
    el.dataset._wmPresetBound = "1";
    const id = el.getAttribute("data-preset");
    el.onclick = (e) => {
      e.preventDefault();
      const current = state.activePackKey || state.activePreset;
      if (current && current === id) {
        clearPresetLayer();
        applyFilters();
        rebuildDeck();
        buildFilters();
        render();
        if (typeof refreshFilterPills === "function") {
          try { refreshFilterPills(); } catch (_) {}
        }
      } else {
        applyPreset(id);
      }
      if (typeof updateFocusIndicator === "function") updateFocusIndicator();
      updatePresetActiveClasses();
    };
  });

  // Keep visual state in sync (works for both dynamic + static preset buttons).
  $$("[data-preset]").forEach(el => {
    const id = el.getAttribute("data-preset");
    if (!id) return;
    const activeKey = state.activePackKey || state.activePreset;
    const isActive = id === activeKey;
    el.classList.toggle("preset-on", isActive);
    el.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  updatePresetTileContent();
}

// Listen for clicks on the navbar language toggle.
// Use CAPTURE so we can run after navbar.js has handled the click.
document.addEventListener("click", (e) => {
  const btn = e.target?.closest?.("[data-lang-toggle]");
  if (!btn) return;

  // navbar.js will update localStorage + hide/show [data-lang] immediately.
  // Then we sync our dynamic UI right after.
  setTimeout(syncLangFromNavbar, 0);
}, true);

document.addEventListener("wm:navbar-ready", () => {
  syncLangFromNavbar();
});


/* ========= Data loading (index list) ========= */
const FALLBACK_INDEX_URL = "https://katyjohannab.github.io/mutationtrainer/data/index.json";
const FALLBACK_SITE_ROOT = "https://katyjohannab.github.io/mutationtrainer/";
function parseCsvText(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === "\"") {
        if (text[i + 1] === "\"") {
          cur += "\"";
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === "\"") {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cur);
      cur = "";
    } else if (ch === "\n") {
      row.push(cur);
      cur = "";
      if (row.some(cell => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
    } else if (ch !== "\r") {
      cur += ch;
    }
  }

  if (cur.length || row.length) {
    row.push(cur);
    if (row.some(cell => cell.trim() !== "")) {
      rows.push(row);
    }
  }

  if (!rows.length) return [];

  const headers = rows.shift().map(h => h.trim());
  return rows.map(cols => {
    const out = {};
    headers.forEach((h, idx) => {
      out[h] = (cols[idx] ?? "").trim();
    });
    return out;
  });
}

async function loadCsvUrl(u) {
  if (window.Papa?.parse) {
    try {
      return await new Promise((resolve, reject) => {
        window.Papa.parse(u, {
          download: true,
          header: true,
          skipEmptyLines: true,
          complete: (res) => {
            if (res?.errors?.length && !res?.data?.length) {
              reject(new Error(res.errors[0]?.message || "PapaParse failed"));
              return;
            }
            resolve(res.data || []);
          },
          error: reject
        });
      });
    } catch (err) {
      console.warn("PapaParse failed, falling back to fetch+parse", err);
    }
  }
  const res = await fetch(u, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch CSV: " + u);
  const text = await res.text();
  return parseCsvText(text);
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
        // Stamp each row with its source CSV path
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

  const expected = ["CardId","RuleFamily","RuleCategory","Trigger","Base","WordCategory","Translate","Before","After","Answer","Outcome","Why","WhyCym"];
  const cleaned = rows.map(r => {
     const src = (r && typeof r === "object" && r.__src) ? String(r.__src) : "";
    const m = coerceRow(r);
    const o = {};
    for (const k of expected) o[k] = (m?.[k] ?? "").toString().trim();
    o.Source = normalizeSourcePath(src); // 👈 preserve CSV origin
    return o;
  });

  state.rows = cleaned;

  applyFilters();
  rebuildDeck();
  buildFilters();
  render();
}

/* ========= Filters & Deck ========= */
function toggleBtn(text, active, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = `pill ${active ? "pill-on" : ""}`;
  b.textContent = text;
  b.onclick = onClick;
  return b;
}

  function refreshFilterPills() {
  const applyPillState = (container, activeKeys, allActive) => {
    if (!container) return;
    const activeSet = new Set(activeKeys || []);
    $$("[data-key]", container).forEach(btn => {
      const key = btn.dataset.key;
      const isAll = key === "__ALL__";
      const on = isAll ? allActive : activeSet.has(key);
      btn.classList.toggle("pill-on", on);
    });
  };

  const hasPresetLayer =
    Boolean(state.activePreset) ||
    Boolean(state.activePackKey) ||
    (Array.isArray(state.presetTriggers) && state.presetTriggers.length) ||
    (Array.isArray(state.sourceScope) && state.sourceScope.length) ||
    Boolean(state.presetForceFamily) ||
    Boolean(state.presetCategory) ||
    Boolean(state.presetLimitComplexity);

  const familyAll = ["Soft","Aspirate","Nasal","None"];
  const families = state.families?.length ? state.families : familyAll;
  let familyAllActive = families.length === familyAll.length;
  let familyKeys = familyAllActive ? [] : families;
  if (hasPresetLayer) {
    familyAllActive = false;
    familyKeys = [];
  }
  applyPillState($("#familyBtns"), familyKeys, familyAllActive);

  const categories = state.categories || [];
  let categoriesAllActive = categories.length === 0;
  let categoryKeys = categoriesAllActive ? [] : categories;
  if (hasPresetLayer) {
    categoriesAllActive = false;
    categoryKeys = [];
  }
  applyPillState($("#coreCategoryChips"), categoryKeys, categoriesAllActive);
  applyPillState($("#extraCategoryChips"), categoryKeys, categoriesAllActive);
  applyPillState($("#allCategoryChips"), categoryKeys, categoriesAllActive);
}
function buildFilters() {
  const lang = state.lang || "en";


  // Titles
  if ($("#focusHelper")) $("#focusHelper").textContent = LABEL[lang].ui.focusHelper;
  if ($("#quickPacksSummary")) $("#quickPacksSummary").textContent = LABEL[lang].headings.presets;
  if ($("#coreFiltersSummary")) $("#coreFiltersSummary").textContent = LABEL[lang].ui.coreFiltersTitle;
  if ($("#presetsHelper")) $("#presetsHelper").textContent = LABEL[lang].ui.presetsHelper;
  if ($("#rulefamilyTitle")) $("#rulefamilyTitle").textContent = LABEL[lang].headings.rulefamily;
  if ($("#categoriesTitle")) $("#categoriesTitle").textContent = LABEL[lang].headings.categories;
  if ($("#triggerLabel")) $("#triggerLabel").textContent = LABEL[lang].headings.trigger;
  if ($("#triggerFilter")) $("#triggerFilter").setAttribute("placeholder", LABEL[lang].ui.triggerPlaceholder);
  if ($("#coreFiltersHelper")) $("#coreFiltersHelper").textContent = LABEL[lang].ui.coreFiltersHelper;

  // Presets
  renderPresetTiles();

  // Derive categories from data
  const cats = new Set();
  for (const r of state.rows) if (r.RuleCategory) cats.add(r.RuleCategory);
  const allCats = Array.from(cats).sort();
  const coreCats = CORE_CATEGORIES.filter(c => allCats.includes(c));
  const extraCats = allCats.filter(c => !coreCats.includes(c));

  /* -----------------------------
     RULE FAMILY (with All)
  ------------------------------*/
  const famEl = $("#familyBtns");
  if (famEl) {
    famEl.innerHTML = "";

    const isAllFamilies = state.families.length === 4;
    const allFamilies = ["Soft","Aspirate","Nasal","None"];

    // ALL pill
    const allBtn = toggleBtn(label("categories", "All"), isAllFamilies, () => {
      clearPresetLayer();
      state.families = [...allFamilies];
      saveLS("wm_families", state.families);
      applyFilters();
      rebuildDeck();
      refreshFilterPills();
      render();
      updatePresetActiveClasses();
    });
    allBtn.dataset.key = "__ALL__";
    famEl.appendChild(allBtn);

    for (const f of ["Soft","Aspirate","Nasal","None"]) {
      const isOn = !isAllFamilies && state.families.includes(f);
      const b = toggleBtn(label("rulefamily", f), isOn, () => {
        clearPresetLayer();
        let fams = Array.isArray(state.families) && state.families.length
          ? [...state.families]
          : [...allFamilies];
        const allActive = fams.length === allFamilies.length;
        if (allActive) {
          fams = [f];
        } else if (fams.includes(f)) {
          fams = fams.filter(x => x !== f);
        } else {
          fams.push(f);
        }
        if (!fams.length) fams = [...allFamilies];

        state.families = fams;
        saveLS("wm_families", state.families);
        applyFilters();
        rebuildDeck();
        refreshFilterPills();
        render();
        updatePresetActiveClasses();
      });
      b.dataset.key = f;
      famEl.appendChild(b);
    }
  }

  const bindCategoryButtons = (container, categoryList, { includeClear = false, includeAll = true, variant = "core" } = {}) => {
    if (!container) return;
    container.innerHTML = "";
    const categoriesAllActive = state.categories.length === 0;

    if (includeAll) {
      const allBtn = toggleBtn(label("categories", "All"), categoriesAllActive, () => {
        clearPresetLayer();
        state.categories = [];
        saveLS("wm_categories", state.categories);
        applyFilters();
        rebuildDeck();
        refreshFilterPills();
        render();
        updatePresetActiveClasses();
      });
      allBtn.dataset.key = "__ALL__";
      allBtn.classList.add(variant === "core" ? "pill-core" : "pill-extra");
      container.appendChild(allBtn);
    }

    for (const c of categoryList) {
      const isOn = !categoriesAllActive && state.categories.includes(c);
      const b = toggleBtn(label("categories", c), isOn, () => {
        clearPresetLayer();
        let cats = Array.isArray(state.categories) ? [...state.categories] : [];
        const noneSelected = cats.length === 0;
        if (noneSelected) {
          cats = [c];
        } else if (cats.includes(c)) {
          cats = cats.filter(x => x !== c);
        } else {
          cats.push(c);
        }
        if (!cats.length) cats = [];

        state.categories = cats;
        saveLS("wm_categories", state.categories);
        applyFilters();
        rebuildDeck();
        refreshFilterPills();
        render();
        updatePresetActiveClasses();
      });
      b.dataset.key = c;
      b.classList.add(variant === "core" ? "pill-core" : "pill-extra");
      container.appendChild(b);
    }

  };

  bindCategoryButtons($("#coreCategoryChips"), coreCats, { includeClear: true, includeAll: true, variant: "core" });
  bindCategoryButtons($("#allCategoryChips"), extraCats, { includeAll: false, variant: "extra" });

  const trigEl = $("#triggerFilter");
  if (trigEl) {
    trigEl.value = state.triggerQuery || "";
    trigEl.oninput = () => {
      clearPresetLayer();
      state.triggerQuery = trigEl.value;
      saveLS("wm_trig", state.triggerQuery);
      applyFilters();
      rebuildDeck();
      refreshFilterPills();
      render();
      updatePresetActiveClasses();
    };
  }

  refreshFilterPills();
  updatePresetActiveClasses();

  const clearBtn = $("#btnFiltersClear");
  if (clearBtn && clearBtn.dataset._wmClearBound !== "1") {
    clearBtn.dataset._wmClearBound = "1";
    clearBtn.onclick = () => {
      clearFiltersAndRender();
    };
  }

  const isDesktop = window.matchMedia("(min-width: 768px)").matches;
  const quickPacksSection = $("#quickPacksSection");
  if (quickPacksSection && isDesktop) {
    quickPacksSection.open = true;
  }
  const coreFiltersSection = $("#coreFiltersSection");
  if (coreFiltersSection && isDesktop) {
    coreFiltersSection.open = true;
  }

  const moreFiltersPanel = $("#moreFiltersPanel");
  const moreFiltersToggle = $("#moreFiltersToggle");
  const allCategoryChips = $("#allCategoryChips");
  const extraCategoryChips = $("#extraCategoryChips");
  const setMoreFiltersOpen = (isOpen, { save = false } = {}) => {
    state.showMoreFilters = isOpen;
    if (moreFiltersPanel) {
      moreFiltersPanel.classList.toggle("is-hidden", !isOpen);
    }
    if (allCategoryChips) {
      allCategoryChips.classList.toggle("is-hidden", !isOpen);
    }
    if (extraCategoryChips) {
      extraCategoryChips.classList.toggle("is-hidden", !isOpen);
    }
    if (moreFiltersToggle) {
      moreFiltersToggle.setAttribute("aria-expanded", String(isOpen));
      const label = isOpen
        ? LABEL[lang].ui.advancedFiltersOpen
        : LABEL[lang].ui.advancedFiltersClosed;
      const icon = isOpen ? "▴" : "▾";
      const labelEl = moreFiltersToggle.querySelector(".pill-label");
      const iconEl = moreFiltersToggle.querySelector(".pill-icon");
      if (labelEl) labelEl.textContent = label;
      if (iconEl) iconEl.textContent = icon;
      if (!labelEl && !iconEl) moreFiltersToggle.textContent = `${label} ${icon}`;
    }
    if (save) {
      saveLS("wm_show_more_filters", state.showMoreFilters);
    }
  };

  setMoreFiltersOpen(Boolean(state.showMoreFilters));

  if (moreFiltersToggle && moreFiltersToggle.dataset._wmBound !== "1") {
    moreFiltersToggle.dataset._wmBound = "1";
    moreFiltersToggle.addEventListener("click", () => {
      setMoreFiltersOpen(!state.showMoreFilters, { save: true });
    });
  }

  updateFocusIndicator();
}

function applyFilters() {
  const trigRaw = (state.triggerQuery || "").trim();
  const trigTokens = trigRaw
    ? trigRaw.split(",").map(canonicalTrigger).filter(Boolean)
    : [];

  let list = state.rows.slice();

  if (state.sourceScope?.length) {
    const scope = new Set(state.sourceScope.map(normalizeSourcePath));
    list = list.filter(r => scope.has(normalizeSourcePath(r.Source)));
  }

  if (state.presetForceFamily) {
    list = list.filter(r => r.RuleFamily === state.presetForceFamily);
  }

  if (state.presetCategory) {
    list = list.filter(r => r.RuleCategory === state.presetCategory);
  }

  if (state.presetTriggers?.length) {
    const presetSet = new Set(state.presetTriggers);
    list = list.filter(r => presetSet.has(r.TriggerCanon || canonicalTrigger(r.Trigger)));
  }

  const allFamilies = ["Soft","Aspirate","Nasal","None"];
  if (state.families?.length && state.families.length < allFamilies.length) {
    const famSet = new Set(state.families);
    list = list.filter(r => famSet.has(r.RuleFamily));
  }

  if (state.categories?.length) {
    const catSet = new Set(state.categories);
    list = list.filter(r => catSet.has(r.RuleCategory));
  }

  if (trigTokens.length) {
    const trigSet = new Set(trigTokens);
    list = list.filter(r => trigSet.has(r.TriggerCanon || canonicalTrigger(r.Trigger)));
  }

  if (state.presetLimitComplexity && typeof isLikelyComplexRow === "function") {
    list = list.filter(r => !isLikelyComplexRow(r));
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

const STATS_ANIMATED_KEY = "wm_stats_animated";
const STREAK_STORAGE_KEY = "wm_prev_streak";

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function animateNumber(el, to, { duration = 700, suffix = "" } = {}) {
  const target = Number(to) || 0;
  const start = performance.now();
  const from = 0;

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const value = Math.round(from + (target - from) * progress);
    el.textContent = `${value}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

function computeStreaks() {
  const resetAt = Number(state.streakResetAt) || 0;
  const history = state.history
    .filter(h => h && typeof h.t === "number" && h.t >= resetAt);

  if (!history.length) return { current: 0, best: 0 };

  const desc = [...history].sort((a, b) => b.t - a.t);
  let current = 0;
  for (const h of desc) {
    if (h.ok) current += 1;
    else break;
  }

  const asc = [...history].sort((a, b) => a.t - b.t);
  let best = 0;
  let run = 0;
  for (const h of asc) {
    if (h.ok) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }

  return { current, best };
}

function renderStatsPanels() {
  const s = computeStats();
  const streaks = computeStreaks();
  const lang = state.lang || "en";
  const shouldAnimateStats = !prefersReducedMotion() && !sessionStorage.getItem(STATS_ANIMATED_KEY);
  const streakPill = $("#statStreak");
  let previousStreak = Number(loadLS(STREAK_STORAGE_KEY, streaks.current));
  if (!Number.isFinite(previousStreak)) previousStreak = streaks.current;

  if ($("#accBig")) $("#accBig").textContent = `${s.acc}%`;
  if ($("#statsAcc")) $("#statsAcc").textContent = `${s.acc}%`;
  const practiceAccEl = $("#practiceAcc");
  if (practiceAccEl) {
    if (shouldAnimateStats) animateNumber(practiceAccEl, s.acc);
    else practiceAccEl.textContent = `${s.acc}`;
  }
  const practiceStreakEl = $("#practiceStreak");
  if (practiceStreakEl) {
    if (shouldAnimateStats) animateNumber(practiceStreakEl, streaks.current);
    else practiceStreakEl.textContent = `${streaks.current}`;
  }
  if ($("#sessStreak")) $("#sessStreak").textContent = `${streaks.current}`;
  if ($("#sessBestStreak")) {
    const bestLabel = LABEL?.[lang]?.ui?.bestLabel || "Best";
    $("#sessBestStreak").textContent = `${bestLabel}: ${streaks.best}`;
  }
  if (shouldAnimateStats) {
    sessionStorage.setItem(STATS_ANIMATED_KEY, "1");
  }
  if (!prefersReducedMotion() && streaks.current > previousStreak && streakPill) {
    streakPill.classList.remove("pulse");
    void streakPill.offsetWidth;
    streakPill.classList.add("pulse");
    setTimeout(() => streakPill.classList.remove("pulse"), 450);
  }
  saveLS(STREAK_STORAGE_KEY, streaks.current);
  // Translate "correct out of" texts
  if ($("#accText")) {
    if (lang === "cy") {
      $("#accText").textContent = `${s.correct} o ${s.total} yn gywir`;
    } else {
      $("#accText").textContent = `${s.correct} / ${s.total} correct`;
    }
  }
  if ($("#statsText")) {
    if (lang === "cy") {
      $("#statsText").textContent = `${s.correct} yn gywir o ${s.total}`;
    } else {
      $("#statsText").textContent = `${s.correct} correct out of ${s.total}`;
    }
  }

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

function updateViewportMetrics() {
  const vv = window.visualViewport;
  const keyboardOffset = vv
    ? Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0))
    : 0;
  const active = document.activeElement;
  const isTyping = active
    && (active.tagName === "INPUT"
      || active.tagName === "TEXTAREA"
      || active.isContentEditable);
  const effectiveOffset = isTyping ? keyboardOffset : 0;
  const viewportHeight = vv?.height || window.innerHeight;
  document.documentElement.style.setProperty("--viewport-height", `${viewportHeight}px`);
  document.documentElement.style.setProperty("--keyboard-offset", `${effectiveOffset}px`);
  document.body.classList.toggle("keyboard-open", effectiveOffset > 0);
}

function render() {
  $("#practiceView")?.classList.toggle("hidden", state.mode !== "practice");
  $("#browseView")?.classList.toggle("hidden", state.mode !== "browse");
  $("#statsView")?.classList.toggle("hidden", state.mode !== "stats");

  renderPractice();
  if (state.mode === "browse") renderBrowse();
  renderStatsPanels();
  requestAnimationFrame(updateViewportMetrics);
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
    state.cardState = "front";
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
  state.cardState = "front";
  render();
}

setCardCallbacks({
  applyFilters,
  rebuildDeck,
  buildFilters,
  render,
  updateProgressLine,
  nextCard,
  getProgressFocusLabel
});

/* ========= Event wiring ========= */
function wireUi() {
  // NOTE: Do NOT bind the language buttons here. navbar.js owns those buttons.

  initCardUi();

  const filtersDrawer = $("#filtersDrawer");
  const mobileFiltersToggle = $("#mobileFiltersToggle");
  document.addEventListener("click", (event) => {
    const toggle = event.target?.closest?.("#mobileFiltersToggle");
    if (!toggle) return;
    filtersDrawer?.show();
  });
  filtersDrawer?.addEventListener("sl-after-show", () => {
    mobileFiltersToggle?.setAttribute("aria-expanded", "true");
  });
  filtersDrawer?.addEventListener("sl-after-hide", () => {
    mobileFiltersToggle?.setAttribute("aria-expanded", "false");
  });
  $$("[data-close-drawer]").forEach((btn) => {
    btn.addEventListener("click", () => filtersDrawer?.hide());
  });

  applyOnboardDismissedState();
  const openOnboardModal = () => {
    const modal = $("#onboardModal");
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    lockScroll("onboard-modal");
  };
  const closeOnboardModal = () => {
    const modal = $("#onboardModal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    unlockScroll("onboard-modal");
  };

  $("#onboardHelpBtn")?.addEventListener("click", openOnboardModal);
  $$("[data-onboard-open]").forEach((btn) => {
    btn.addEventListener("click", openOnboardModal);
  });
  $$("[data-onboard-close]").forEach((btn) => {
    btn.addEventListener("click", closeOnboardModal);
  });
  $$("[data-onboard-dismiss]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setOnboardDismissed(true);
      applyOnboardDismissedState();
      closeOnboardModal();
    });
  });

  $$("[data-report-close]").forEach((btn) => {
    btn.addEventListener("click", () => closeReportModal());
  });
  $("#reportForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const details = $("#reportDetails")?.value || "";
    if (!details.trim()) {
      $("#reportDetails")?.focus();
      return;
    }
    submitReportIssue(details);
  });

  $("#btnResetStats")?.addEventListener("click", () => { state.history = []; saveLS("wm_hist", state.history); render(); });
  $("#btnResetStats2")?.addEventListener("click", () => { state.history = []; saveLS("wm_hist", state.history); render(); });
  $("#btnResetStatsTop")?.addEventListener("click", () => { state.history = []; saveLS("wm_hist", state.history); render(); });

  $("#btnResetStreak")?.addEventListener("click", () => {
    state.streakResetAt = Date.now();
    saveLS("wm_streak_reset", state.streakResetAt);
    render();
  });
  $("#btnResetStreakTop")?.addEventListener("click", () => {
    state.streakResetAt = Date.now();
    saveLS("wm_streak_reset", state.streakResetAt);
    render();
  });
  $("#btnTop")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modal = $("#onboardModal");
      if (modal && !modal.classList.contains("hidden")) {
        closeOnboardModal();
      }
    }
    const onboardModal = $("#onboardModal");
    if (onboardModal && !onboardModal.classList.contains("hidden")) return;
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
  $("#mbHint")?.addEventListener("click", () => $("#btnHint")?.click());
  $("#mbReveal")?.addEventListener("click", () => $("#btnReveal")?.click());
  $("#mbSkip")?.addEventListener("click", () => $("#btnSkip")?.click());
  $("#mbNext")?.addEventListener("click", () => nextCard(1));

  $("#mobileClearFocus")?.addEventListener("click", () => clearFocusAndRender());
  $("#mobileClearFilters")?.addEventListener("click", () => clearFiltersAndRender());

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) filtersDrawer?.hide();
  });
  const scheduleViewportUpdate = () => requestAnimationFrame(updateViewportMetrics);
  const handleFocusIn = (event) => {
    scheduleViewportUpdate();
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const isTextField = target.matches("input, textarea, [contenteditable='true']");
    if (!isTextField) return;
    const mobileFiltersBody = target.closest("#filtersDrawerBody");
    if (!mobileFiltersBody) return;
    requestAnimationFrame(() => {
      target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    });
  };
  const handleFocusOut = () => scheduleViewportUpdate();
  scheduleViewportUpdate();
  window.addEventListener("resize", scheduleViewportUpdate);
  window.visualViewport?.addEventListener("resize", scheduleViewportUpdate);
  window.visualViewport?.addEventListener("scroll", scheduleViewportUpdate);
  document.addEventListener("focusin", handleFocusIn);
  document.addEventListener("focusout", handleFocusOut);

}

/* ========= Boot ========= */
(async function boot() {
  wireUi();
  await initData();
  // Apply preset from URL (shareable tutor links)
  const preset = (getParam("preset") || "").trim();
  if (preset && PRESET_DEFS[preset]) {
    applyPreset(preset, { fromUrl: true });
  }

  // Apply current language immediately (navbar.js also applies [data-lang] visibility)
  syncLangFromNavbar();
})();
