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

    // After rebuilding UI, refresh filter pills so chip active states reflect the
    // current filters (and not any prior DOM toggles).  The original script
    // attaches refreshFilterPills globally; guard usage in case it is undefined.
    if (typeof refreshFilterPills === 'function') {
      try { refreshFilterPills(); } catch (_) {}
    }

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

    // After clearing preset, refresh filter pills so chip active states reset
    if (typeof refreshFilterPills === 'function') {
      try { refreshFilterPills(); } catch (_) {}
    }
    // Update indicator and toggle states
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
  window.buildFilters = function buildFiltersWrapper() {
    // Call the original buildFilters to build the base UI
    if (typeof originalBuildFilters === 'function') {
      originalBuildFilters();
    }
    try {
      // Remove duplicate categories from the advanced section
      const advContainer = document.getElementById('catBtns');
      const common = (typeof COMMON_CATEGORIES !== 'undefined') ? new Set(COMMON_CATEGORIES) : new Set();
      if (advContainer) {
        Array.from(advContainer.children).forEach(btn => {
          const key = btn.dataset.key;
          if (key && common.has(key)) {
            btn.remove();
          }
        });
      }
      // Update heading translations if available
      const lang = state.lang || 'en';
      const coreTitle = document.getElementById('coreFiltersTitle');
      const advCatTitle = document.getElementById('advCategoriesTitle');
      if (coreTitle) {
        const text = (LABEL?.[lang]?.headings?.categories) ? LABEL[lang].headings.categories : coreTitle.textContent;
        // Use "Filters" or similar wording when translation isn't defined
        coreTitle.textContent = (lang === 'cy' ? 'Hidlydd craidd' : 'Core filters');
      }
      if (advCatTitle) {
        advCatTitle.textContent = (lang === 'cy' ? 'Categorïau uwch' : 'Categories');
      }
      // Attach clear filters button handler
      const clr = document.getElementById('btnCoreClear');
      if (clr) {
        clr.onclick = () => {
          // Reset user filters to defaults but keep the current preset (activePack)
          resetFilters();
          // Persist and refresh UI
          window.applyFilters();
          rebuildDeck();
          // Rebuild filters UI (this will call this wrapper again)
          originalBuildFilters();
          // Refresh chips and preset toggles
          updateFocusIndicator();
          hookPresetToggle();
          // Rerender practice card etc.
          render();
        };
      }
      // After any modifications, refresh preset toggles and focus indicator
      updateFocusIndicator();
      hookPresetToggle();
      // Refresh filter pills so DOM chips reflect current filter state
      if (typeof refreshFilterPills === 'function') {
        try { refreshFilterPills(); } catch (_) {}
      }

      /*
       * Rebind core filter buttons so they do NOT clear the active preset.
       * Families, outcomes, categories, trigger input and nilOnly should
       * simply adjust their respective state properties and filter within
       * the current preset scope.
       */
      (function rebindCoreFilters() {
        const allFamilies = ["Soft","Aspirate","Nasal","None"];
        const famEl = document.getElementById('familyBtns');
        if (famEl) {
          const famButtons = Array.from(famEl.querySelectorAll('button'));
          famButtons.forEach(btn => {
            const key = btn.dataset.key;
            if (!key) return;
            if (btn.dataset._wmFamBound === '1') return;
            btn.dataset._wmFamBound = '1';
            btn.onclick = (e) => {
              e.preventDefault();
              let fams = Array.isArray(state.families) && state.families.length ? [...state.families] : [...allFamilies];
              const isAll = key === '__ALL__';
              if (isAll) {
                fams = [...allFamilies];
              } else {
                const allActive = fams.length === allFamilies.length;
                if (allActive) {
                  fams = [key];
                } else if (fams.includes(key)) {
                  fams = fams.filter(f => f !== key);
                } else {
                  fams.push(key);
                }
                if (!fams.length) fams = [...allFamilies];
              }
              state.families = fams;
              saveLS('wm_families', state.families);
              window.applyFilters();
              rebuildDeck();
              refreshFilterPills();
              render();
              updateFocusIndicator();
              hookPresetToggle();
            };
          });
        }
        const allOutcomes = ["SM","AM","NM","NONE"];
        const outEl = document.getElementById('outcomeBtns');
        if (outEl) {
          const outButtons = Array.from(outEl.querySelectorAll('button'));
          outButtons.forEach(btn => {
            const key = btn.dataset.key;
            if (!key) return;
            if (btn.dataset._wmOutBound === '1') return;
            btn.dataset._wmOutBound = '1';
            btn.onclick = (e) => {
              e.preventDefault();
              let outs = Array.isArray(state.outcomes) && state.outcomes.length ? [...state.outcomes] : [...allOutcomes];
              const isAll = key === '__ALL__';
              if (isAll) {
                outs = [...allOutcomes];
              } else {
                const allActive = outs.length === allOutcomes.length;
                if (allActive) {
                  outs = [key];
                } else if (outs.includes(key)) {
                  outs = outs.filter(o => o !== key);
                } else {
                  outs.push(key);
                }
                if (!outs.length) outs = [...allOutcomes];
              }
              state.outcomes = outs;
              saveLS('wm_outcomes', state.outcomes);
              window.applyFilters();
              rebuildDeck();
              refreshFilterPills();
              render();
              updateFocusIndicator();
              hookPresetToggle();
            };
          });
        }
        // Categories: handle both basic and advanced containers
        function bindCategoryContainer(contId) {
          const cont = document.getElementById(contId);
          if (!cont) return;
          const buttons = Array.from(cont.querySelectorAll('button'));
          buttons.forEach(btn => {
            const key = btn.dataset.key;
            if (!key) return;
            if (btn.dataset._wmCatBound === '1') return;
            btn.dataset._wmCatBound = '1';
            btn.onclick = (e) => {
              e.preventDefault();
              let cats = Array.isArray(state.categories) ? [...state.categories] : [];
              const isAll = key === '__ALL__';
              if (isAll) {
                cats = [];
              } else {
                const allActive = cats.length === 0;
                if (allActive) {
                  cats = [key];
                } else if (cats.includes(key)) {
                  cats = cats.filter(c => c !== key);
                } else {
                  cats.push(key);
                }
                if (!cats.length) cats = [];
              }
              state.categories = cats;
              saveLS('wm_categories', state.categories);
              window.applyFilters();
              rebuildDeck();
              refreshFilterPills();
              render();
              updateFocusIndicator();
              hookPresetToggle();
            };
          });
        }
        bindCategoryContainer('basicCatBtns');
        bindCategoryContainer('catBtns');
        // Trigger filter
        const trigEl = document.getElementById('triggerFilter');
        if (trigEl && trigEl.dataset._wmTrigBound !== '1') {
          trigEl.dataset._wmTrigBound = '1';
          trigEl.oninput = () => {
            state.triggerQuery = trigEl.value;
            saveLS('wm_trig', state.triggerQuery);
            window.applyFilters();
            rebuildDeck();
            refreshFilterPills();
            render();
            updateFocusIndicator();
            hookPresetToggle();
          };
        }
        // Nil only checkbox
        const nilEl = document.getElementById('nilOnly');
        if (nilEl && nilEl.dataset._wmNilBound !== '1') {
          nilEl.dataset._wmNilBound = '1';
          nilEl.onchange = () => {
            state.nilOnly = Boolean(nilEl.checked);
            saveLS('wm_nil', state.nilOnly);
            window.applyFilters();
            rebuildDeck();
            refreshFilterPills();
            render();
            updateFocusIndicator();
            hookPresetToggle();
          };
        }
      })();
    } catch (e) {
      console.warn('override.js: buildFilters wrapper error', e);
    }
  };

  /**
   * Update the visible focus indicator based on the current active pack.
   * Shows "Focus: [title]" or hides the element when no pack is active.
   */
  function updateFocusIndicator() {
    try {
      const el = document.getElementById('focusIndicator');
      if (!el) return;
      const key = state.activePackKey || state.activePreset;
      if (key) {
        const presetDef = (typeof PRESET_DEFS !== 'undefined') ? PRESET_DEFS[key] : null;
        const lang = state.lang || 'en';
        const title = presetDef ? (LABEL?.[lang]?.presets?.[presetDef.titleKey] || key) : key;
        const focusLabel = LABEL?.[lang]?.headings?.focus || (lang === 'cy' ? 'Ffocws' : 'Focus');
        el.textContent = `${focusLabel}: ${title}`;
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    } catch (e) {
      console.warn('override.js: failed to update focus indicator', e);
    }
  }

  /**
   * Hook up preset buttons to behave as toggles. Clicking an inactive preset
   * applies it; clicking the active preset clears the preset layer. This
   * also updates aria-pressed attributes for accessibility.
   */
  function hookPresetToggle() {
    try {
      const btns = Array.from(document.querySelectorAll('[data-preset]'));
      btns.forEach(btn => {
        const id = btn.getAttribute('data-preset');
        if (!id) return;
        // set aria-pressed according to active pack
        const isActive = (state.activePackKey || state.activePreset) === id;
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        // remove any existing click handlers (avoid duplicates)
        btn.onclick = null;
        btn.addEventListener('click', () => {
          const current = state.activePackKey || state.activePreset;
          if (current && current === id) {
            // clear preset
            window.clearPresetLayer();
            // rebuild deck/UI after clearing
            window.applyFilters();
            rebuildDeck();
            buildFilters();
            render();
          } else {
            window.applyPreset(id);
          }
          updateFocusIndicator();
          // update aria-pressed on all after state change
          btns.forEach(el => {
            const pid = el.getAttribute('data-preset');
            const active = (state.activePackKey || state.activePreset) === pid;
            el.setAttribute('aria-pressed', active ? 'true' : 'false');
            el.classList.toggle('preset-on', active);
          });
        }, { once: false });
      });
    } catch (e) {
      console.warn('override.js: failed to hook preset toggles', e);
    }
  }

  // Expose the indicator updater for potential external use
  window.updateFocusIndicator = updateFocusIndicator;
  window.hookPresetToggle = hookPresetToggle;

  // Once the page is ready, initialise toggle behaviour and indicator
  // Delay to ensure preset buttons exist
  if (document.readyState !== 'loading') {
    setTimeout(() => {
      hookPresetToggle();
      updateFocusIndicator();
    }, 0);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        hookPresetToggle();
        updateFocusIndicator();
      }, 0);
    });
  }

})();
