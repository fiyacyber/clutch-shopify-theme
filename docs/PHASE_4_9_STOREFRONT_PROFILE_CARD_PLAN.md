# Phase 4.9 Storefront Profile/Card Plan

## What Was Cleaned

- Kept the existing Smart Card page at `templates/page.smart-business-card.json` and `sections/clutch-smart-business-card-page.liquid`; no duplicate Smart Card page was created.
- Shifted public-facing naming from Smart Business Card toward Smart Clutch Card, Clutch Profile, and Clutch Connect.
- Replaced stale Smart Card price badges with safer feature copy:
  - Free Clutch Profile included
  - NFC tap + QR fallback
  - Profile setup after checkout
  - Optional upgrades inside Clutch Connect
- Replaced wallet overpromises with safer contact-save language.
- Clarified that Shopify is for ordering and that profile setup happens after checkout inside the Clutch portal.
- Preserved artwork, design notes, engraving details, and upload fields as line item properties only.
- Confirmed the Growth Kit yard sign offer copy is the single approved offer: Optional: Add 100 1-color, 2-sided yard signs for $399.

## Files Changed

- `assets/product-form.js`
- `sections/clutch-smart-business-card-page.liquid`
- `sections/clutch-connect-card-product.liquid`
- `sections/clutch-homepage-v2.liquid`
- `sections/clutch-business-kits-collection.liquid`
- `sections/clutch-business-kits.liquid`
- `sections/clutch-footer.liquid`
- `sections/clutch-shop-hero.liquid`
- `sections/clutch-contact-page.liquid`
- `sections/clutch-qr-pro-page.liquid`
- `sections/clutch-qr-pro.liquid`
- `snippets/clutch-business-cards-nav.liquid`
- `snippets/clutch-connect-card-mockup.liquid`
- `snippets/clutch-connect-card-section.liquid`
- `snippets/clutch-print-product-options.liquid`
- `snippets/clutch-product-overview.liquid`
- `snippets/clutch-shop-product-card.liquid`
- `snippets/clutch-storefront-enhancements.liquid`

## Remaining Pricing Decisions

- Smart Clutch Card base price should be displayed from Shopify product data or confirmed product configuration, not hardcoded theme copy.
- Additional Smart Cards need a confirmed product quantity, variant, bundle, or add-on model before public price claims return.
- Engraving should stay as a request/details field until a real paid Shopify variant or add-on product is connected.
- Clutch Connect hosting pricing and selling-plan behavior should be verified in cart and checkout before stronger public billing copy is used on Smart Card pages.

## Remaining Add-On Charging Risks

- Professional Design is backed by a real Shopify add-on variant, but still needs real cart and checkout verification.
- Growth Kit Yard Sign Add-On is backed by real Shopify variant `44493905559594`, but still needs real cart and checkout verification.
- Smart Card engraving is not currently backed by a proven paid variant/add-on path.
- Additional Smart Cards are not currently backed by a proven add-on path beyond normal product quantity/variant behavior.
- Print-product Clutch Connect hosting upsells still need a proven subscription/selling-plan cart path.

## Shopify Admin Navigation Steps

If main navigation should expose these pages, configure it in Shopify Admin:

Online Store -> Navigation -> Main menu

- Smart Clutch Card -> `/pages/smart-business-card`
- Clutch Profile -> `/pages/clutch-profile`

The theme footer now includes a prepared Clutch Profile resource link to `/pages/clutch-profile`, but the full Clutch Profile page should be built in a later phase.

## Phase 4.9.1 Recommendation

- Build the Clutch Profile storefront page as a focused informational page, not a Shopify-hosted profile builder.
- Keep Shopify checkout as the purchase path only.
- Explain that customers receive setup guidance after checkout and complete profile setup in the Clutch portal.
- Pull Smart Clutch Card pricing from Shopify product data where possible, or confirm product/variant pricing before adding customer-facing price badges.
- Add real paid paths for engraving and additional cards before using price claims in public copy.
