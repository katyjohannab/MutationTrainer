const scrollLockState = {
  reasons: new Set(),
  scrollY: 0,
  styleCache: null,
};

function applyLock() {
  const body = document.body;
  if (!body) return;
  scrollLockState.scrollY = window.scrollY || window.pageYOffset || 0;
  scrollLockState.styleCache = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    overflow: body.style.overflow,
  };
  body.classList.add("scroll-locked");
  body.style.position = "fixed";
  body.style.top = `-${scrollLockState.scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";
}

function releaseLock() {
  const body = document.body;
  if (!body) return;
  const cache = scrollLockState.styleCache || {};
  body.style.position = cache.position || "";
  body.style.top = cache.top || "";
  body.style.left = cache.left || "";
  body.style.right = cache.right || "";
  body.style.width = cache.width || "";
  body.style.overflow = cache.overflow || "";
  body.classList.remove("scroll-locked");
  window.scrollTo(0, scrollLockState.scrollY);
  scrollLockState.styleCache = null;
}

export function lockScroll(reason = "default") {
  const key = String(reason || "default");
  if (scrollLockState.reasons.has(key)) return;
  scrollLockState.reasons.add(key);
  if (scrollLockState.reasons.size === 1) {
    applyLock();
  }
}

export function unlockScroll(reason = "default") {
  const key = String(reason || "default");
  if (!scrollLockState.reasons.has(key)) return;
  scrollLockState.reasons.delete(key);
  if (scrollLockState.reasons.size === 0) {
    releaseLock();
  }
}
