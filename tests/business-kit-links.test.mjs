import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('Business Kit collection cards use product objects and canonical fallbacks', () => {
  const section = read('sections/clutch-business-kits-collection.liquid');

  assert.match(section, /assign starter_url = starter_product\.url \| default: '\/products\/starter-business-kit'/);
  assert.match(section, /assign growth_url = growth_product\.url \| default: '\/products\/growth-business-kit'/);
  assert.match(section, /clutch-kit-card__title-link" href="{{ starter_url }}"/);
  assert.match(section, /clutch-kit-card__price-link" href="{{ starter_url }}"/);
  assert.match(section, /View Starter Kit[\s\S]*href="{{ growth_url }}"/);
  assert.match(section, /clutch-kit-card__title-link" href="{{ growth_url }}"/);
  assert.match(section, /clutch-kit-card__price-link" href="{{ growth_url }}"/);
  assert.match(section, /Request a Custom Kit[\s\S]*href="\/pages\/contact"|href="\/pages\/contact"[\s\S]*Request a Custom Kit/);
  assert.doesNotMatch(section, /starter_url\s*=\s*['"]\/collections\/business-kits/);
  assert.doesNotMatch(section, /growth_url\s*=\s*['"]\/collections\/business-kits/);
});

test('Business Kit cards preserve semantic links and selectable contents', () => {
  const section = read('sections/clutch-business-kits-collection.liquid');
  let anchorDepth = 0;

  assert.match(section, /\.clutch-kit-card__title-link::after/);
  assert.match(section, /\.clutch-kit-card__contains\s*{[\s\S]*z-index: 2/);
  assert.match(section, /\.clutch-kit-card__title-link:focus-visible/);
  for (const tag of section.matchAll(/<\/?a\b[^>]*>/g)) {
    anchorDepth += tag[0].startsWith('</') ? -1 : 1;
    assert.ok(anchorDepth <= 1, 'anchor elements must not be nested');
  }
  assert.equal(anchorDepth, 0, 'all anchor elements must close');
});

test('Homepage kit cards use canonical products while the section CTA stays general', () => {
  const section = read('sections/clutch-homepage-v2.liquid');

  assert.match(section, /all_products\['starter-business-kit'\]/);
  assert.match(section, /all_products\['growth-business-kit'\]/);
  assert.match(section, /kit_key == 'starter'[\s\S]*'\/products\/starter-business-kit'/);
  assert.match(section, /kit_key == 'growth'[\s\S]*'\/products\/growth-business-kit'/);
  assert.match(section, /kit_key == 'custom'[\s\S]*assign kit_url = custom_order_url/);
  assert.match(section, /View Business Kits[\s\S]*routes\.collections_url/);
});

test('Shop-page Business Kit cards use canonical product objects and contact for custom work', () => {
  const section = read('sections/clutch-shop-page.liquid');

  assert.match(section, /all_products\['starter-business-kit'\]/);
  assert.match(section, /all_products\['growth-business-kit'\]/);
  assert.match(section, /href="\/products\/starter-business-kit">View Starter Kit/);
  assert.match(section, /href="\/products\/growth-business-kit">View Growth Kit/);
  assert.match(section, /href="{{ custom_order_url }}">Request a Custom Kit/);
  assert.doesNotMatch(section, /href="{{ routes\.collections_url }}\/business-kits">View (Starter|Growth) Kit/);
});
