import assert from 'node:assert/strict';
import test from 'node:test';

import { validateTrackedPrintProductForm } from '../assets/tracked-print-validation.js';

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

function field(value = '', extras = {}) {
  return {
    value,
    disabled: false,
    focusCount: 0,
    focus() {
      this.focusCount += 1;
    },
    ...extras,
  };
}

function setup({ tracking = 'none', artwork = 'upload_later', values = {}, file: uploadedFile } = {}) {
  const fields = {
    'Tracking Mode': field(tracking),
    'Artwork Method': field(artwork),
    'Campaign Name': field(values.campaign),
    'Destination URL': field(values.destination),
    'Existing Clutch Code': field(values.existing),
    'QR Placement Instructions': field(values.placement),
    'Artwork Instructions': field(values.instructions),
    'Reorder Reference': field(values.reorder),
  };
  const upload = field('', { files: uploadedFile ? [uploadedFile] : [] });
  const list = { innerHTML: '' };
  const errors = {
    hidden: true,
    focusCount: 0,
    focus() {
      this.focusCount += 1;
    },
    querySelector(selector) {
      return selector === 'ul' ? list : null;
    },
  };
  const controls = {
    dataset: messages,
    syncCount: 0,
    sync() {
      this.syncCount += 1;
    },
    querySelector(selector) {
      if (selector === '[data-tracked-print-errors]') return errors;
      if (selector === '[data-tracked-print-file]') return upload;
      const name = selector.match(/properties\[([^\]]+)\]/)?.[1];
      return name ? fields[name] : null;
    },
    querySelectorAll() {
      return Object.values(fields);
    },
  };
  const form = {
    querySelector(selector) {
      return selector === '[data-tracked-print-controls]' ? controls : null;
    },
  };
  const event = {
    prevented: 0,
    stopped: 0,
    preventDefault() {
      this.prevented += 1;
    },
    stopImmediatePropagation() {
      this.stopped += 1;
    },
  };
  let requests = 0;
  const submitAtRequestBoundary = () => {
    if (!validateTrackedPrintProductForm(form, event)) return false;
    requests += 1;
    return true;
  };
  return { fields, upload, errors, list, controls, form, event, submitAtRequestBoundary, requests: () => requests };
}

test('A: invalid new-code input blocks the cart request and focuses the first invalid field', () => {
  const state = setup({ tracking: 'new_included_code', values: { destination: 'ftp://example.com' } });
  assert.equal(state.submitAtRequestBoundary(), false);
  assert.equal(state.requests(), 0);
  assert.equal(state.event.prevented, 1);
  assert.equal(state.event.stopped, 1);
  assert.equal(state.errors.hidden, false);
  assert.equal(state.fields['Campaign Name'].focusCount, 1);
});

test('B: unsafe or malformed destination URLs never reach the cart request', () => {
  const invalidUrls = [
    'ftp://example.com',
    'file:///tmp/artwork.pdf',
    'javascript:alert(1)',
    'data:text/plain,hello',
    'blob:https://example.com/id',
    '//example.com/path',
    'not a url',
    ' https://example.com',
    'https://example.com/path here',
  ];
  for (const destination of invalidUrls) {
    const state = setup({ tracking: 'new_included_code', values: { campaign: 'Launch', destination } });
    assert.equal(state.submitAtRequestBoundary(), false, destination);
    assert.equal(state.requests(), 0, destination);
  }
});

test('C: valid new included code makes exactly one cart request', () => {
  const state = setup({
    tracking: 'new_included_code',
    values: { campaign: 'Launch', destination: 'https://example.com/launch' },
  });
  assert.equal(state.submitAtRequestBoundary(), true);
  assert.equal(state.requests(), 1);
});

test('D: valid existing-code selection makes exactly one cart request', () => {
  const state = setup({ tracking: 'existing_code', values: { existing: 'spring-campaign' } });
  assert.equal(state.submitAtRequestBoundary(), true);
  assert.equal(state.requests(), 1);
});

test('E: upload-now requires an allowed file and passes a valid file once', () => {
  const missing = setup({ artwork: 'upload_now' });
  assert.equal(missing.submitAtRequestBoundary(), false);
  assert.equal(missing.requests(), 0);

  const invalidType = setup({ artwork: 'upload_now', file: { name: 'artwork.svg', size: 100 } });
  assert.equal(invalidType.submitAtRequestBoundary(), false);
  assert.equal(invalidType.requests(), 0);

  const oversized = setup({ artwork: 'upload_now', file: { name: 'artwork.pdf', size: 25 * 1024 * 1024 + 1 } });
  assert.equal(oversized.submitAtRequestBoundary(), false);
  assert.equal(oversized.requests(), 0);

  const valid = setup({ artwork: 'upload_now', file: { name: 'artwork.pdf', size: 1024 } });
  assert.equal(valid.submitAtRequestBoundary(), true);
  assert.equal(valid.requests(), 1);
});

test('F: upload-later remains valid without a file', () => {
  const state = setup({ artwork: 'upload_later' });
  assert.equal(state.submitAtRequestBoundary(), true);
  assert.equal(state.requests(), 1);
});

test('G: design requests require instructions', () => {
  const invalid = setup({ artwork: 'request_design' });
  assert.equal(invalid.submitAtRequestBoundary(), false);
  assert.equal(invalid.requests(), 0);

  const valid = setup({ artwork: 'request_design', values: { instructions: 'Use the orange logo.' } });
  assert.equal(valid.submitAtRequestBoundary(), true);
  assert.equal(valid.requests(), 1);
});

test('H: reorders require a prior order reference', () => {
  const invalid = setup({ artwork: 'reorder_existing' });
  assert.equal(invalid.submitAtRequestBoundary(), false);
  assert.equal(invalid.requests(), 0);

  const valid = setup({ artwork: 'reorder_existing', values: { reorder: '#1001' } });
  assert.equal(valid.submitAtRequestBoundary(), true);
  assert.equal(valid.requests(), 1);
});

test('I: ineligible product forms pass through untouched', () => {
  let requests = 0;
  const event = { preventDefault() {}, stopImmediatePropagation() {} };
  const form = { querySelector: () => null };
  if (validateTrackedPrintProductForm(form, event)) requests += 1;
  assert.equal(requests, 1);
});

test('J: multiple forms remain scoped and no valid submission creates duplicate requests', () => {
  const invalidEligible = setup({ tracking: 'new_included_code', values: { campaign: 'Launch', destination: 'ftp://bad' } });
  const validEligible = setup({ tracking: 'new_included_code', values: { campaign: 'Launch', destination: 'http://example.com' } });
  assert.equal(invalidEligible.submitAtRequestBoundary(), false);
  assert.equal(invalidEligible.requests(), 0);
  assert.equal(validEligible.submitAtRequestBoundary(), true);
  assert.equal(validEligible.requests(), 1);
  assert.equal(invalidEligible.errors.hidden, false);
  assert.equal(validEligible.errors.hidden, true);
});
