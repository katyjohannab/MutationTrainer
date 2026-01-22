import { saveLS, state, LEITNER_LS_KEY } from "./state.js";

export const LEITNER_MAX_BOX = 5;
const LEITNER_WEIGHTS = [0, 50, 25, 15, 7, 3]; // index 1..5

export function getCardId(card, idxFallback) {
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

export function updateLeitner(cardId, result) {
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

export function pickNextSmartIdx() {
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
