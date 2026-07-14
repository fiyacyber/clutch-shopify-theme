const TRACKED_PRINT_CONTROLS_SELECTOR = '[data-tracked-print-controls]';

/**
 * Keeps conditional tracked-print fields visible and enabled even when the
 * theme renders this snippet without upgrading its custom element.
 *
 * @param {Element | null | undefined} controls
 */
export function syncTrackedPrintControls(controls) {
  if (!controls) return;

  const selected = (name) =>
    controls.querySelector(`[name="properties[${name}]"]:checked`)?.value || '';
  const activate = (container, active) => {
    if (!container) return;
    container.hidden = !active;
    container.querySelectorAll('input, textarea, select').forEach((field) => {
      field.disabled = !active;
    });
  };

  const tracking = selected('Tracking Mode');
  const artwork = selected('Artwork Method');
  controls.querySelectorAll('[data-tracked-print-panel]').forEach((panel) => {
    activate(panel, panel.dataset.trackedPrintPanel === tracking);
  });
  activate(controls.querySelector('[data-tracked-print-placement]'), tracking !== 'none');
  controls.querySelectorAll('[data-artwork-panel]').forEach((panel) => {
    activate(panel, panel.dataset.artworkPanel === artwork);
  });
}

/**
 * Validates tracked-print controls belonging to one active Shopify product form.
 * Forms without eligible tracked-print controls pass through unchanged.
 *
 * @param {HTMLFormElement | null | undefined} form
 * @param {Event} event
 * @returns {boolean}
 */
export function validateTrackedPrintProductForm(form, event) {
  const controls = form?.querySelector(TRACKED_PRINT_CONTROLS_SELECTOR);
  if (!controls) return true;

  if (typeof controls.sync === 'function') controls.sync();
  else syncTrackedPrintControls(controls);

  const messages = [];
  const invalid = [];
  const selected = (name) =>
    controls.querySelector(`[name="properties[${name}]"]:checked`)?.value || '';
  const requireValue = (name, message) => {
    const field = controls.querySelector(`[name="properties[${name}]"]`);
    if (!field || field.disabled || String(field.value || '').trim()) return;
    messages.push(message);
    invalid.push(field);
  };

  const tracking = selected('Tracking Mode');
  const artwork = selected('Artwork Method');

  if (tracking === 'new_included_code') {
    requireValue('Campaign Name', controls.dataset.campaignError);

    const destination = controls.querySelector('[name="properties[Destination URL]"]');
    const rawDestination = String(destination?.value || '');
    let destinationIsValid =
      rawDestination.length > 0 &&
      rawDestination === rawDestination.trim() &&
      !/\s/.test(rawDestination) &&
      !rawDestination.startsWith('//');

    if (destinationIsValid) {
      try {
        const parsed = new URL(rawDestination);
        destinationIsValid = ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        destinationIsValid = false;
      }
    }

    if (!destinationIsValid) {
      messages.push(controls.dataset.destinationError);
      invalid.push(destination);
    }
  }

  if (tracking === 'existing_code') {
    requireValue('Existing Clutch Code', controls.dataset.existingError);
  }

  if (artwork === 'upload_now') {
    const file = controls.querySelector('[data-tracked-print-file]');
    const allowed = /\.(pdf|png|jpe?g|tiff?|eps)$/i;
    if (!file?.files?.length) {
      messages.push(controls.dataset.fileRequiredError);
      invalid.push(file);
    } else if (file.files[0].size > 25 * 1024 * 1024) {
      messages.push(controls.dataset.fileSizeError);
      invalid.push(file);
    } else if (!allowed.test(file.files[0].name)) {
      messages.push(controls.dataset.fileTypeError);
      invalid.push(file);
    }
  }

  if (artwork === 'request_design') {
    requireValue('Artwork Instructions', controls.dataset.instructionsError);
  }

  if (artwork === 'reorder_existing') {
    requireValue('Reorder Reference', controls.dataset.reorderError);
  }

  const errors = controls.querySelector('[data-tracked-print-errors]');
  if (messages.length) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const list = errors?.querySelector('ul');
    if (list) list.innerHTML = messages.map((message) => `<li>${message}</li>`).join('');
    if (errors) {
      errors.hidden = false;
      errors.focus();
    }
    invalid[0]?.focus();
    return false;
  }

  if (errors) errors.hidden = true;
  const temporarilyDisabled = [];
  controls.querySelectorAll('input[type="text"], input[type="url"], textarea').forEach((field) => {
    if (!field.disabled && !String(field.value || '').trim()) {
      field.disabled = true;
      temporarilyDisabled.push(field);
    }
  });
  setTimeout(() => temporarilyDisabled.forEach((field) => { field.disabled = false; }), 0);
  return true;
}

if (typeof window !== 'undefined') {
  window.ClutchTrackedPrintValidation = { validateTrackedPrintProductForm, syncTrackedPrintControls };

  const syncAll = () => {
    document.querySelectorAll(TRACKED_PRINT_CONTROLS_SELECTOR).forEach(syncTrackedPrintControls);
  };
  document.addEventListener('change', (event) => {
    const controls = event.target?.closest?.(TRACKED_PRINT_CONTROLS_SELECTOR);
    if (controls) syncTrackedPrintControls(controls);
  });
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (form?.querySelector?.(TRACKED_PRINT_CONTROLS_SELECTOR)) {
      validateTrackedPrintProductForm(form, event);
    }
  }, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncAll, { once: true });
  else syncAll();
}
