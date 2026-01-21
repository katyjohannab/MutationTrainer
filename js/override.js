// Override functions and state to support separate pack (preset) and filters
// This script should be loaded after the main mutation-trainer.js script.
// It patches the global functions to add an explicit pack state (activePackKey)
// and resets filters when a pack is selected. It also adjusts the filter
// pipeline so that pack-level restrictions (preset triggers, forced family,
// complexity limits, and source scope) are applied separately from user
// filters. See ticket for details.

(function () {
  // Extend the existing state with new properties for pack-level behaviour
  // The main script defines `state` and helper functions like loadLS/saveLS.
  // We read from localStorage where appropriate to persist across sessions.
  try {
    if (typeof state !== "undefined") {
      state.activePackKey = loadLS("wm_active_pack", null);
      state.presetForceFamily = loadLS("wm_preset_force_family", null);
      state.presetLimitComplexity = loadLS("wm_preset_limit_complexity", false);
    }
  } catch (e) {
    // In case something goes wrong, fail silently. The main script will still work.
    console.warn("override.js: failed to extend state", e);
  }

  /**
   * Reset all user-controllable filters back to their defaults. This function
   * is invoked whenever a pack is selected. It leaves pack-level state
   * untouched, but clears families, outcomes, categories, trigger query and
   * nil-only flags to their initial values and persists them to localStorage.
   */
  function resetFilters() {
    // The default family/outcome sets are defined in the main script. We
    // explicitly enumerate them here to avoid referencing internal constants.
    state.families = ["Soft", "Aspirate", "Nasal", "None"];
    state.outcomes = ["SM", "AM", "NM", "NONE"];
    state.categories = [];
    state.triggerQuery = "";
    state.nilOnly = false;
    saveLS("wm_families", state.families);
    saveLS("wm_outcomes", state.outcomes);
    saveLS("wm_categories", state.categories);
    saveLS("wm_trig", state.triggerQuery);
    saveLS("wm_nil", state.nilOnly);
  }

  // Expose resetFilters in case other modules wish to call it
  window.resetFilters = resetFilters;

  // Preserve references to the original functions in case we need them
  const originalApplyPreset = window.applyPreset;
  const originalClearPresetLayer = window.clearPresetLayer;
  const originalApplyFilters = window.applyFilters;
  const originalBuildFilters = window.buildFilters;

  function updateFocusIndicator() {
    try {
      const el = document.getElementById("focusIndicator");
      if (!el) return;

      const key = state?.activePackKey || null;

      if (!key) {
        el.classList.add("hidden");
        el.textContent = "";
        return;
      }

      // Prefer label from PRESET_DEFS, fall back to key
      const p = (typeof PRESET_DEFS !== "undefined") ? PRESET_DEFS[key] : null;
      const name = (p && (p.labelCY || p.labelEN || p.label)) ? (p.labelCY || p.labelEN || p.label) : key;

      // NOTE: language toggle wiring is handled in main script;
      // we keep this simple here.
      el.textContent = `Focus: ${name}`;
      el.classList.remove("hidden");
    } catch (e) {
      console.warn("override.js: updateFocusIndicator failed", e);
    }
  }

  function hookPresetToggle() {
    try {
      const wrap = document.getElementById("presetBtns");
      if (!wrap) return;

      const btns = Array.from(wrap.querySelectorAll("button, [role='button']"));
      if (!btns.length) return;

      const active = state?.activePackKey || null;

      btns.forEach((btn) => {
        const presetId = btn.dataset?.presetId || btn.getAttribute("data-preset-id") || btn.value || btn.id;
        if (!presetId) return;

        // aria-pressed + visual state
        const isOn = active === presetId;
        btn.setAttribute("aria-pressed", isOn ? "true" : "false");
        btn.classList.toggle("preset-on", isOn);

        // Only bind once
        if (btn.dataset._wmBound === "1") return;
        btn.dataset._wmBound = "1";

        btn.addEventListener("click", (e) => {
          e.preventDefault();
          // Toggle off if clicking active preset again
          if (state.activePackKey === presetId) {
            window.clearPresetLayer();
            window.applyFilters();
            rebuildDeck();
            buildFilters();
            render();
            updateFocusIndicator();
            hookPresetToggle();
            return;
          }
          window.applyPreset(presetId);
        });
      });
    } catch (e) {
      console.warn("override.js: hookPresetToggle failed", e);
    }
  }

  // Initialise focus indicator on load
  document.addEventListener("DOMContentLoaded", () => {
    updateFocusIndicator();
    hookPresetToggle();
  });

  /**
   * Override applyPreset to separate pack-level state from user filters. When a
   * pack is selected, we clear any existing pack, reset user filters to
   * defaults, and then apply only the pack-level restrictions (triggers,
   * source scope, forced family, complexity limit). We deliberately do not
   * auto-select any categories or families for the user.
   *
   * @param {string} presetId The ID of the preset to apply
   * @param {Object} opts Optional options, currently unused
   */
  window.applyPreset = function applyPreset(presetId, opts = {}) {
    const p = (typeof PRESET_DEFS !== "undefined") ? PRESET_DEFS[presetId] : null;
    if (!p) return;

    // Clear any existing preset/preset-layer data without touching filters
    window.clearPresetLayer();

    // Reset all filters to defaults for a clean baseline
    resetFilters();

    // Record which preset/pack is active
    state.activePreset = presetId;
    state.activePackKey = presetId;
    saveLS("wm_active_preset", state.activePreset);
    saveLS("wm_active_pack", state.activePackKey);

    // Set source scope if the preset specifies CSV sources
    state.sourceScope = Array.isArray(p.sourceScope) ? [...p.sourceScope] : [];
    saveLS("wm_source_scope", state.sourceScope);

    // Store canonical triggers for this preset
    state.presetTriggers = (p.triggers || []).map(canonicalTrigger).filter(Boolean);
    saveLS("wm_preset_triggers", state.presetTriggers);

    // Set forced family (pack-level) if provided
    state.presetForceFamily = p.forceFamily || null;
    saveLS("wm_preset_force_family", state.presetForceFamily);

    // Complexity limitation for certain presets
    state.presetLimitComplexity = !!p.limitComplexity;
    saveLS("wm_preset_limit_complexity", state.presetLimitComplexity);

    // UX: when applying a preset, collapse advanced categories view
    state.showAllCategories = false;
    saveLS("wm_show_all_cats", state.showAllCategories);

    // Apply filters and rebuild the deck/UI
    window.applyFilters();
    rebuildDeck();
    buildFilters();
    render();

    // Update focus indicator and preset button states
    updateFocusIndicator();
    hookPresetToggle();
  };

  /**
   * Override clearPresetLayer to remove pack-level restrictions and related
   * state. This does not touch the user's current filter selections. It
   * ensures that clearing a preset returns the pool to all data sources and
   * removes preset-specific trigger/family/complexity constraints.
   */
  window.clearPresetLayer = function clearPresetLayer() {
    // Bail if there is no active preset or pack-level data
    if (!state.activePreset && !state.presetTriggers?.length && !state.sourceScope?.length && !state.activePackKey) {
      return;
    }
    state.activePreset = "";
    state.activePackKey = null;
    state.presetTriggers = [];
    state.sourceScope = [];
    state.presetForceFamily = null;
    state.presetLimitComplexity = false;
    saveLS("wm_active_preset", state.activePreset);
    saveLS("wm_active_pack", state.activePackKey);
    saveLS("wm_preset_triggers", state.presetTriggers);
    saveLS("wm_source_scope", state.sourceScope);
    saveLS("wm_preset_force_family", state.presetForceFamily);
    saveLS("wm_preset_limit_complexity", state.presetLimitComplexity);

    updateFocusIndicator();
    hookPresetToggle();
  };

  /**
   * Override applyFilters to apply pack-level restrictions before user filters.
   * The pipeline is:
   * 1. Start with the full list of rows.
   * 2. Restrict by pack-level: source scope, forced family, preset triggers.
   * 3. Apply user filters: families, outcomes, categories (skipping if all
   *    options are selected).
   * 4. Apply advanced filters: trigger query, nil-only flag.
   * 5. Finally, apply complexity limit if enabled by the preset.
   */
  window.applyFilters = function applyFilters() {
    const trigRaw = (state.triggerQuery || "").trim();
    const trigTokens = trigRaw ? trigRaw.split(",").map(canonicalTrigger).filter(Boolean) : [];

    // Start with all rows
    let list = Array.isArray(state.rows) ? state.rows.slice() : [];

    // Pack-level: restrict by CSV sources if provided
    if (state.sourceScope && state.sourceScope.length) {
      const scope = new Set(state.sourceScope);
      list = list.filter(r => scope.has(r.Source));
    }

    // Pack-level: restrict by forced family
    if (state.presetForceFamily) {
      list = list.filter(r => r.RuleFamily === state.presetForceFamily);
    }

    // Pack-level: restrict by preset triggers
    if (state.presetTriggers && state.presetTriggers.length) {
      const presetSet = new Set(state.presetTriggers);
      list = list.filter(r => presetSet.has(r.TriggerCanon || canonicalTrigger(r.Trigger)));
    }

    // User filters: families (only apply if not all families are selected)
    const allFamilies = ["Soft", "Aspirate", "Nasal", "None"];
    if (Array.isArray(state.families) && state.families.length && state.families.length < allFamilies.length) {
      const famSet = new Set(state.families);
      list = list.filter(r => famSet.has(r.RuleFamily));
    }

    // User filters: outcomes (apply only if not all outcomes selected)
    const allOutcomes = ["SM", "AM", "NM", "NONE"];
    if (Array.isArray(state.outcomes) && state.outcomes.length && state.outcomes.length < allOutcomes.length) {
      const outSet = new Set(state.outcomes);
      list = list.filter(r => outSet.has((r.Outcome || "").toUpperCase()));
    }

    // User filters: categories (apply if any selected)
    if (Array.isArray(state.categories) && state.categories.length) {
      const catSet = new Set(state.categories);
      list = list.filter(r => catSet.has(r.RuleCategory));
    }

    // Advanced filter: trigger query (comma-separated tokens)
    if (trigTokens.length) {
      const trigSet = new Set(trigTokens);
      list = list.filter(r => trigSet.has(r.TriggerCanon || canonicalTrigger(r.Trigger)));
    }

    // Advanced filter: nil-only (no mutation expected)
    if (state.nilOnly) {
      list = list.filter(r => {
        const out = (r.Outcome || "").toUpperCase();
        return out === "NONE" || r.RuleFamily === "None";
      });
    }

    // Pack-level: complexity limit (e.g. for articles preset)
    if (state.presetLimitComplexity) {
      list = list.filter(r => !isLikelyComplexRow(r));
    }

    state.filtered = list;
  };

  /**
   * Ticket 2: Filter panel IA
   * - Advanced collapsed by default
   * - Clear filters button in Core
   * - Admin tools moved into Advanced
   * We override buildFilters to:
   * 1) ensure adv is collapsed unless user opened it,
   * 2) wire Clear filters,
   * 3) ensure admin tools are only visible in advanced.
   */
  window.buildFilters = function buildFilters() {
    if (typeof originalBuildFilters === "function") {
      originalBuildFilters();
    }

    // Ensure Advanced is collapsed by default (unless user explicitly opened it previously)
    const adv = document.getElementById("advFilters");
    if (adv && adv.open && !loadLS("wm_adv_open", false)) {
      adv.open = false;
    }
    if (adv) {
      adv.addEventListener("toggle", () => {
        try { saveLS("wm_adv_open", !!adv.open); } catch (_) {}
      }, { passive: true });
    }

    // Wire Clear filters (Core)
    const btn = document.getElementById("btnCoreClear");
    if (btn && btn.dataset._wmBound !== "1") {
      btn.dataset._wmBound = "1";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        // Reset user filters only (do not clear preset pack)
        resetFilters();
        window.applyFilters();
        rebuildDeck();
        buildFilters();
        render();
        updateFocusIndicator();
        hookPresetToggle();
      });
    }

    // Admin tools are moved into Advanced in HTML; ensure hidden unless advanced open
    const adminWrap = document.getElementById("adminPanel");
    if (adminWrap) {
      const isOpen = adv ? !!adv.open : false;
      adminWrap.classList.toggle("hidden", !isOpen);
      if (adv && adv.dataset._wmAdminHook !== "1") {
        adv.dataset._wmAdminHook = "1";
        adv.addEventListener("toggle", () => {
          adminWrap.classList.toggle("hidden", !adv.open);
        });
      }
    }
  };

})();
