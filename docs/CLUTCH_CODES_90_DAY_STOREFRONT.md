# Clutch Codes 90-day storefront presentation

The reusable `clutch-codes-included-access` snippet is controlled by the merchant-owned product metafield:

- Namespace/key: `custom.clutch_codes_90_day_access_enabled`
- Type: `boolean`
- Default/unset behavior: hidden and no timed-access line property

The metafield is presentation-only. The application independently requires its exact trusted product registry, feature flag, paid order, canonical tracking mode, and normalized opt-in.

When enabled on an eligible tracked-print product, selecting `new_included_code` submits the visible line property `Clutch Codes Access=included_90_days`. Selecting `existing_code` or `none` submits `Clutch Codes Access=none`. The cart presents the opted-in value as “90 Days Included” and does not add a product, selling plan, fee, or additional cart line.

Generic collection cards use the compact “90-Day Clutch Codes™ Access” label. The cleaned Business Kits section shows “90 Days Clutch Codes™ Access Included” separately from “Professional Design Included — $200 Value” on Starter and Growth only when their product metafields are true. The Custom Kit remains unlabelled.

Do not set metafields or publish this messaging until the application migration is applied, the application is deployed with flags false, exact registries are approved, and one controlled product is authorized.
