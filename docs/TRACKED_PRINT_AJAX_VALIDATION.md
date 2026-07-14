# Tracked-print AJAX validation

Eligible tracked-print products are validated at the beginning of Horizon's `product-form-component` AJAX submit handler. Invalid submissions return before form serialization, cart requests, loading state, cart UI updates, analytics, or success events.

The native capture-phase form listener calls the same form-scoped validator as defense in depth. Normal Add to cart, sticky Add to cart, Enter-key submission, and `requestSubmit()` therefore share one validation path. Forms without rendered tracked-print controls pass through unchanged, including unrelated product forms and ordinary quick add.

Direct quick add is replaced by Choose options for eligible tracked-print products so the customer reaches the complete product form. Accelerated checkout is hidden only for eligible tracked-print products because Shopify's accelerated button cannot reliably validate the custom workflow or preserve every required line-item property before checkout.

Destination URLs must be absolute HTTP or HTTPS URLs without leading, trailing, or embedded whitespace. HTTPS is preferred. Protocol-relative, malformed, `ftp:`, `file:`, `javascript:`, `data:`, and `blob:` values are rejected.
