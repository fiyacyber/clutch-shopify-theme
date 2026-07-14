import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { syncTrackedPrintControls, validateTrackedPrintProductForm } from '../assets/tracked-print-validation.js';

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const options = read('snippets/clutch-print-product-options.liquid');
const controls = read('snippets/tracked-print-product-controls.liquid');
const cart = read('snippets/cart-products.liquid');
const locale = read('locales/en.default.json');
const productTemplate = read('templates/product.json');
const productDetails = read('blocks/_product-details.liquid');
const validationSource = read('assets/tracked-print-validation.js');

const messages = {
  campaignError: 'campaign',
  destinationError: 'destination',
  existingError: 'existing',
  fileRequiredError: 'file required',
  fileSizeError: 'file size',
  fileTypeError: 'file type',
  instructionsError: 'instructions',
  reorderError: 'reorder',
};

function stateFor(artwork, values = {}, uploadedFile) {
  const fields = {
    'Tracking Mode': { value: 'none', disabled: false },
    'Artwork Method': { value: artwork, disabled: false },
    'Artwork Instructions': { value: values.instructions || '', disabled: false, focus() {} },
    'Reorder Reference': { value: values.reorder || '', disabled: false, focus() {} },
  };
  const errors = { hidden: true, focus() {}, querySelector: () => ({ innerHTML: '' }) };
  const upload = { files: uploadedFile ? [uploadedFile] : [], disabled: false, focus() {} };
  const controlsNode = {
    dataset: messages,
    sync() {},
    querySelector(selector) {
      if (selector === '[data-tracked-print-errors]') return errors;
      if (selector === '[data-tracked-print-file]') return upload;
      const name = selector.match(/properties\[([^\]]+)\]/)?.[1];
      return name ? fields[name] || null : null;
    },
    querySelectorAll: () => Object.values(fields),
  };
  const form = { querySelector: () => controlsNode };
  const event = { preventDefault() {}, stopImmediatePropagation() {} };
  let requests = 0;
  return {
    submit() {
      if (!validateTrackedPrintProductForm(form, event)) return false;
      requests += 1;
      return true;
    },
    requests: () => requests,
  };
}

test('starter-business-kit is classified with an exact handle', () => {
  assert.match(options, /when 'starter-business-kit', 'growth-business-kit'/);
});

test('growth-business-kit is classified with an exact handle', () => {
  assert.match(options, /when 'starter-business-kit', 'growth-business-kit'/);
});

test('legacy Business Kit handles remain explicitly supported', () => {
  for (const handle of ['starter-kit', 'startup-kit', 'growth-kit']) assert.match(options, new RegExp(`'${handle}'`));
});

test('Starter Business Kit does not render the paid design checkbox branch', () => {
  assert.match(options, /unless is_business_kit[\s\S]*data-clutch-addon-title="Professional Design"[\s\S]*endunless/);
});

test('Growth Business Kit does not render the paid design checkbox branch', () => {
  assert.doesNotMatch(options, /growth-business-kit[\s\S]{0,500}data-clutch-addon-title="Professional Design"/);
});

test('Business Kit forms cannot submit the Professional Design variant', () => {
  assert.match(options, /unless is_business_kit[\s\S]*data-clutch-addon-variant-id="{{ professional_design_variant_id }}"/);
});

test('request_design preserves its canonical Artwork Method value', () => {
  assert.match(controls, /name="properties\[Artwork Method\]" value="request_design"/);
});

test('request_design requires canonical Artwork Instructions', () => {
  assert.match(controls, /data-artwork-panel="request_design"[\s\S]*name="properties\[Artwork Instructions\]"/);
  const invalid = stateFor('request_design');
  assert.equal(invalid.submit(), false);
  assert.equal(invalid.requests(), 0);
});

test('artwork panels synchronize without requiring a custom-element upgrade', () => {
  const instruction = { disabled: true };
  const requestPanel = {
    dataset: { artworkPanel: 'request_design' },
    hidden: true,
    querySelectorAll: () => [instruction],
  };
  const controlsNode = {
    querySelector(selector) {
      if (selector.includes('Artwork Method')) return { value: 'request_design' };
      if (selector.includes('Tracking Mode')) return null;
      if (selector === '[data-tracked-print-placement]') return null;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-artwork-panel]') return [requestPanel];
      return [];
    },
  };

  syncTrackedPrintControls(controlsNode);
  assert.equal(requestPanel.hidden, false);
  assert.equal(instruction.disabled, false);
});

test('artwork-only controls tolerate the intentionally absent tracking placement panel', () => {
  assert.match(controls, /activate\(container, active\) \{\s*if \(!container\) return;/);
});

test('tracked-print validation guards native form submission before cart navigation', () => {
  assert.match(
    validationSource,
    /document\.addEventListener\('submit',[\s\S]*validateTrackedPrintProductForm\(form, event\)[\s\S]*}, true\)/,
  );
});

test('valid request_design creates one cart request', () => {
  const state = stateFor('request_design', { instructions: 'Use navy and orange with the supplied business details.' });
  assert.equal(state.submit(), true);
  assert.equal(state.requests(), 1);
});

test('valid upload_now creates one cart request', () => {
  const state = stateFor('upload_now', {}, { name: 'kit-artwork.pdf', size: 1024 });
  assert.equal(state.submit(), true);
  assert.equal(state.requests(), 1);
});

test('valid upload_later creates one cart request', () => {
  const state = stateFor('upload_later');
  assert.equal(state.submit(), true);
  assert.equal(state.requests(), 1);
});

test('valid reorder_existing retains validation and creates one cart request', () => {
  const invalid = stateFor('reorder_existing');
  assert.equal(invalid.submit(), false);
  assert.equal(invalid.requests(), 0);
  const valid = stateFor('reorder_existing', { reorder: '#1001' });
  assert.equal(valid.submit(), true);
  assert.equal(valid.requests(), 1);
});

test('Business Kit price is never hardcoded into the form correction', () => {
  assert.doesNotMatch(options, /\$399|\$649/);
});

test('eligible ordinary print products retain their paid Professional Design option', () => {
  assert.match(options, /data-clutch-addon-title="Professional Design"/);
  assert.match(options, /Professional Design Add-On/);
  assert.match(options, /\$200 flat fee/);
});

test('Clutch NFC Card engraving behavior remains isolated and unchanged', () => {
  assert.match(options, /if is_connect_card[\s\S]*data-smart-card-engraving/);
  assert.match(options, /data-clutch-addon-title="Smart Card Custom Engraving"/);
});

test('artwork-only Business Kit mode claims the contract only when component access is enabled', () => {
  assert.match(options, /render 'tracked-print-product-controls'[\s\S]*artwork_only: true/);
  assert.match(controls, /if artwork_only != true or business_kit_access_enabled[\s\S]*properties\[_Tracked Print Contract\]/);
});

test('invalid Business Kit artwork configuration creates zero cart requests', () => {
  const missingFile = stateFor('upload_now');
  assert.equal(missingFile.submit(), false);
  assert.equal(missingFile.requests(), 0);
});

test('cart presents request_design as included only for Business Kit handles', () => {
  assert.match(cart, /when 'starter-business-kit', 'growth-business-kit', 'starter-kit', 'startup-kit', 'growth-kit'[\s\S]*artwork_request_design_included/);
  assert.match(cart, /else[\s\S]*artwork_request_design/);
  assert.match(locale, /"artwork_request_design_included": "Included Professional Design"/);
});

test('Business Kit design benefit uses approved copy without a fee or add-on claim', () => {
  assert.match(locale, /"design_title": "Professional Design Included"/);
  assert.match(locale, /"design_value": "\$200 Value"/);
  assert.match(locale, /included with your Business Kit at no additional charge/);
  assert.doesNotMatch(locale, /Professional Design Free/);
});

test('stale Business Kit-only QR and yard-sign claims are removed', () => {
  for (const claim of ['Campaign-Level Clutch Codes Included', 'Track each eligible printed material separately', 'Optional: Add 100 1-color, 2-sided yard signs for $399.', 'Compare Starter, Growth, and Pro']) {
    assert.doesNotMatch(options, new RegExp(claim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('product heading follows the current Shopify product while preserving Smart Card copy', () => {
  assert.match(productTemplate, /<h1>{{ closest\.product\.title }}<\/h1>/);
  assert.match(productDetails, /if \(heading\) heading\.textContent = 'Smart Business Card'/);
});

test('inactive artwork panels remain removed from layout', () => {
  assert.match(controls, /\.tracked-print-controls__panel\[hidden\] \{ display: none; \}/);
});
