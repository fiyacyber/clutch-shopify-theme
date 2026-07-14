const TRACKED_PRINT_CONTROLS_SELECTOR = '[data-tracked-print-controls]';

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

  controls.sync?.();

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
  window.ClutchTrackedPrintValidation = { validateTrackedPrintProductForm };
}
