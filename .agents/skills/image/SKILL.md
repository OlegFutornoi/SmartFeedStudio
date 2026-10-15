---
name: image
description: Media asset generation, Sharp WebP image compression, product photo optimization, and placeholder management in SmartFeed Studio. Use when optimizing product catalog photos, generating WebP thumbnails, compressing hero illustrations, or configuring image loading placeholders. Do not use for server database queries; use backend or database skills instead.
rules: [core, frontend]
---

# Image Processing and Asset Optimization

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/frontend.md`.
2. Verify invariant `CORE-04`: image handling utilities must stay under 250 lines.
3. Verify invariant `UI-02`: generated graphics and placeholders must align with semantic theme tokens.
4. Do not generate or process images until steps 1-3 are verified.

## Inputs

- Source image file (PNG, JPEG, SVG, WebP) or text prompt for asset generation.
- Target dimensions (width, height, aspect ratio) and destination directory.

## Procedure

1. Step 1 - Define Target Dimensions: standard catalog thumbnails: 120x120px; product cards: 400x400px; modal heroes: 800x600px.
2. Step 2 - Sharp WebP Pipeline: process raster images through Sharp: convert to WebP format, set quality to 80-85, enable progressive rendering, and strip EXIF metadata.
3. Step 3 - Aspect Ratio Preservation: resize with `fit: 'cover'` or `fit: 'inside'` to prevent visual distortion of product packaging.
4. Step 4 - Placeholder Generation: generate low-resolution blurred SVG or 16x16px base64 data URIs for instant progressive loading in Next.js `<Image />` or desktop view.
5. Step 5 - S3 Storage Upload: store processed WebP files in MinIO / Cloudflare R2 bucket with content-type `image/webp` and immutable cache-control headers (`public, max-age=31536000, immutable`).

## Outputs

- Optimized WebP image assets in public assets or S3 bucket.
- Thumbnail and blurred placeholder metadata.

## Gate (stop condition)

- File size reduced by 40-70% compared to raw PNG/JPEG source.
- Image format verified as WebP via binary inspection.
- Responsive breakpoints generated.

## Never

- Never serve uncompressed multi-megabyte PNG/JPEG images in product catalogs.
- Never output raw marketing lectures or conversational text.
- Never hardcode absolute hostnames in image URLs; use relative paths or CDN prefix.

## References

- `references/image-models.md` - read when selecting AI image generation model APIs.
