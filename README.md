# shopify-variant-media-gallery
Multi variant gallery for Shopify

Each variant has metafield: custom.associated_media (List of Files) OR your chosen strategy

The gallery markup includes a JSON script:
<script type="application/json" data-variant-media-map>...</script>

The gallery’s slides have data-media-id="SECTIONID-MEDIAID"

Thumbs have data-target="SECTIONID-MEDIAID"

The JS component filters based on selected variant
