// override.js
// Override functions and state to support separate pack (preset) and filters
// This script should be loaded after the main mutation-trainer.js script.
// It patches the global functions to add an explicit pack state (activePackKey)
// and resets filters when a pack is selected. It also adjusts the filter
// pipeline so that pack-level restrictions (preset triggers, forced family,
// complexity limits, and source scope) are applied separately from user
// filters.

(function () {
  // -----------------------------
  // Small safe helpers / guards
  // -----------------------------
  const hasFn = (name) => typeof window[name] === "function";
  const safeFn = (name, fallback) => (typeof window[name] === "function" ? window[name] : fallback);
  const safeCanonicalTrigger = (t) => {
    try {
      if (typeof canonicalTrigger === "function") return canonicalTrigger(t);
    } catch (_) {}
    return (t || "").toString().trim().toLowerCase();
  };
  const safeIsLikelyComplexRow = (row) => {
    try {
      if (typeof isLikelyComplexRow === "function") return !!isLikelyComplexRow(row);
    } catch (_) {}
    // If the heuristic isn't available, don't exclude anything.
    return false;
  };
  const safeNormalizeSourcePath = (s) => {
    try {
      if (typeof normalizeSourcePath === "function") return normalizeSourcePath(s);
    } catch (_) {}
    return (s || "")
      .toString()
      .trim()
      .replace(/^https?:\/\/[^/]+\/?/i, "")
      .replace(/^\/+/, "");
  };
  // -----------------------------
  // Extend state (persisted)
  // -----------------------------
  try {
    if (typeof state !== "undefined") {
      state.activePackKey = safeFn("loadLS", () => null)("wm_active_pack", null);
      state.presetForceFamily = safeFn("loadLS", () => null)("wm_preset_force_family", null);
      state.presetLimitComplexity = safeFn("loadLS", () => false)("wm_preset_limit_complexity", false);

      // Track whether Advanced panel is open (IA ticket)
      state.advOpen = safeFn("loadLS", () => false)("wm_adv_open", false);
    }
  } catch (e) {
    console.warn("override.js: failed to extend state", e);
  }

  /**
   * Reset all user-controllable filters back to their defaults.
   * Invoked whenever a pack is selected.
   *
   * Note:
   * - We deliberately clear nilOnly (and later we also hide the UI toggle),
   *   because "Outcome = NONE" already covers it.
   */
  function resetFilters() {
    if (typeof state === "undefined") return;

    state.families = ["Soft", "Aspirate", "Nasal", "None"];
    state.outcomes = ["SM", "AM", "NM", "NONE"];
    state.categories = [];
    state.triggerQuery = "";

    // Nil-only is redundant; keep it false and persist it for backwards compat
    state.nilOnly = false;

    safeFn("saveLS", () => {})("wm_families", state.families);
    safeFn("saveLS", () => {})("wm_outcomes", state.outcomes);
    safeFn("saveLS", () => {})("wm_categories", state.categories);
    safeFn("saveLS", () => {})("wm_trig", state.triggerQuery);
    safeFn("saveLS", () => {})("wm_nil", state.nilOnly);
  }
  window.resetFilters = resetFilters;

  // Preserve references to original functions
  const originalApplyPreset = window.applyPreset;
  const originalClearPresetLayer = window.clearPresetLayer;
  const originalApplyFilters = window.applyFilters;
  const originalBuildFilters = window.buildFilters;

  /**
   * Apply a preset as a PACK (separate pack-level scope from user filters).
   * - Clears existing pack layer
   * - Resets user filters to defaults
   * - Applies pack-level restrictions only
   */
  window.applyPreset = function applyPreset(presetId, opts = {}) {
    const p = typeof PRESET_DEFS !== "undefined" ? PRESET_DEFS[presetId] : null;
    if (!p || typeof state === "undefined") return;

    // Clear any existing preset/preset-layer data without touching filters
    window.clearPresetLayer();

    // Reset all filters to defaults for a clean baseline
    resetFilters();

    // Record which preset/pack is active
    state.activePreset = presetId;
    state.activePackKey = presetId;
    safeFn("saveLS", () => {})("wm_active_preset", state.activePreset);
    safeFn("saveLS", () => {})("wm_active_pack", state.activePackKey);

    // Set source scope if the preset specifies CSV sources
       state.sourceScope = Array.isArray(p.sourceScope)
      ? p.sourceScope.map(safeNormalizeSourcePath)
      : [];
    safeFn("saveLS", () => {})("wm_source_scope", state.sourceScope);

    // Store canonical triggers for this preset
    state.presetTriggers = (p.triggers || []).map(safeCanonicalTrigger).filter(Boolean);
    safeFn("saveLS", () => {})("wm_preset_triggers", state.presetTriggers);

    // Set forced family (pack-level) if provided
    state.presetForceFamily = p.forceFamily || null;
    safeFn("saveLS", () => {})("wm_preset_force_family", state.presetForceFamily);

    // Complexity limitation for certain presets
    state.presetLimitComplexity = !!p.limitComplexity;
    safeFn("saveLS", () => {})("wm_preset_limit_complexity", state.presetLimitComplexity);

    // UX: when applying a preset, collapse advanced categories view
    state.showAllCategories = false;
    safeFn("saveLS", () => {})("wm_show_all_cats", state.showAllCategories);

    // Apply filters and rebuild the deck/UI
    window.applyFilters();
    if (typeof rebuildDeck === "function") rebuildDeck();
    window.buildFilters();
    if (typeof render === "function") render();

    // Refresh filter pills so chip active states reflect current state
    if (typeof refreshFilterPills === "function") {
      try {
        refreshFilterPills();
      } catch (_) {}
    }

    // Update focus indicator and preset button states
    updateFocusIndicator();
    hookPresetToggle();
  };

  /**
   * Clear pack-level restrictions only.
   * Does NOT touch user-selected filters.
   */
  window.clearPresetLayer = function clearPresetLayer() {
    if (typeof state === "undefined") return;

    const hasAnything =
      !!state.activePreset ||
      !!state.activePackKey ||
      (Array.isArray(state.presetTriggers) && state.presetTriggers.length) ||
      (Array.isArray(state.sourceScope) && state.sourceScope.length) ||
      !!state.presetForceFamily ||
      !!state.presetLimitComplexity;

    if (!hasAnything) return;

    state.activePreset = "";
    state.activePackKey = null;
    state.presetTriggers = [];
    state.sourceScope = [];
    state.presetForceFamily = null;
    state.presetLimitComplexity = false;

    safeFn("saveLS", () => {})("wm_active_preset", state.activePreset);
    safeFn("saveLS", () => {})("wm_active_pack", state.activePackKey);
    safeFn("saveLS", () => {})("wm_preset_triggers", state.presetTriggers);
    safeFn("saveLS", () => {})("wm_source_scope", state.sourceScope);
    safeFn("saveLS", () => {})("wm_preset_force_family", state.presetForceFamily);
    safeFn("saveLS", () => {})("wm_preset_limit_complexity", state.presetLimitComplexity);

    if (typeof refreshFilterPills === "function") {
      try {
        refreshFilterPills();
      } catch (_) {}
    }

    updateFocusIndicator();
    hookPresetToggle();
  };

  /**
   * Apply filters with a two-layer pipeline:
   * 1) Pack-level restrictions (source scope, forced family, preset triggers)
   * 2) User filters (families/outcomes/categories/triggerQuery)
   * 3) Pack-level complexity clamp (if enabled)
   *
   * Notes:
   * - Nil-only is treated as legacy; we keep logic for backwards compatibility,
   *   but the UI toggle is hidden in buildFilters.
   */
  window.applyFilters = function applyFilters() {
    if (typeof state === "undefined") return;

    const trigRaw = (state.triggerQuery || "").trim();
    const trigTokens = trigRaw
      ? trigRaw.split(",").map(safeCanonicalTrigger).filter(Boolean)
      : [];

    // Start with all rows
    let list = Array.isArray(state.rows) ? state.rows.slice() : [];

    // Pack-level: restrict by CSV sources if provided
    if (Array.isArray(state.sourceScope) && state.sourceScope.length) {
    const scope = new Set(state.sourceScope.map(safeNormalizeSourcePath));
      list = list.filter((r) => scope.has(safeNormalizeSourcePath(r.Source)));
    }

    // Pack-level: restrict by forced family
    if (state.presetForceFamily) {
      list = list.filter((r) => r.RuleFamily === state.presetForceFamily);
    }

    // Pack-level: restrict by preset triggers
    if (Array.isArray(state.presetTriggers) && state.presetTriggers.length) {
      const presetSet = new Set(state.presetTriggers);
      list = list.filter((r) => presetSet.has(r.TriggerCanon || safeCanonicalTrigger(r.Trigger)));
    }

    // User filters: families (only apply if not all families are selected)
    const allFamilies = ["Soft", "Aspirate", "Nasal", "None"];
    if (
      Array.isArray(state.families) &&
      state.families.length &&
      state.families.length < allFamilies.length
    ) {
      const famSet = new Set(state.families);
      list = list.filter((r) => famSet.has(r.RuleFamily));
    }

    // User filters: outcomes (apply only if not all outcomes selected)
    const allOutcomes = ["SM", "AM", "NM", "NONE"];
    if (
      Array.isArray(state.outcomes) &&
      state.outcomes.length &&
      state.outcomes.length < allOutcomes.length
    ) {
      const outSet = new Set(state.outcomes.map((x) => (x || "").toUpperCase()));
      list = list.filter((r) => outSet.has((r.Outcome || "").toUpperCase()));
    }

    // User filters: categories (apply if any selected)
    if (Array.isArray(state.categories) && state.categories.length) {
      const catSet = new Set(state.categories);
      list = list.filter((r) => catSet.has(r.RuleCategory));
    }

    // Advanced filter: trigger query (comma-separated tokens)
    if (trigTokens.length) {
      const trigSet = new Set(trigTokens);
      list = list.filter((r) => trigSet.has(r.TriggerCanon || safeCanonicalTrigger(r.Trigger)));
    }

    // Legacy advanced filter: nil-only (redundant; keep for backwards compat)
    if (state.nilOnly) {
      list = list.filter((r) => {
        const out = (r.Outcome || "").toUpperCase();
        return out === "NONE" || r.RuleFamily === "None";
      });
    }

    // Pack-level: complexity limit (if enabled by preset)
    if (state.presetLimitComplexity) {
      list = list.filter((r) => !safeIsLikelyComplexRow(r));
    }

    state.filtered = list;
  };

  /**
   * buildFilters wrapper:
   * - Ensures Advanced can be collapsed/expanded and persists open state.
   * - Adds Clear filters button behaviour.
   * - Removes duplicate category buttons from Advanced where Core has them.
   * - Hides the redundant nil-only UI.
   * - Rebinds filter buttons so they do NOT clear the active preset.
   */
  window.buildFilters = function buildFiltersWrapper() {
    // Build base UI first
    if (typeof originalBuildFilters === "function") {
      originalBuildFilters();
    }

    try {
      const lang = (state && state.lang) || "en";

      // ---- Advanced panel collapse/expand (robust to differing markup)
      // Expected (if present):
      // - container: #advancedPanel OR #advancedFilters
      // - toggle: #btnToggleAdvanced OR [data-adv-toggle]
      const advPanel =
        document.getElementById("advancedPanel") ||
        document.getElementById("advancedFilters") ||
        document.querySelector("[data-advanced-panel]");
      const advToggle =
        document.getElementById("btnToggleAdvanced") ||
        document.querySelector("[data-adv-toggle]");

      if (advPanel) {
        // Default collapse unless user has explicitly opened it
        const open = !!(state && state.advOpen);
        advPanel.classList.toggle("hidden", !open);
        advPanel.setAttribute("aria-hidden", open ? "false" : "true");
      }

      if (advToggle && advPanel) {
        if (advToggle.dataset._wmAdvBound !== "1") {
          advToggle.dataset._wmAdvBound = "1";
          advToggle.onclick = (e) => {
            e.preventDefault();
            const isHidden = advPanel.classList.contains("hidden");
            const nextOpen = isHidden; // if hidden -> open
            advPanel.classList.toggle("hidden", !nextOpen);
            advPanel.setAttribute("aria-hidden", nextOpen ? "false" : "true");
            if (state) state.advOpen = nextOpen;
            safeFn("saveLS", () => {})("wm_adv_open", !!nextOpen);
          };
        }
      }

      // ---- Remove duplicate categories from the advanced container
      const advContainer = document.getElementById("catBtns");
      const common = typeof COMMON_CATEGORIES !== "undefined" ? new Set(COMMON_CATEGORIES) : new Set();
      if (advContainer) {
        Array.from(advContainer.querySelectorAll("button")).forEach((btn) => {
          const key = btn.dataset.key;
          if (key && common.has(key)) btn.remove();
        });
      }

      // ---- Headings (avoid relying on missing LABEL paths)
      const coreTitle = document.getElementById("coreFiltersTitle");
      const advCatTitle = document.getElementById("advCategoriesTitle");
      if (coreTitle) coreTitle.textContent = lang === "cy" ? "Hidlydd craidd" : "Core filters";
      if (advCatTitle) advCatTitle.textContent = lang === "cy" ? "Categorïau" : "Categories";

      // ---- Hide nil-only controls (redundant with Outcome=NONE)
      // Try a few likely wrappers/IDs; if not found, no-op.
      const nilCheckbox = document.getElementById("nilOnly");
      const nilWrap =
        document.getElementById("nilOnlyWrap") ||
        document.getElementById("nilOnlyRow") ||
        (nilCheckbox ? nilCheckbox.closest("label") : null) ||
        (nilCheckbox ? nilCheckbox.closest("div") : null);

      if (nilWrap) nilWrap.classList.add("hidden");
      if (nilCheckbox) {
        // Force off to avoid confusing filtering through hidden control
        nilCheckbox.checked = false;
        if (state) state.nilOnly = false;
        safeFn("saveLS", () => {})("wm_nil", false);
      }

      // ---- Clear filters button handler
      const clr = document.getElementById("btnCoreClear");
      if (clr && clr.dataset._wmClrBound !== "1") {
        clr.dataset._wmClrBound = "1";
        clr.onclick = () => {
          resetFilters(); // keep preset
          window.applyFilters();
          if (typeof rebuildDeck === "function") rebuildDeck();
          window.buildFilters(); // call wrapper (not the original) so patches persist
          if (typeof render === "function") render();
          if (typeof refreshFilterPills === "function") {
            try { refreshFilterPills(); } catch (_) {}
          }
          updateFocusIndicator();
          hookPresetToggle();
        };
      }

      // After base UI changes, refresh toggles/pills
      updateFocusIndicator();
      hookPresetToggle();
      if (typeof refreshFilterPills === "function") {
        try { refreshFilterPills(); } catch (_) {}
      }

      // ---- Rebind core filter buttons so they do NOT clear the active preset
      (function rebindCoreFilters() {
        const allFamilies = ["Soft", "Aspirate", "Nasal", "None"];
        const allOutcomes = ["SM", "AM", "NM", "NONE"];

        // Guarded pill refresh
        const safeRefreshPills = () => {
          if (typeof refreshFilterPills === "function") {
            try { refreshFilterPills(); } catch (_) {}
          }
        };

        function rerun() {
          window.applyFilters();
          if (typeof rebuildDeck === "function") rebuildDeck();
          safeRefreshPills();
          if (typeof render === "function") render();
          updateFocusIndicator();
          hookPresetToggle();
        }

        // Families
        const famEl = document.getElementById("familyBtns");
        if (famEl) {
          famEl.querySelectorAll("button").forEach((btn) => {
            const key = btn.dataset.key;
            if (!key) return;
            if (btn.dataset._wmFamBound === "1") return;
            btn.dataset._wmFamBound = "1";

            btn.onclick = (e) => {
              e.preventDefault();
              let fams = Array.isArray(state.families) && state.families.length
                ? [...state.families]
                : [...allFamilies];

              if (key === "__ALL__") {
                fams = [...allFamilies];
              } else {
                const allActive = fams.length === allFamilies.length;
                if (allActive) fams = [key];
                else if (fams.includes(key)) fams = fams.filter((f) => f !== key);
                else fams.push(key);
                if (!fams.length) fams = [...allFamilies];
              }

              state.families = fams;
              safeFn("saveLS", () => {})("wm_families", state.families);
              rerun();
            };
          });
        }

        // Outcomes
        const outEl = document.getElementById("outcomeBtns");
        if (outEl) {
          outEl.querySelectorAll("button").forEach((btn) => {
            const key = btn.dataset.key;
            if (!key) return;
            if (btn.dataset._wmOutBound === "1") return;
            btn.dataset._wmOutBound = "1";

            btn.onclick = (e) => {
              e.preventDefault();
              let outs = Array.isArray(state.outcomes) && state.outcomes.length
                ? [...state.outcomes]
                : [...allOutcomes];

              if (key === "__ALL__") {
                outs = [...allOutcomes];
              } else {
                const allActive = outs.length === allOutcomes.length;
                if (allActive) outs = [key];
                else if (outs.includes(key)) outs = outs.filter((o) => o !== key);
                else outs.push(key);
                if (!outs.length) outs = [...allOutcomes];
              }

              state.outcomes = outs;
              safeFn("saveLS", () => {})("wm_outcomes", state.outcomes);
              rerun();
            };
          });
        }

        // Categories (basic + advanced)
        function bindCategoryContainer(contId) {
          const cont = document.getElementById(contId);
          if (!cont) return;
          cont.querySelectorAll("button").forEach((btn) => {
            const key = btn.dataset.key;
            if (!key) return;
            if (btn.dataset._wmCatBound === "1") return;
            btn.dataset._wmCatBound = "1";

            btn.onclick = (e) => {
              e.preventDefault();
              let cats = Array.isArray(state.categories) ? [...state.categories] : [];

              if (key === "__ALL__") {
                cats = [];
              } else {
                const noneSelected = cats.length === 0;
                if (noneSelected) cats = [key];
                else if (cats.includes(key)) cats = cats.filter((c) => c !== key);
                else cats.push(key);

                // empty list means "no category filter"
                if (!cats.length) cats = [];
              }

              state.categories = cats;
              safeFn("saveLS", () => {})("wm_categories", state.categories);
              rerun();
            };
          });
        }
        bindCategoryContainer("basicCatBtns");
        bindCategoryContainer("catBtns");

        // Trigger input
        const trigEl = document.getElementById("triggerFilter");
        if (trigEl && trigEl.dataset._wmTrigBound !== "1") {
          trigEl.dataset._wmTrigBound = "1";
          trigEl.oninput = () => {
            state.triggerQuery = trigEl.value;
            safeFn("saveLS", () => {})("wm_trig", state.triggerQuery);
            rerun();
          };
        }

        // Nil-only checkbox (hidden, but still bind safely in case markup differs)
        const nilEl = document.getElementById("nilOnly");
        if (nilEl && nilEl.dataset._wmNilBound !== "1") {
          nilEl.dataset._wmNilBound = "1";
          nilEl.onchange = () => {
            // Immediately force off (redundant); keep state consistent
            nilEl.checked = false;
            state.nilOnly = false;
            safeFn("saveLS", () => {})("wm_nil", false);
            rerun();
          };
        }
      })();
    } catch (e) {
      console.warn("override.js: buildFilters wrapper error", e);
    }
  };

  /**
   * Focus indicator: shows current active pack title.
   */
  function updateFocusIndicator() {
    try {
      const el = document.getElementById("focusIndicator");
      if (!el || typeof state === "undefined") return;

      const key = state.activePackKey || state.activePreset;
      if (key) {
        const presetDef = typeof PRESET_DEFS !== "undefined" ? PRESET_DEFS[key] : null;
        const lang = state.lang || "en";

        let title = key;
        try {
          if (presetDef && presetDef.titleKey && typeof LABEL !== "undefined") {
            title = (LABEL?.[lang]?.presets?.[presetDef.titleKey]) || key;
          }
        } catch (_) {}

        const focusLabel =
          (typeof LABEL !== "undefined" ? LABEL?.[lang]?.headings?.focus : null) ||
          (lang === "cy" ? "Ffocws" : "Focus");

        el.textContent = `${focusLabel}: ${title}`;
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
    } catch (e) {
      console.warn("override.js: failed to update focus indicator", e);
    }
  }

  /**
   * Preset buttons behave as toggles.
   *
   * IMPORTANT PATCH:
   * - Do NOT use addEventListener repeatedly (it stacks duplicates).
   * - Use a single onclick handler per button, guarded by a dataset flag.
   */
  function hookPresetToggle() {
    try {
      if (typeof state === "undefined") return;

      const btns = Array.from(document.querySelectorAll("[data-preset]"));
      btns.forEach((btn) => {
        const id = btn.getAttribute("data-preset");
        if (!id) return;

        const isActive = (state.activePackKey || state.activePreset) === id;
        btn.setAttribute("aria-pressed", isActive ? "true" : "false");
        btn.classList.toggle("preset-on", isActive);

        // Bind once
        if (btn.dataset._wmPresetBound === "1") return;
        btn.dataset._wmPresetBound = "1";

        btn.onclick = (e) => {
          e.preventDefault();

          const current = state.activePackKey || state.activePreset;
          if (current && current === id) {
            window.clearPresetLayer();
            window.applyFilters();
            if (typeof rebuildDeck === "function") rebuildDeck();
            window.buildFilters();
            if (typeof render === "function") render();
          } else {
            window.applyPreset(id);
          }

          updateFocusIndicator();

          // Update pressed states for all
          btns.forEach((el) => {
            const pid = el.getAttribute("data-preset");
            const active = (state.activePackKey || state.activePreset) === pid;
            el.setAttribute("aria-pressed", active ? "true" : "false");
            el.classList.toggle("preset-on", active);
          });
        };
      });
    } catch (e) {
      console.warn("override.js: failed to hook preset toggles", e);
    }
  }

  window.updateFocusIndicator = updateFocusIndicator;
  window.hookPresetToggle = hookPresetToggle;

  // Initialise toggle behaviour and indicator once DOM is ready
  function init() {
    try {
      hookPresetToggle();
      updateFocusIndicator();
    } catch (_) {}
  }

  if (document.readyState !== "loading") {
    setTimeout(init, 0);
  } else {
    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 0));
  }
})();

