(() => {
  const MAP_SELECTOR = '[data-variant-media-map]';
  const SELECTED_VARIANT_SELECTOR = 'variant-selects [data-selected-variant]';
  const GALLERY_SELECTOR = 'media-gallery';
  const THUMB_SELECTOR = '[data-target]';
  const SLIDE_SELECTOR = '[data-media-id]';

  function parseSelectedVariantId() {
    const el = document.querySelector(SELECTED_VARIANT_SELECTOR);
    if (!el) return null;
    try {
      const v = JSON.parse(el.textContent);
      return v?.id ? String(v.id) : null;
    } catch {
      return null;
    }
  }

  function parseMap(mapEl) {
    try {
      return JSON.parse(mapEl.textContent || '{}');
    } catch {
      return {};
    }
  }

  function getAllowedIds(map, variantId) {
    const entry = map?.[String(variantId)];
    const ids = entry?.mediaIds || [];
    return new Set(ids.map(String));
  }

  function filterGallery(galleryEl, allowed, activeId) {
    const hasAllowlist = allowed.size > 0;

    const thumbs = galleryEl.querySelectorAll(THUMB_SELECTOR);
    thumbs.forEach((t) => {
      const id = String(t.dataset.target || '');
      const isActive = id === activeId;
      const show = !hasAllowlist || allowed.has(id) || isActive;
      t.style.display = show ? '' : 'none';
    });

    const slides = galleryEl.querySelectorAll(SLIDE_SELECTOR);
    slides.forEach((s) => {
      const id = String(s.dataset.mediaId || '');
      const isActive = id === activeId;
      const show = !hasAllowlist || allowed.has(id) || isActive;
      s.style.display = show ? '' : 'none';
    });
  }

  function getActiveMediaId(galleryEl) {
    const activeSlide = galleryEl.querySelector(`${SLIDE_SELECTOR}.is-active`);
    return activeSlide?.dataset?.mediaId ? String(activeSlide.dataset.mediaId) : null;
  }

  function activateFirstAllowedThumb(galleryEl, allowed) {
    const first = [...allowed][0];
    if (!first) return;

    const thumb = galleryEl.querySelector(`${THUMB_SELECTOR}[data-target="${CSS.escape(first)}"]`);
    const btn = thumb?.querySelector('button');
    if (btn) btn.click(); // delegates to Dawn's gallery behavior
  }

  function applyForGallery(galleryEl) {
    const mapEl = galleryEl.querySelector(MAP_SELECTOR);
    if (!mapEl) return; // no-op for products without mapping

    const map = parseMap(mapEl);

    const variantId = parseSelectedVariantId();
    if (!variantId) return;

    const allowed = getAllowedIds(map, variantId);
    const activeId = getActiveMediaId(galleryEl);

    filterGallery(galleryEl, allowed, activeId);

    // If we have an allowlist and the active image isn't allowed, switch to first allowed.
    if (allowed.size > 0 && activeId && !allowed.has(activeId)) {
      activateFirstAllowedThumb(galleryEl, allowed);
    }
  }

  function applyAll() {
    document.querySelectorAll(GALLERY_SELECTOR).forEach(applyForGallery);
  }

  // Re-apply when the selected variant JSON changes (Dawn updates this script tag)
  function watchSelectedVariant() {
    const selectedEl = document.querySelector(SELECTED_VARIANT_SELECTOR);
    if (!selectedEl) return;

    const obs = new MutationObserver(() => applyAll());
    obs.observe(selectedEl, { characterData: true, childList: true, subtree: true });
  }

  // Also re-apply after thumbnail clicks or slide changes (belt + suspenders)
  function attachEventHooks() {
    document.addEventListener('click', (e) => {
      const btn = e.target?.closest?.('media-gallery [data-target] button');
      if (btn) setTimeout(applyAll, 0);
    });

    document.querySelectorAll('media-gallery [id^="GalleryViewer"]').forEach((viewer) => {
      viewer.addEventListener('slideChanged', () => setTimeout(applyAll, 0));
    });
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    applyAll();
    watchSelectedVariant();
    attachEventHooks();
  });
})();