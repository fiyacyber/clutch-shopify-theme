import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const controls = read('snippets/tracked-print-product-controls.liquid');
const options = read('snippets/clutch-print-product-options.liquid');
const cart = read('snippets/cart-products.liquid');
const productForm = read('assets/product-form.js');
const buyButtons = read('blocks/buy-buttons.liquid');

test('controls are fail-closed behind the merchant metafield', () => {
  assert.match(options, /product\.metafields\.custom\.tracked_print_enabled\.value == true/);
  assert.match(options, /if tracked_print_enabled[\s\S]*render 'tracked-print-product-controls'/);
  assert.match(options, /unless tracked_print_enabled[\s\S]*properties\[Artwork upload\]/);
});

test('canonical tracking values default safely to none', () => {
  for (const value of ['none', 'new_included_code', 'existing_code']) {
    assert.match(controls, new RegExp(`name="properties\\[Tracking Mode\\]" value="${value}"`));
  }
  assert.match(controls, /value="none" checked/);
  for (const property of ['Campaign Name', 'Destination URL', 'Existing Clutch Code', 'QR Placement Instructions']) {
    assert.match(controls, new RegExp(`properties\\[${property}\\]`));
  }
});

test('canonical artwork methods and file contract are present', () => {
  for (const value of ['upload_now', 'upload_later', 'request_design', 'reorder_existing']) {
    assert.match(controls, new RegExp(`name="properties\\[Artwork Method\\]" value="${value}"`));
  }
  assert.match(controls, /value="upload_later" checked/);
  assert.match(controls, /properties\[Artwork Upload URL\]/);
  assert.match(controls, /\.pdf,.png,.jpg,.jpeg,.tif,.tiff,.eps/);
  assert.match(controls, /25 \* 1024 \* 1024/);
});

test('browser validation covers conditional fields and safe URL protocols', () => {
  assert.match(controls, /new URL\(destination\?\.value/);
  assert.match(controls, /\['http:', 'https:'\]/);
  assert.match(controls, /request_design[\s\S]*Artwork Instructions/);
  assert.match(controls, /reorder_existing[\s\S]*Reorder Reference/);
  assert.match(controls, /event\.preventDefault\(\)/);
});

test('browser never submits trusted material classification', () => {
  assert.doesNotMatch(controls, /properties\[(Material Type|Tracked Print Enabled)\]/);
  assert.match(controls, /properties\[_Tracked Print Contract\]/);
});

test('native product form preserves line properties and uploaded files', () => {
  assert.match(productForm, /new FormData\(form\)/);
  assert.doesNotMatch(productForm, /new URLSearchParams\(new FormData/);
  assert.match(buyButtons, /form 'product', product/);
  assert.match(buyButtons, /name="id"[\s\S]*selected_or_first_available_variant\.id/);
  assert.match(buyButtons, /content_for 'block', type: 'quantity'/);
  assert.match(cart, /item\.selling_plan_allocation/);
  assert.match(options, /data-smart-card-engraving/);
});

test('cart renders friendly canonical values and keeps private properties hidden', () => {
  assert.match(cart, /property_first_char != '_'/);
  for (const value of ['new_included_code', 'existing_code', 'upload_now', 'upload_later', 'request_design', 'reorder_existing']) {
    assert.match(cart, new RegExp(`when '${value}'`));
  }
  assert.match(cart, /property\.last contains '\/uploads\/'/);
});

test('controls remain keyboard, screen-reader, and mobile friendly', () => {
  assert.match(controls, /<fieldset[\s\S]*<legend/);
  assert.match(controls, /role="alert" tabindex="-1"/);
  assert.match(controls, /invalid\[0\]\?\.focus\(\)/);
  assert.match(controls, /@media screen and \(max-width: 749px\)/);
  assert.match(controls, /form\.addEventListener\('submit',[\s\S]*true\)/);
});
