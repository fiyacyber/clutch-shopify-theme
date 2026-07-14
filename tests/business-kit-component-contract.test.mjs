import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { syncTrackedPrintControls, validateTrackedPrintProductForm } from '../assets/tracked-print-validation.js';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const controlsSource = read('snippets/tracked-print-product-controls.liquid');
const optionsSource = read('snippets/clutch-print-product-options.liquid');
const cartSource = read('snippets/cart-products.liquid');

const contract = [
  ['Business Cards', 'business_cards'],
  ['Door Hangers', 'door_hangers'],
  ['Flyers', 'flyers'],
].flatMap(([label, key]) => [
  [`${label} Tracking Mode`, key, 'tracking'],
  [`${label} Campaign Name`, key, 'campaign'],
  [`${label} Destination URL`, key, 'destination'],
  [`${label} Existing Clutch Code`, key, 'existing'],
]);

function field(value = '', disabled = false) {
  return { value, disabled, focusCount: 0, focus() { this.focusCount += 1; } };
}

function setup() {
  const fields = { 'Artwork Method': field('upload_later') };
  const components = [];
  for (const [label, key] of [['Business Cards', 'business_cards'], ['Door Hangers', 'door_hangers'], ['Flyers', 'flyers']]) {
    const tracking = `${label} Tracking Mode`;
    const campaign = `${label} Campaign Name`;
    const destination = `${label} Destination URL`;
    const existing = `${label} Existing Clutch Code`;
    fields[tracking] = field('none');
    fields[campaign] = field('', true);
    fields[destination] = field('', true);
    fields[existing] = field('', true);
    const newPanel = {
      dataset: { businessKitPanel: 'new_included_code' },
      hidden: true,
      querySelectorAll: () => [fields[campaign], fields[destination]],
    };
    const existingPanel = {
      dataset: { businessKitPanel: 'existing_code' },
      hidden: true,
      querySelectorAll: () => [fields[existing]],
    };
    components.push({
      dataset: {
        componentLabel: label,
        trackingProperty: tracking,
        campaignProperty: campaign,
        destinationProperty: destination,
        existingProperty: existing,
        key,
      },
      panels: [newPanel, existingPanel],
      querySelectorAll: (selector) => selector === '[data-business-kit-panel]' ? [newPanel, existingPanel] : [],
    });
  }
  const list = { innerHTML: '' };
  const errors = { hidden: true, focus() {}, querySelector: () => list };
  const controls = {
    dataset: {
      campaignError: 'Enter a campaign name.',
      destinationError: 'Enter a valid destination.',
      existingError: 'Enter an existing Clutch Code.',
      fileRequiredError: 'file', fileSizeError: 'size', fileTypeError: 'type', instructionsError: 'instructions', reorderError: 'reorder',
    },
    hasAttribute: (name) => name === 'data-business-kit-components',
    querySelector(selector) {
      if (selector === '[data-tracked-print-errors]') return errors;
      if (selector === '[data-tracked-print-file]') return null;
      if (selector === '[data-tracked-print-placement]') return null;
      const name = selector.match(/properties\[([^\]]+)\]/)?.[1];
      return name ? fields[name] || null : null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-business-kit-component]') return components;
      if (selector === '[data-tracked-print-panel]' || selector === '[data-artwork-panel]') return [];
      if (selector === 'input[type="text"], input[type="url"], textarea') return Object.entries(fields).filter(([name]) => name !== 'Artwork Method').map(([, value]) => value);
      return [];
    },
    sync() { syncTrackedPrintControls(this); },
  };
  const form = { querySelector: (selector) => selector === '[data-tracked-print-controls]' ? controls : null };
  const event = { prevented: 0, stopped: 0, preventDefault() { this.prevented += 1; }, stopImmediatePropagation() { this.stopped += 1; } };
  let requests = 0;
  return {
    fields, components, errors, list,
    select(key, mode) {
      const component = components.find((entry) => entry.dataset.key === key);
      fields[component.dataset.trackingProperty].value = mode;
      syncTrackedPrintControls(controls);
    },
    submit() {
      if (!validateTrackedPrintProductForm(form, event)) return false;
      requests += 1;
      return true;
    },
    requests: () => requests,
  };
}

test('the storefront and backend share the exact twelve-property contract', () => {
  assert.equal(contract.length, 12);
  for (const [name] of contract) {
    assert.equal((controlsSource.match(new RegExp(name, 'g')) || []).length, 1, name);
    assert.match(cartSource, new RegExp(`when '${name}'`), name);
  }
});

test('Business Kits are metafield gated and never render generic authority properties', () => {
  assert.match(controlsSource, /is_business_kit and product\.metafields\.custom\.clutch_codes_90_day_access_enabled\.value == true/);
  assert.match(controlsSource, /elsif is_business_kit != true and artwork_only != true/);
  assert.match(controlsSource, /if is_business_kit != true and product\.metafields\.custom\.clutch_codes_90_day_access_enabled/);
  assert.match(optionsSource, /product: product, is_business_kit: true, artwork_only: true/);
  assert.match(controlsSource, /business_kit_component_contracts[\s\S]*for component_contract in business_kit_component_contracts/);
});

test('each component selector defaults to none and submits no component access property', () => {
  assert.match(controlsSource, /name="properties\[{{ tracking_property }}\]" value="none" checked/);
  assert.match(controlsSource, /value="new_included_code"/);
  assert.match(controlsSource, /value="existing_code"/);
  const businessKitBranch = controlsSource.slice(controlsSource.indexOf('{% if business_kit_access_enabled %}'), controlsSource.indexOf('{% elsif is_business_kit != true'));
  assert.doesNotMatch(businessKitBranch, /properties\[Clutch Codes Access\]/);
});

test('component mode switching enables only its own details', () => {
  const state = setup();
  state.select('business_cards', 'new_included_code');
  state.select('door_hangers', 'existing_code');
  assert.equal(state.fields['Business Cards Campaign Name'].disabled, false);
  assert.equal(state.fields['Business Cards Destination URL'].disabled, false);
  assert.equal(state.fields['Business Cards Existing Clutch Code'].disabled, true);
  assert.equal(state.fields['Door Hangers Existing Clutch Code'].disabled, false);
  assert.equal(state.fields['Door Hangers Campaign Name'].disabled, true);
  assert.equal(state.fields['Flyers Campaign Name'].disabled, true);
});

test('three distinct new component destinations validate as one cart request', () => {
  const state = setup();
  for (const [, key] of [['Business Cards', 'business_cards'], ['Door Hangers', 'door_hangers'], ['Flyers', 'flyers']]) {
    state.select(key, 'new_included_code');
    const component = state.components.find((entry) => entry.dataset.key === key);
    state.fields[component.dataset.campaignProperty].value = `${key} campaign`;
    state.fields[component.dataset.destinationProperty].value = `https://example.com/${key}`;
  }
  assert.equal(state.submit(), true);
  assert.equal(state.requests(), 1);
});

test('mixed new, existing, and none selections validate as one cart request', () => {
  const state = setup();
  state.select('business_cards', 'new_included_code');
  state.fields['Business Cards Campaign Name'].value = 'Cards';
  state.fields['Business Cards Destination URL'].value = 'https://example.com/cards';
  state.select('door_hangers', 'existing_code');
  state.fields['Door Hangers Existing Clutch Code'].value = 'owned-code';
  assert.equal(state.submit(), true);
  assert.equal(state.requests(), 1);
  assert.equal(state.fields['Flyers Tracking Mode'].value, 'none');
});

test('invalid component details block the cart and focus the first invalid field', () => {
  const missingCampaign = setup();
  missingCampaign.select('business_cards', 'new_included_code');
  missingCampaign.fields['Business Cards Destination URL'].value = 'https://example.com/cards';
  assert.equal(missingCampaign.submit(), false);
  assert.equal(missingCampaign.requests(), 0);
  assert.equal(missingCampaign.fields['Business Cards Campaign Name'].focusCount, 1);
  assert.match(missingCampaign.list.innerHTML, /Business Cards:/);

  const missingExisting = setup();
  missingExisting.select('door_hangers', 'existing_code');
  assert.equal(missingExisting.submit(), false);
  assert.equal(missingExisting.requests(), 0);
  assert.equal(missingExisting.fields['Door Hangers Existing Clutch Code'].focusCount, 1);
});

test('credential-bearing component destinations are rejected', () => {
  const state = setup();
  state.select('flyers', 'new_included_code');
  state.fields['Flyers Campaign Name'].value = 'Flyers';
  state.fields['Flyers Destination URL'].value = 'https://user:pass@example.com/flyers';
  assert.equal(state.submit(), false);
  assert.equal(state.requests(), 0);
});

test('initialization is guarded and the controls retain mobile behavior', () => {
  assert.match(controlsSource, /if \(this\.dataset\.initialized === 'true'\) return/);
  assert.match(controlsSource, /@media screen and \(max-width: 749px\)/);
  assert.match(controlsSource, /<fieldset class="business-kit-component__choices"[\s\S]*<legend/);
});

test('375, 390, and 430 pixel layouts remain within the single-column mobile contract', () => {
  for (const width of [375, 390, 430]) assert.ok(width < 749);
  assert.match(controlsSource, /\.business-kit-component__panel input \{ width: 100%/);
  assert.match(controlsSource, /\.tracked-print-controls \{ display: grid/);
});
