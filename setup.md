# Setup Guide

This guide explains how to install and configure the Variant Media
Gallery extension for a Shopify theme (tested with Dawn).

------------------------------------------------------------------------

# Overview

This extension allows you to associate multiple gallery images with
individual product variants using a metafield.

When a customer selects a variant: - Only the associated images will be
shown - Thumbnails and slides are filtered - Non-matching media is
hidden - Fallback behavior shows all media if no mapping is defined

------------------------------------------------------------------------

# Requirements

-   Shopify Online Store 2.0 theme
-   Gallery uses `data-media-id` and `data-target` attributes (Dawn
    compatible)
-   Product variant metafield defined (see below)

------------------------------------------------------------------------

# Step 1 --- Create the Variant Metafield

Go to:

**Settings → Custom data → Variants → Add definition**

Create:

  Field             Value
  ----------------- ---------------------------
  Name              Associated Media
  Namespace & key   `custom.associated_media`
  Type              List of Files
  Accept            Images

Save.

------------------------------------------------------------------------

# Step 2 --- Assign Media to Variants

1.  Open a product
2.  Open a variant
3.  In the "Associated Media" field, select images

Important:

The selected files must be the same image assets used in the product
media gallery (matching filenames). If filenames differ, mapping will
fail.

------------------------------------------------------------------------

# Step 3 --- Add the Media Map Script

Open the gallery snippet used by your product template.

In Dawn, this is typically:

    snippets/product-media-gallery.liquid

In custom themes, check `sections/main-product.liquid` for:

    {% render 'product-media-gallery' %}

Inside the snippet, immediately after the opening `<media-gallery>` tag,
add:

``` liquid
<script type="application/json" data-variant-associated-urls>
{
  {%- for variant in product.variants -%}
    "{{ variant.id }}": [
      {%- assign associated_files = variant.metafields.custom.associated_media.value -%}
      {%- if associated_files != blank -%}
        {%- for file in associated_files -%}
          "{{ file | file_url }}"{% unless forloop.last %},{% endunless %}
        {%- endfor -%}
      {%- endif -%}
    ]{% unless forloop.last %},{% endunless %}
  {%- endfor -%}
}
</script>

```

------------------------------------------------------------------------

# Step 4 --- Add the JavaScript

Upload `variant-media-gallery.js` to:

    assets/

Then include it in your product template (usually in
`main-product.liquid`):

``` liquid
<script src="{{ 'variant-media-gallery.js' | asset_url }}" defer></script>
```

Ensure this script loads on product pages only.

------------------------------------------------------------------------

# Step 5 --- Verify Installation

Open a product page and run in browser console:

``` js
document.querySelectorAll('media-gallery [data-variant-media-map]').length
```

Expected result:

    1

Then verify the selected variant has mapped media:

``` js
const mg = document.querySelector('media-gallery');
const map = JSON.parse(mg.querySelector('[data-variant-media-map]').textContent);
map[mg.getSelectedVariantId()]
```

You should see:

    { mediaIds: [...] }

------------------------------------------------------------------------

# Behavior Notes

## If a variant has no associated media

All gallery images will be shown.

## If an associated file does not match product media

It will be ignored.

This typically happens if: - The metafield references a file not used in
the product media gallery - Filenames do not match exactly

------------------------------------------------------------------------

# Troubleshooting

## Thumbnails do not change

Confirm: - Script tag exists inside `<media-gallery>` - JavaScript is
loading - Variant metafield is populated

## mediaIds array is empty

Most common cause: Filenames do not match product media images.

Fix: Ensure metafield files are the exact same images used in the
product gallery.

------------------------------------------------------------------------

# Performance Considerations

-   No additional network requests
-   Filtering uses `display: none`
-   JSON mapping is lightweight
-   Safe for large galleries

------------------------------------------------------------------------

# Compatibility

Tested with: - Dawn (Shopify reference theme) - Custom Dawn-derived V5.13
themes

Other themes must: - Use `data-media-id` on slides - Use `data-target`
on thumbnails

Selectors can be adjusted in the JS configuration if needed.
