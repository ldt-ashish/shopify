function observeLazyMedia() {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (!(el instanceof HTMLImageElement || el instanceof HTMLSourceElement)) return;

        const src = el.dataset.src;
        const srcset = el.dataset.srcset;

        if (src) el.src = src;
        if (srcset) el.srcset = srcset;

        el.removeAttribute('data-src');
        el.removeAttribute('data-srcset');
        observer.unobserve(el);
      });
    },
    { rootMargin: '200px 0px' }
  );

  document.querySelectorAll('img[data-src], source[data-srcset]').forEach((el) => observer.observe(el));
}

function deferNonCritical() {
  window.requestIdleCallback?.(() => {
    document.querySelectorAll('script[data-agency-defer-src]').forEach((script) => {
      if (!(script instanceof HTMLScriptElement)) return;
      if (script.dataset.loaded === 'true') return;

      const src = script.dataset.agencyDeferSrc;
      if (!src) return;

      script.src = src;
      script.dataset.loaded = 'true';
      script.removeAttribute('data-agency-defer-src');
    });
  });
}

export function initAgencyPerformance() {
  observeLazyMedia();
  deferNonCritical();
}
