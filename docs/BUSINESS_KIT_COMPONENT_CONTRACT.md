# Business Kit component contract

Starter and Growth Business Kits remain one Shopify cart line. When `custom.clutch_codes_90_day_access_enabled` is true, the product form submits one independent component selection for business cards, door hangers, and flyers. When the metafield is missing or false, no component tracking properties are rendered or submitted and the shared artwork workflow remains available.

| Component | Tracking mode | Campaign | Destination | Existing code |
| --- | --- | --- | --- | --- |
| Business cards | `Business Cards Tracking Mode` | `Business Cards Campaign Name` | `Business Cards Destination URL` | `Business Cards Existing Clutch Code` |
| Door hangers | `Door Hangers Tracking Mode` | `Door Hangers Campaign Name` | `Door Hangers Destination URL` | `Door Hangers Existing Clutch Code` |
| Flyers | `Flyers Tracking Mode` | `Flyers Campaign Name` | `Flyers Destination URL` | `Flyers Existing Clutch Code` |

Every tracking selector submits exactly one of `none`, `new_included_code`, or `existing_code`, defaulting to `none`. New-code mode enables only its matching campaign and destination. Existing-code mode enables only its matching code reference. Disabled detail fields are omitted from Shopify line-item properties. The theme never submits component-specific `Clutch Codes Access`; the trusted application contract synthesizes canonical access values after atomic server validation.

Browser validation requires a campaign and credential-free HTTP(S) destination for new components and a reference for existing components. It runs at the native and AJAX submission boundaries, focuses the first invalid field, and scopes every error to its component. This validation is customer guidance, not entitlement authority.

The cart presents component tracking values with customer-facing labels while retaining the existing artwork, included Professional Design, quantity, and pricing behavior. Product IDs, SKUs, material types, eligibility, and server grants remain controlled by the application’s disabled-by-default trusted registries and feature flags.
