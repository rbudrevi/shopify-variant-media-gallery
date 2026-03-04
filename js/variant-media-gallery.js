const SELECTED_VARIANT_SELECTOR = 'variant-selects [data-selected-variant]';
const MAP_SELECTOR = '[data-variant-media-map]';
const THUMB_SELECTOR = '[data-target]';
const SLIDE_SELECTOR = '[data-media-id]';

let lastVariantId = null;
let lastMediaId = null;

if (!customElements.get('media-gallery')) {
  class MediaGallery extends HTMLElement {
    constructor() {
      super();
      console.log('[media-gallery] Initializing component');

      this.elements = {
        liveRegion: this.querySelector('[id^="GalleryStatus"]'),
        viewer: this.querySelector('[id^="GalleryViewer"]'),
        thumbnails: this.querySelector('[id^="GalleryThumbnails"]'),
      };

      if (!this.elements.viewer) console.warn('[media-gallery] Viewer not found');
      if (!this.elements.thumbnails) console.warn('[media-gallery] Thumbnails container not found');

      this.mql = window.matchMedia('(min-width: 750px)');

      this.bindThumbnailClicks();

      this.thumbnailObserver = new MutationObserver(() => {
        console.log('[media-gallery] DOM changed — rebinding thumbnail clicks');
        this.bindThumbnailClicks();
      });

      if (this.elements.thumbnails) {
        this.thumbnailObserver.observe(this.elements.thumbnails, {
          childList: true,
          subtree: true,
        });
      }

      // Initial filter + count update
      const activeMedia = this.elements.viewer?.querySelector('[data-media-id].is-active');
      if (activeMedia) {
        const activeMediaId = activeMedia.dataset.mediaId;
        const variantId = this.getSelectedVariantId();

        console.log('[media-gallery] Initial load — activeMediaId:', activeMediaId);
        console.log('[media-gallery] Initial load — variantId:', variantId);

        if (variantId) {
          lastVariantId = variantId;
          lastMediaId = activeMediaId;

          this.filterByVariant(variantId, activeMediaId);
          this.updateComponentCountDisplay(variantId);
        }
      }

      if (this.dataset.desktopLayout?.includes('thumbnail') && this.mql.matches) {
        this.removeListSemantic();
      }
    }

    // ---------- Data helpers ----------

    getVariantMediaMap() {
      if (this._variantMediaMap) return this._variantMediaMap;

      const el = this.querySelector('[data-variant-media-map]');
      if (!el) {
        console.warn('[media-gallery] Missing data-variant-media-map JSON');
        this._variantMediaMap = {};
        return this._variantMediaMap;
      }

      try {
        this._variantMediaMap = JSON.parse(el.textContent);
      } catch (e) {
        console.error('[media-gallery] Failed parsing variant media map JSON', e);
        this._variantMediaMap = {};
      }

      return this._variantMediaMap;
    }

    getSelectedVariantId() {
      // Dawn writes selected variant JSON in variant-selects
      const vs = document.querySelector('variant-selects [data-selected-variant]');
      if (!vs) return null;

      try {
        const v = JSON.parse(vs.textContent);
        return v?.id ? String(v.id) : null;
      } catch {
        return null;
      }
    }

    updateComponentCountDisplay(variantId) {
      const countDisplay = document.getElementById('component-count-display');
      if (!countDisplay) return;

      const v = window.ProductData?.variants?.find((x) => String(x.id) === String(variantId));
      const count = v?.pack_decal_count;

      if (count !== undefined) {
        countDisplay.textContent = `Includes ${count} decals per envelope (design specific)`;
      }
    }

    // ---------- Thumbnail click wiring ----------

    bindThumbnailClicks() {
      if (!this.elements.thumbnails) return;

      const thumbs = this.elements.thumbnails.querySelectorAll('[data-target]');
      console.log(`[bind thumbnail clicks] Binding click events to ${thumbs.length} thumbnails`);

      thumbs.forEach((thumb) => {
        const button = thumb.querySelector('button');
        if (button && !button.dataset.bound) {
          const mediaId = thumb.dataset.target;
          button.addEventListener('click', () => {
            console.log(`[bind thumbnail clicks] Thumbnail clicked — switching to mediaId: ${mediaId}`);
            this.setActiveMedia(mediaId);
          });
          button.dataset.bound = 'true';
        }
      });
    }

    // ---------- Core behavior ----------

    setActiveMedia(mediaId) {
      console.log('[media-gallery] setActiveMedia called:', mediaId);

      const activeMedia = this.elements.viewer?.querySelector(`[data-media-id="${mediaId}"]`);
      if (!activeMedia) {
        console.warn('[media-gallery] No matching media element for ID:', mediaId);
        return;
      }

      const activeThumbnail =
        this.elements.thumbnails?.querySelector(`[data-target="${mediaId}"]`) || null;

      const variantId = this.getSelectedVariantId();
      const isVariantChanged = variantId && variantId !== lastVariantId;
      const isMediaChanged = mediaId !== lastMediaId;

      if (variantId && (isVariantChanged || isMediaChanged)) {
        console.log(
          `[media-gallery] Triggering filter. Variant: ${lastVariantId} → ${variantId}, Media: ${lastMediaId} → ${mediaId}`
        );
        this.filterByVariant(variantId, mediaId);
        this.updateComponentCountDisplay(variantId);

        lastVariantId = variantId;
        lastMediaId = mediaId;
      }

      // Keep active thumb visible even if filtered out (safety)
      if (activeThumbnail) activeThumbnail.style.display = 'list-item';

      // Switch active slide
      this.elements.viewer.querySelectorAll('[data-media-id]').forEach((el) =>
        el.classList.remove('is-active')
      );
      activeMedia.classList.add('is-active');

      this.setActiveThumbnail(activeThumbnail);
      this.scrollToMedia(activeMedia);
    }

    filterByVariant(variantId, activeMediaId = null) {
      if (!variantId) return;

      const map = this.getVariantMediaMap();
      const entry = map[String(variantId)];
      const allowed = new Set(entry?.mediaIds || []);

      console.log('[filter] variant:', variantId, 'allowed count:', allowed.size);

      // If no metafield allowlist set, show everything
      const hasAllowlist = allowed.size > 0;

      // Thumbnails
      if (this.elements.thumbnails) {
        this.elements.thumbnails.querySelectorAll('[data-target]').forEach((thumb) => {
          const id = thumb.dataset.target;
          const isActive = id === activeMediaId;

          let shouldShow = true;
          if (hasAllowlist) shouldShow = allowed.has(id) || isActive;

          thumb.style.display = shouldShow ? '' : 'none';
        });
      }

      // Main slides (recommended)
      if (this.elements.viewer) {
        this.elements.viewer.querySelectorAll('[data-media-id]').forEach((slide) => {
          const id = slide.dataset.mediaId;
          const isActive = id === activeMediaId;

          let shouldShow = true;
          if (hasAllowlist) shouldShow = allowed.has(id) || isActive;

          slide.style.display = shouldShow ? '' : 'none';
        });
      }
    }

    setActiveThumbnail(thumbnail) {
      if (!thumbnail || !this.elements.thumbnails) return;

      this.elements.thumbnails.querySelectorAll('button').forEach((el) =>
        el.removeAttribute('aria-current')
      );

      const button = thumbnail.querySelector('button');
      if (button) button.setAttribute('aria-current', 'true');
    }

    scrollToMedia(mediaEl) {
      if (!mediaEl || !this.elements.thumbnails) return;

      const sliderComponent = this.elements.thumbnails.closest('slider-component');
      if (sliderComponent && typeof sliderComponent.slideToVisibleItem === 'function') {
        sliderComponent.slideToVisibleItem(mediaEl);
      } else {
        mediaEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }

    removeListSemantic() {
      const slider = this.elements.viewer?.slider;
      if (!slider) return;

      slider.setAttribute('role', 'presentation');
      slider.querySelectorAll('[role="listitem"]').forEach((slide) =>
        slide.setAttribute('role', 'presentation')
      );
    }
  }

  customElements.define('media-gallery', MediaGallery);
}
