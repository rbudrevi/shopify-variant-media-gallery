let lastDesign=null;
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

      const activeMedia = this.elements.viewer?.querySelector('[data-media-id].is-active');
      if (activeMedia) {
        const activeMediaId = activeMedia.dataset.mediaId;
        const thumb = this.elements.thumbnails.querySelector(`[data-target="${activeMediaId}"]`);
        const designName = thumb?.dataset.design;

console.log('[media-gallery] Initial load — activeMediaId:', activeMediaId);
  console.log('[media-gallery] Found thumbnail:', thumb);
  console.log('[media-gallery] Extracted designName:', designName);
  console.log('[media-gallery] ProductData:', window.ProductData);
        
        if (designName) {
          console.log(`[media-gallery] Initial design detected: ${designName}`);
          lastDesign = designName; // Set lastDesign here
          this.filterThumbnailsByDesign(designName, activeMediaId);

        const matchingVariant = window.ProductData?.variants?.find(
      (v) => v.option1?.trim() === designName);

          const count = matchingVariant?.pack_decal_count;
          const countDisplay = document.getElementById('component-count-display');
      
          if (countDisplay && count !== undefined) {
            countDisplay.textContent = `Includes ${count} decals per envelope (design specific)`;
            console.log(`[media-gallery] Initial load — set component count for "${designName}": ${count}`);
          }
        }
      }

      if (this.dataset.desktopLayout?.includes('thumbnail') && this.mql.matches) {
        this.removeListSemantic();
      }
    }

    extractDesignName(variant) {
      const name = variant?.option1?.trim();
      console.log(`[media-gallery] extractDesignName: ${name}`);
      return name;
    }

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
          button.dataset.bound = "true";
        }
      });
    }

     setActiveMedia(mediaId) {
      console.log(`[media-gallery]`);
      console.log(`[media-gallery] setActiveMedia called: ${mediaId}`);
    
      const activeMedia = this.elements.viewer.querySelector(`[data-media-id="${mediaId}"]`);
      if (!activeMedia) {
        console.warn(`[media-gallery] No matching media element for ID: ${mediaId}`);
        return;
      }
    
      const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
      const designName = activeThumbnail?.dataset.design;
          
      if (designName) {
        console.log(`[media-gallery] Detected design from thumbnail: ${designName}`);
      
        const isDesignChanged = designName !== lastDesign;
        const isMediaChanged = mediaId !== lastMediaId;  
        const isVariantImage = activeThumbnail?.classList.contains('thumbnail-list_item--variant');

       if (isDesignChanged) {
        console.log('[media-gallery] Attempting to update component count display');
        console.log(`[media-gallery] designName: "${designName}"`);
      
        if (window.ProductData?.variants?.length && designName) {
          const matchingVariant = window.ProductData.variants.find(v => {
            return v.option1?.trim() === designName;
          });
      
          const count = matchingVariant?.pack_decal_count;
          const countDisplay = document.getElementById('component-count-display');
      
          if (countDisplay && count !== undefined) {
            countDisplay.textContent = `Includes ${count} decals per envelope (design specific)`;
            console.log(`[media-gallery] Updated component count display for design "${designName}": ${count}`);
          } else {
            console.warn('[media-gallery] Count display element missing or count undefined');
          }
        }
      }
        
        if (isDesignChanged || (isMediaChanged && isVariantImage)) {
          console.log(`[media-gallery] Triggering filter. Design: ${lastDesign} → ${designName}, Media: ${lastMediaId} → ${mediaId}`);
          this.filterThumbnailsByDesign(designName, mediaId);
          lastDesign = designName;
          lastMediaId = mediaId;  
        } else {
          console.log('[media-gallery] Skipping filter — no relevant changes');
        }
      }
             
      // Ensure thumbnail is visible even if it would be filtered out
      if (activeThumbnail) {
        activeThumbnail.style.display = 'list-item';
      }
    
      this.elements.viewer.querySelectorAll('[data-media-id]').forEach((el) =>
        el.classList.remove('is-active')
      );
      activeMedia.classList.add('is-active');
    
      this.setActiveThumbnail(activeThumbnail);
      this.scrollToMedia(activeMedia);
  }


    setActiveThumbnail(thumbnail) {
      if (!thumbnail) {
        console.warn('[media-gallery] No thumbnail found to set as active');
        return;
      }

      this.elements.thumbnails.querySelectorAll('button').forEach((el) =>
        el.removeAttribute('aria-current')
      );
      const button = thumbnail.querySelector('button');
      if (button) {
        button.setAttribute('aria-current', 'true');
        console.log('[media-gallery] Thumbnail set as active');
      }
    }

    scrollToMedia(mediaEl) {
      if (!mediaEl || !this.elements.thumbnails) return;
    
      const sliderComponent = this.elements.thumbnails.closest('slider-component');
      if (sliderComponent && typeof sliderComponent.slideToVisibleItem === 'function') {
        sliderComponent.slideToVisibleItem(mediaEl);
        console.log('[scrollToMedia] Called Shopify SliderComponent.slideToVisibleItem');
      } else {
        // fallback in case component isn't found
        mediaEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
        console.warn('[scrollToMedia] Fallback to scrollIntoView');
      }
  }

 filterThumbnailsByDesign(designName, activeMediaId = null) {
  console.log('[filter Thumbnails]');
  if (!this.elements.thumbnails || !designName) return;

  console.log(`[filter Thumbnails] Filtering thumbnails for design: "${designName}"`);

  this.elements.thumbnails.querySelectorAll('[data-design]').forEach((thumb) => {
    const thumbDesign = thumb.dataset.design?.trim().toLowerCase();
    const mediaId = thumb.dataset.target;
    const isVariantImage = thumb.classList.contains('thumbnail-list_item--variant');

    const matchDesign = thumbDesign === designName.trim().toLowerCase();
    const isActive = mediaId === activeMediaId;

    let shouldShow = matchDesign;

    // Only show a variant image if it's the active one
    if (matchDesign && isVariantImage && !isActive) {
      shouldShow = false;
    }

    thumb.style.display = shouldShow ? '' : 'none';

    if (isActive && isVariantImage) {
      console.log(`[filter] Keeping active variant thumbnail visible: ${mediaId}`);
    }
  });
}

    removeListSemantic() {
      const slider = this.elements.viewer?.slider;
      if (!slider) return;
      slider.setAttribute('role', 'presentation');
      slider.querySelectorAll('[role="listitem"]').forEach((slide) =>
        slide.setAttribute('role', 'presentation')
      );
      console.log('[media-gallery] Removed list semantics for ARIA');
    }
  }

  customElements.define('media-gallery', MediaGallery);
}

