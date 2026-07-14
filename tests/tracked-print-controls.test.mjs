import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const controls = read('snippets/tracked-print-product-controls.liquid');
const options = read('snippets/clutch-print-product-options.liquid');
const cart = read('snippets/cart-products.liquid');
const productForm = read('assets/product-form.js');
const validation = read('assets/tracked-print-validation.js');
const buyButtons = read('blocks/buy-buttons.liquid');
const quickAdd = read('snippets/quick-add.liquid');
const locale = read('locales/en.default.json');

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
  assert.match(validation, /25 \* 1024 \* 1024/);
});

test('browser validation covers conditional fields and safe URL protocols', () => {
  assert.match(validation, /new URL\(rawDestination\)/);
  assert.match(validation, /\['http:', 'https:'\]/);
  assert.match(validation, /rawDestination === rawDestination\.trim\(\)/);
  assert.match(validation, /!\/\\s\/\.test\(rawDestination\)/);
  assert.match(validation, /!rawDestination\.startsWith\('\/\/'\)/);
  assert.match(validation, /request_design[\s\S]*Artwork Instructions/);
  assert.match(validation, /reorder_existing[\s\S]*Reorder Reference/);
  assert.match(validation, /event\.preventDefault\(\)/);
  assert.match(locale, /HTTP or HTTPS destination URL\. HTTPS is preferred\./);
});

test('AJAX request boundary validates before cart processing and returns immediately when invalid', () => {
  const handlerStart = productForm.indexOf('handleSubmit(event)');
  const handler = productForm.slice(handlerStart, productForm.indexOf('/** @returns {string | undefined} */', handlerStart));
  const validationIndex = handler.indexOf('validateTrackedPrintProductForm(form, event)');
  const returnIndex = handler.indexOf('if (!validateTrackedPrintProductForm(form, event)) return;');
  const processIndex = handler.indexOf('#processAddToCart');
  assert.ok(validationIndex >= 0);
  assert.ok(returnIndex >= 0);
  assert.ok(processIndex > returnIndex);
});

test('eligible accelerated checkout and direct quick add are disabled without affecting other products', () => {
  assert.match(buyButtons, /unless is_smart_card_product or tracked_print_enabled/);
  assert.match(quickAdd, /if tracked_print_enabled != true[\s\S]*assign quick_add_button = 'add'/);
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
  assert.match(validation, /invalid\[0\]\?\.focus\(\)/);
  assert.match(controls, /@media screen and \(max-width: 749px\)/);
  assert.match(controls, /addEventListener\('keydown',[\s\S]*event\.key !== 'Enter'[\s\S]*\['text', 'url'\][\s\S]*form\.requestSubmit\(\)/);
  assert.match(controls, /form\.addEventListener\('submit',[\s\S]*if \(!validator\)[\s\S]*event\.preventDefault\(\)[\s\S]*validator\(this\.form, event\)[\s\S]*true\)/);
});
