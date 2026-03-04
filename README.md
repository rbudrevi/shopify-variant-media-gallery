# Shopify Variant Media Gallery

A lightweight, theme-compatible extension that enables deterministic,
metafield-driven media rendering for Shopify product variants.

This extension allows each product variant to define its own associated
gallery images. When a customer selects a variant, only the relevant
media is displayed in the product gallery.

Tested with Dawn and Dawn-derived themes.

------------------------------------------------------------------------

## Why This Exists

Shopify's native `featured_media` supports only one primary image per
variant. Many stores require:

-   Multiple images per variant
-   Pack-size--specific imagery
-   Design-specific galleries
-   Cleaner media separation without duplicating products

This extension introduces a structured allowlist approach:

    Variant → Allowed Media IDs → Filtered Gallery

No alt-tag hacks. No duplicate products. No brittle conditional
rendering.

------------------------------------------------------------------------

## Features

-   Metafield-driven variant media mapping
-   Thumbnail and slide filtering
-   Zero additional network requests
-   Works with Dawn-style gallery markup
-   Fallback behavior (shows all media if no mapping defined)
-   Compatible with Online Store 2.0

------------------------------------------------------------------------

## How It Works

1.  Each variant defines a metafield listing associated media files.
2.  A JSON media map is rendered inside `<media-gallery>`.
3.  JavaScript filters slides and thumbnails based on the selected
    variant.
4.  If no mapping exists, all media is shown.

------------------------------------------------------------------------

## Installation

See [`docs/setup.md`](docs/setup.md) for full installation instructions.

High-level steps:

1.  Create variant metafield (`custom.associated_media` -- List of
    Files).
2.  Assign product media images to variants.
3.  Add the media map script inside the gallery snippet.
4.  Include `variant-media-gallery.js` on product pages.

------------------------------------------------------------------------

## Requirements

Your theme must:

-   Use `data-media-id` attributes on gallery slides
-   Use `data-target` attributes on thumbnails
-   Output selected variant JSON (Dawn-compatible)

------------------------------------------------------------------------

## Example Mapping Structure

``` json
{
  "51731610140988": {
    "mediaIds": ["template--1234-9911", "template--1234-9912"]
  }
}
```

------------------------------------------------------------------------

## Behavior Rules

-   If a variant has mapped media → only those images show
-   If a variant has no mapped media → all images show
-   If an associated file cannot be matched → it is ignored

------------------------------------------------------------------------

## Troubleshooting

### Media does not filter

-   Confirm `<script data-variant-media-map>` exists inside
    `<media-gallery>`
-   Confirm metafield is populated
-   Confirm filenames match product media images

### mediaIds array is empty

Most common cause: The metafield references files not used in product
media.

Fix: Ensure the selected files are the same assets used in the product
gallery.

------------------------------------------------------------------------

## Performance

-   No re-rendering of gallery
-   No AJAX requests
-   Uses CSS `display: none` for filtering
-   Lightweight JSON mapping

------------------------------------------------------------------------

## Compatibility

Tested with:

-   Dawn
-   Dawn-derived themes

Other themes may require selector adjustments in the JS file.

------------------------------------------------------------------------

## License

MIT

------------------------------------------------------------------------

## Author

WindowAlert Engineering
