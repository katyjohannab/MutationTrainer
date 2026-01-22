import {
  $,
  $$,
  esc,
  normalize,
  saveLS,
  state,
  hasCustomFilters,
  LABEL,
  label,
  PRACTICE_MODE_LS_KEY
} from "./state.js";
import { getCardId, pickNextSmartIdx, updateLeitner } from "./leitner.js";
import { buildCompleteSentence, playPollySentence } from "./tts.js";

const REPORT_ISSUE_BASE_URL = "https://github.com/katyjohannab/mutationtrainer/issues/new";

const cardCallbacks = {
  applyFilters: null,
  rebuildDeck: null,
  buildFilters: null,
  render: null,
  updateProgressLine: null,
  nextCard: null,
  getProgressFocusLabel: null,
};

export function setCardCallbacks(callbacks) {
  Object.assign(cardCallbacks, callbacks);
}

/* ========= Base word “?” translation UI ========= */
export function mountBaseTranslationUI(capsuleEl, card) {
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

export function initCardUi() {
  document.addEventListener("click", () => {
    $$(".base-info-popover").forEach(p => p.classList.add("hidden"));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      $$(".base-info-popover").forEach(p => p.classList.add("hidden"));
    }
  });
}

function getReportIssueBaseUrl() {
  const host = window.location.hostname || "";
  if (host.endsWith("github.io")) {
    const owner = host.split(".")[0];
    const repo = (window.location.pathname || "").split("/").filter(Boolean)[0];
    if (owner && repo) {
      return `https://github.com/${owner}/${repo}/issues/new`;
    }
  }
  return REPORT_ISSUE_BASE_URL;
}

function getMutationSummary(card) {
  const lang = state.lang || "en";
  const familyRaw = (card?.RuleFamily || "").trim();
  const outcomeRaw = (card?.Outcome || "").toString().toUpperCase().trim();
  const family = familyRaw ? (LABEL?.[lang]?.rulefamily?.[familyRaw] || familyRaw) : "";
  const outcome = outcomeRaw ? (LABEL?.[lang]?.rulefamily?.[outcomeRaw] || outcomeRaw) : "";
  if (family && outcome && family !== outcome) return `${family} / ${outcome}`;
  return family || outcome || "—";
}

export function openReportModal(card, cardId) {
  const modal = $("#reportModal");
  if (!modal) return;
  const sentence = buildCompleteSentence({ Before: card.Before, Answer: card.Answer, After: card.After });
  const translation = (card.Translate || "").trim();
  const focusLabel = typeof cardCallbacks.getProgressFocusLabel === "function"
    ? cardCallbacks.getProgressFocusLabel()
    : "";
  const mutationSummary = getMutationSummary(card);

  $("#reportCardId").value = cardId || "—";
  $("#reportBaseWord").value = card.Base || "—";
  $("#reportSentence").value = sentence || "—";
  $("#reportTranslation").value = translation || "—";
  $("#reportFocus").value = focusLabel || "—";
  $("#reportMutation").value = mutationSummary;
  $("#reportDetails").value = "";
  $("#reportSuccess")?.classList.add("hidden");

  state.reportContext = {
    cardId: cardId || "—",
    base: card.Base || "",
    sentence,
    translation,
    focusLabel,
    mutationSummary,
  };

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("overflow-hidden");
  $("#reportDetails")?.focus();
}

export function closeReportModal() {
  const modal = $("#reportModal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("overflow-hidden");
}

export function submitReportIssue(detailsText) {
  const lang = state.lang || "en";
  const ctx = state.reportContext;
  if (!ctx) return;
  const title = `${LABEL[lang].ui.reportIssueTitlePrefix} ${ctx.cardId || "—"}`;
  const bodyLines = [
    `${LABEL[lang].ui.cardIdLabel}: ${ctx.cardId || "—"}`,
    `${LABEL[lang].ui.reportFieldBaseLabel}: ${ctx.base || "—"}`,
    `${LABEL[lang].ui.reportFieldSentenceLabel}: ${ctx.sentence || "—"}`,
    `${LABEL[lang].ui.reportFieldTranslationLabel}: ${ctx.translation || "—"}`,
    `${LABEL[lang].ui.reportFieldFocusLabel}: ${ctx.focusLabel || "—"}`,
    `${LABEL[lang].ui.reportFieldMutationLabel}: ${ctx.mutationSummary || "—"}`,
    "",
    `${LABEL[lang].ui.reportDetailsLabel}`,
    detailsText.trim(),
  ];
  const issueUrl = `${getReportIssueBaseUrl()}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
  window.open(issueUrl, "_blank", "noopener");
  const success = $("#reportSuccess");
  if (success) {
    success.textContent = LABEL[lang].ui.reportSuccess;
    success.classList.remove("hidden");
  }
}

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
export function renderPractice() {
  const host = $("#practiceCard");
  if (!host) return;
  host.innerHTML = "";

  const lang = state.lang || "en";
  const t = LABEL[lang] || LABEL.en;
  const n = state.filtered.length;

  if (!n) {
    if (typeof cardCallbacks.updateProgressLine === "function") {
      cardCallbacks.updateProgressLine({ currentIndex: 0, totalCards: n });
    }
    host.innerHTML = `
      <div class="text-slate-700 panel rounded-xl p-4">
        ${lang === "cy" ? "Nid oes cardiau yn cyd-fynd â’ch hidlwyr." : "No cards match your filters."}
        <button id="btnClearFilters" class="ml-2 btn btn-ghost px-2 py-1">${LABEL[lang].ui.clearFilters}</button>
      </div>`;
    $("#btnClearFilters")?.addEventListener("click", () => {
      state.families = ["Soft","Aspirate","Nasal","None"];
      state.categories = [];
      state.triggerQuery = "";
      state.nilOnly = false;
      saveLS("wm_families", state.families);
      saveLS("wm_categories", state.categories);
      saveLS("wm_trig", state.triggerQuery);
      saveLS("wm_nil", state.nilOnly);
      cardCallbacks.applyFilters?.();
      cardCallbacks.rebuildDeck?.();
      cardCallbacks.buildFilters?.();
      cardCallbacks.render?.();
    });
    return;
  }

  let idxNow;
  let posText = "";
  let progressIndex = 0;
  if (state.practiceMode === "smart") {
    if (state.smartIdx == null) state.smartIdx = pickNextSmartIdx();
    idxNow = state.smartIdx;
    state.currentDeckPos = -1;
    const reviewed = (state.smartCount || 0) + 1;
    progressIndex = Math.min(reviewed, n);
    posText = `${t.reviewedLabel} ${reviewed} · ${t.poolLabel} ${n}`;
    const cp = $("#cardPos");
    if (cp) cp.textContent = `${t.smartModeShort} · ${posText}`;
  } else {
    const deckIdx = state.p % state.deck.length;
    idxNow = state.deck[deckIdx];
    state.currentDeckPos = deckIdx;
    const pos = state.deck.length ? (deckIdx + 1) : 0;
    progressIndex = pos;
    posText = `${t.cardLabel} ${pos} / ${state.deck.length || 0}`;
    const cp = $("#cardPos");
    if (cp) cp.textContent = posText;
  }
  if (typeof cardCallbacks.updateProgressLine === "function") {
    cardCallbacks.updateProgressLine({ currentIndex: progressIndex, totalCards: n });
  }

  const idxShown = (state.revealed && state.freezeIdx != null) ? state.freezeIdx : idxNow;
  const card = state.filtered[idxShown];
  state.currentIdx = idxNow;
  const isMobileCard = window.matchMedia("(max-width: 640px)").matches;

  if (!["front","back"].includes(state.cardState)) state.cardState = "front";
  if (!isMobileCard) {
    state.cardState = "front";
  } else if (!state.revealed) {
    state.cardState = "front";
  } else if (state.cardState !== "back") {
    state.cardState = "back";
  }

  const wrap = document.createElement("div");

  const header = document.createElement("div");
  header.className = "flex flex-wrap items-center justify-between gap-2 mb-2";

  const headerLeft = document.createElement("div");
  headerLeft.className = "flex flex-col gap-1 text-xs text-slate-500";
  const posSpan = document.createElement("span");
  posSpan.textContent = posText;
  headerLeft.appendChild(posSpan);

  const cardId = getCardId(card, idxShown);

  const headerRight = document.createElement("div");
  headerRight.className = "flex items-center gap-2";
  const metaControls = $("#practiceMetaControls");
  if (metaControls) metaControls.innerHTML = "";

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
      cardCallbacks.rebuildDeck?.();
      cardCallbacks.render?.();
    };
    return b;
  };

  seg.append(
    mkSegBtn(t.shuffleModeShort, "shuffle"),
    mkSegBtn(t.smartModeShort, "smart")
  );

  const controlsMount = metaControls || headerRight;
  controlsMount.appendChild(seg);
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

  const activeCategories = state.categories.filter(c => c !== "All");
  if (hasCustomFilters()) {
    if (state.families.length && state.families.length < 4) {
      state.families.forEach(f => summary.appendChild(addChip(label("rulefamily", f))));
    }
    if (activeCategories.length) {
      activeCategories.forEach(ca => summary.appendChild(addChip(label("categories", ca))));
    }
    if (state.triggerQuery && state.triggerQuery.trim()) {
      const trigLabel = (lang === "cy" ? "Sbardun" : "Trigger");
      summary.appendChild(addChip(`${trigLabel}: ${state.triggerQuery.trim()}`));
    }
    if (state.nilOnly) summary.appendChild(addChip(label("headings", "nilOnly")));

    // Use translated "Clear" label for the final chip
    const clearLabel = LABEL[lang]?.ui?.clear || (lang === "cy" ? "Clirio" : "Clear");
    summary.appendChild(addChip(clearLabel, () => {
      state.families = ["Soft","Aspirate","Nasal","None"];
      state.categories = [];
      state.triggerQuery = "";
      state.nilOnly = false;
      saveLS("wm_families", state.families);
      saveLS("wm_categories", state.categories);
      saveLS("wm_trig", state.triggerQuery);
      saveLS("wm_nil", state.nilOnly);
      cardCallbacks.applyFilters?.();
      cardCallbacks.rebuildDeck?.();
      cardCallbacks.buildFilters?.();
      cardCallbacks.render?.();
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
  capsule.className = "base-word-capsule";
  capsule.style.position = "relative";

  const baseSpan = document.createElement("span");
  baseSpan.className = "base-word-text";
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

  const primary = document.createElement("div");
  primary.className = "practice-actions-primary";

  const secondary = document.createElement("div");
  secondary.className = "practice-actions-secondary";

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
    if (isMobileCard) {
      state.cardState = "back";
    }
    cardCallbacks.render?.();
    setTimeout(() => $("#inlineNext")?.focus({ preventScroll: true }), 0);
  };

  const btnCheck = btn(t.check, "btn-primary btn-check shadow", onCheck);
  btnCheck.id = "btnCheck";
  btnCheck.title = `${t.check} (Enter)`;
  if (isMobileCard) {
    btnCheck.classList.add("hidden");
    btnCheck.setAttribute("aria-hidden", "true");
    btnCheck.tabIndex = -1;
  }

  const hint = document.createElement("div");
  hint.className = "hidden practice-hint text-sm text-slate-600";
  hint.innerHTML = `${esc(t.hint)}: starts with <b>${esc((card.Answer || "").slice(0, 1) || "?")}</b>`;

  const btnHint = btn(t.hint, "btn-ghost", () => {
    hint.classList.toggle("hidden");
    $("#answerBox")?.focus();
  });
  btnHint.id = "btnHint";
  btnHint.title = `${t.hint} (H)`;

  const revealCard = () => {
    if (state.revealed) return;
    state.revealed = true;
    if (!state.lastResult) state.lastResult = "revealed";
    state.freezeIdx = idxNow;
    state.freezePos = state.currentDeckPos;
    const ab2 = $("#answerBox");
    if (ab2) {
      ab2.disabled = true;
      ab2.classList.add("opacity-70", "cursor-not-allowed");
    }
    if (isMobileCard) {
      state.cardState = "back";
    }
    cardCallbacks.render?.();
  };

  const btnReveal = btn(t.reveal, "btn-ghost", revealCard);
  btnReveal.id = "btnReveal";

  const btnSkip = btn(t.skip, "btn-ghost btn-muted btn-skip", () => {
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

    updateLeitner(cardId, "skipped");
    if (state.practiceMode === "smart") {
      state.smartQueue.push({ idx: shownIdx, dueAfter: 2 });
    }

    const ab2 = $("#answerBox");
    if (ab2) {
      ab2.disabled = true;
      ab2.classList.add("opacity-70", "cursor-not-allowed");
    }

    if (isMobileCard) {
      state.cardState = "back";
    }
    cardCallbacks.render?.();
  });
  btnSkip.id = "btnSkip";

  const btnShuffle = document.createElement("button");
  btnShuffle.type = "button";
  btnShuffle.className = "btn btn-shuffle";
  btnShuffle.title = t.shuffleNowDesc || "";
  btnShuffle.innerHTML = `<span aria-hidden="true">🔀</span><span>${esc(t.shuffleNow)}</span>`;
  btnShuffle.onclick = () => { cardCallbacks.rebuildDeck?.(); cardCallbacks.render?.(); };

  primary.append(btnCheck);
  secondary.append(btnHint, btnReveal, btnSkip);
  main.append(primary, secondary);
  if (metaControls) {
    metaControls.appendChild(btnShuffle);
  } else {
    aux.append(btnShuffle);
  }
  actions.append(main, aux);

  const buildFeedbackBox = ({ nextClass, showNext = true }) => {
    const ok = state.lastResult === "correct";
    const skipped = state.lastResult === "skipped";
    const revealed = state.lastResult === "revealed";

    const statusIcon = revealed ? "👀" : (skipped ? "⏭️" : (ok ? "✅" : "❌"));
    const statusColor = revealed ? "text-slate-800" : (skipped ? "text-slate-800" : (ok ? "text-indigo-900" : "text-rose-900"));
    const statusText = revealed ? t.statuses.revealed : (skipped ? t.statuses.skipped : (ok ? t.statuses.correct : t.statuses.wrong));
    const whyText = (state.lang === "cy" ? (card.WhyCym || card.Why) : card.Why) || "";
    const whyLabel = LABEL?.[lang]?.ui?.whyLabel || (lang === "cy" ? "Pam" : "Why");
    const whyMarkup = whyText
      ? `
        <details class="feedback-why" ${isMobileCard ? "" : "open"}>
          <summary>${esc(whyLabel)}</summary>
          <div class="feedback-why-body text-slate-700">${esc(whyText)}</div>
        </details>
      `
      : "";

    const nextMarkup = showNext
      ? `
        <div class="mt-4 flex justify-end">
          <button id="inlineNext"
                  class="${esc(nextClass)}"
                  type="button"
                  title="${esc(t.next)} (Enter)">
            ${esc(t.next)}
          </button>
        </div>
      `
      : "";

    return `
      <div class="feedback-box">
        <div class="flex items-center gap-2 ${statusColor} text-2xl md:text-3xl font-semibold">
          ${statusIcon} ${esc(statusText)}
        </div>

        ${(!ok && !skipped && !revealed)
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

        ${whyMarkup}

        ${nextMarkup}
      </div>
    `;
  };

  const wireFeedbackActions = () => {
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
    if (typeof cardCallbacks.nextCard === "function") {
      $("#inlineNext")?.addEventListener("click", () => cardCallbacks.nextCard(1));
    }
  };

  const feedback = document.createElement("div");
  feedback.className = "practice-feedback";
  feedback.setAttribute("aria-live", "polite");

  if (state.revealed) {
    feedback.classList.add("is-visible");
    feedback.innerHTML = buildFeedbackBox({ nextClass: "btn btn-primary shadow transition" });
    if (!isMobileCard) {
      setTimeout(wireFeedbackActions, 0);
    }
  } else {
    feedback.classList.add("is-hidden");
  }

  const answerBlock = document.createElement("div");
  answerBlock.className = "practice-answerBlock";
  if (isMobileCard) {
    answerBlock.append(row, actions, hint);
  } else {
    answerBlock.append(row, actions, hint, feedback);
  }

  const createCardFooter = () => {
    const cardFooter = document.createElement("div");
    cardFooter.className = "practice-card-footer";

    const cardMeta = document.createElement("div");
    cardMeta.className = "practice-card-meta";
    cardMeta.textContent = `${LABEL[lang].ui.cardIdLabel}: ${cardId || "—"}`;

    const reportLabel = LABEL[lang]?.ui?.reportIssue || (lang === "cy" ? "Adrodd problem" : "Report issue");
    const reportBtn = document.createElement("button");
    reportBtn.type = "button";
    reportBtn.className = "btn btn-ghost practice-report-btn";
    reportBtn.textContent = reportLabel;
    reportBtn.title = reportLabel;
    reportBtn.addEventListener("click", () => {
      openReportModal(card, cardId);
    });

    cardFooter.append(cardMeta, reportBtn);
    return cardFooter;
  };

  const cardSurface = document.createElement("div");
  cardSurface.className = "practice-card-surface practice-card-flip";

  if (isMobileCard) {
    cardSurface.classList.add(state.cardState === "back" ? "is-back" : "is-front");
    const frontFace = document.createElement("div");
    frontFace.className = "practice-card-face is-front";
    frontFace.append(instruction, chips, answerBlock, createCardFooter());

    const backFace = document.createElement("div");
    backFace.className = "practice-card-face is-back";

    if (state.revealed) {
      const backFeedback = document.createElement("div");
      backFeedback.className = "practice-feedback practice-feedback-back is-visible";
      backFeedback.setAttribute("aria-live", "polite");
      backFeedback.innerHTML = buildFeedbackBox({
        nextClass: "btn btn-primary btn-next-big shadow transition",
        showNext: false
      });
      backFace.append(backFeedback, createCardFooter());
      setTimeout(wireFeedbackActions, 0);
    } else {
      backFace.append(createCardFooter());
    }

    cardSurface.append(frontFace, backFace);
  } else {
  cardSurface.append(instruction, chips, answerBlock, createCardFooter());
  }

  wrap.append(header, summary, cardSurface);
  host.appendChild(wrap);

  const mobileBar = $("#mobileBar");
  if (mobileBar) {
    const showNext = isMobileCard && state.cardState === "back";
    mobileBar.classList.toggle("hidden", !isMobileCard);
    $("#mobileActionAnswer")?.classList.toggle("hidden", showNext);
    $("#mbNext")?.classList.toggle("hidden", !showNext);
  }

  const ab = $("#answerBox");
  if (ab) {
    ab.value = state.guess;
    if (!isMobileCard || state.cardState === "front") {
      ab.focus();
      const scrollAnswerIntoView = () => {
        if (!window.matchMedia("(max-width: 767px)").matches) return;
        ab.scrollIntoView({ block: "center", behavior: "smooth" });
      };
      ab.addEventListener("focus", () => {
        scrollAnswerIntoView();
        setTimeout(scrollAnswerIntoView, 250);
      });
    }
    ab.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); onCheck(); }
    });
    ab.addEventListener("input", (e) => { state.guess = e.target.value; });
  }
}

export function renderBrowse() {
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
