import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const controls = read('snippets/tracked-print-product-controls.liquid');
const component = read('snippets/clutch-codes-included-access.liquid');
const cards = read('snippets/product-card.liquid');
const kits = read('sections/clutch-business-kits-collection.liquid');
const cart = read('snippets/cart-products.liquid');

test('full component uses approved copy and no subscription or charge claim', () => {
  assert.match(component, /90 Days of Clutch Codes™ Access Included/);
  assert.match(component, /No automatic subscription or charge/);
  assert.doesNotMatch(component, /free trial|auto-renew|cancel anytime|unlimited codes/i);
});

test('merchant boolean gates product form and compact product-card treatment', () => {
  assert.match(controls, /custom\.clutch_codes_90_day_access_enabled\.value == true/);
  assert.match(cards, /custom\.clutch_codes_90_day_access_enabled\.value == true/);
  assert.match(component, /90-Day Clutch Codes™ Access/);
});

test('new code submits canonical opt-in while existing and none submit no access', () => {
  assert.match(controls, /name="properties\[Clutch Codes Access\]" value="none"/);
  assert.match(controls, /tracking === 'new_included_code' \? 'included_90_days' : 'none'/);
  assert.match(controls, /value="existing_code"/);
  assert.match(controls, /value="none"/);
});

test('cart presents normalized opt-in as customer copy without another product line', () => {
  assert.match(cart, /when 'Clutch Codes Access'/);
  assert.match(cart, /90 Days Included/);
  assert.doesNotMatch(component, /product-form|variant_id|selling_plan/);
});

test('Starter and Growth cards keep design value and add separately gated access benefit', () => {
  assert.equal((kits.match(/Professional Design Included/g) || []).length >= 2, true);
  assert.equal((kits.match(/90 Days Clutch Codes™ Access Included/g) || []).length, 2);
  assert.doesNotMatch(kits.match(/clutch-kit-card--custom[\s\S]*?<\/article>/)?.[0] || '', /90 Days Clutch Codes/);
});

test('existing tracked-print submission boundary is preserved', () => {
  assert.match(controls, /window\.ClutchTrackedPrintValidation\?\.validateTrackedPrintProductForm/);
  assert.match(controls, /event\.stopImmediatePropagation/);
  assert.equal((controls.match(/name="properties\[Tracking Mode\]"/g) || []).length, 3);
});
