const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const REVEAL_READY_CLASS = 'reveal-ready';
const REVEAL_VISIBLE_CLASS = 'reveal-visible';
const REVEAL_BOUND_FLAG = 'revealBound';

const singleRevealSelectors = [
  '.chp-hero__copy > *:not(.chp-badge)',
  '.chp-platform__copy',
  '.chp-smart-cards__copy',
  '.chp-smart-cards__visual',
  '.chp-final__inner',
  '.clutch-shop-hero__copy',
  '.clutch-shop-hero__panel',
  '.clutch-product-clarity__heading',
  '.cbk-product__hero',
  '.cbk-product__dashboard',
  '.cbk-product__faq',
  '.cc-product__hero',
  '.cc-product__material',
  '.clutch-print-options',
  '.clutch-addon-callout',
  '.clutch-info-panel',
  '.clutch-option-card',
  '.smart-card-page__copy',
  '.smart-card-page__visual',
  '.smart-card-page__split',
  '.smart-card-page__after',
  '.smart-card-page__faq',
  '.clutch-cta',
  'section[class*="analytics"]',
  'div[class*="analytics"]',
  'article[class*="analytics"]',
  '[class*="heatmap"]',
  '.chp-actions',
  '.chp-plan-ladder__actions',
  '.smart-card-page__actions'
];

const staggerGroups = [
  { container: '.chp-step-grid', item: '.chp-card' },
  { container: '.chp-feature-grid', item: '.chp-card' },
  { container: '.clutch-shop-hero__panel', item: 'article' },
  { container: '.chp-kit-grid', item: '.chp-card' },
  { container: '.chp-compare-grid', item: '.chp-card' },
  { container: '.chp-plan-grid', item: '.chp-card' },
  { container: '.chp-product-grid', item: '.chp-card' },
  { container: '.clutch-product-clarity__grid', item: '.clutch-product-clarity__card' },
  { container: '.cc-product__specs', item: 'article' },
  { container: '.cc-product__finishes', item: 'article' },
  { container: '.smart-card-page__steps', item: 'article' },
  { container: '.smart-card-page__spec-grid', item: 'article' },
  { container: '.smart-card-page__finish-grid', item: 'article' },
  { container: '.smart-card-page__timeline', item: 'article' },
  { container: '.cbk-product__rows', item: 'div' }
];

let observer = null;

function revealElement(element) {
  element.classList.add(REVEAL_VISIBLE_CLASS);
}

function shouldSkipElement(element) {
  return Boolean(element.closest('#header-group, footer, .announcement-bar, .clutch-shipping-banner'));
}

function isNearViewport(element) {
  const rect = element.getBoundingClientRect();
  return rect.top <= window.innerHeight * 0.95;
}

function bindRevealElement(element, delayMs = 0, distancePx = 20) {
  if (!(element instanceof HTMLElement) || shouldSkipElement(element)) return;
  if (element.dataset[REVEAL_BOUND_FLAG] === 'true') return;

  element.dataset[REVEAL_BOUND_FLAG] = 'true';
  element.style.setProperty('--reveal-delay', `${delayMs}ms`);
  element.style.setProperty('--reveal-distance', `${distancePx}px`);
  element.classList.add(REVEAL_READY_CLASS);

  if (!observer || isNearViewport(element)) {
    revealElement(element);
    return;
  }

  observer.observe(element);
}

function collectSingleRevealTargets(root) {
  for (const selector of singleRevealSelectors) {
    root.querySelectorAll(selector).forEach((element) => bindRevealElement(element, 0, 18));
  }
}

function collectStaggerRevealTargets(root) {
  for (const group of staggerGroups) {
    root.querySelectorAll(group.container).forEach((container) => {
      const children = container.querySelectorAll(group.item);
      children.forEach((element, index) => {
        const delay = Math.min(index, 6) * 70;
        bindRevealElement(element, delay, 20);
      });
    });
  }
}

function collectRevealTargets(root = document) {
  if (prefersReducedMotion.matches) return;
  collectSingleRevealTargets(root);
  collectStaggerRevealTargets(root);
}

function setupObserver() {
  if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) return;

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        revealElement(element);
        observer.unobserve(element);
      });
    },
    {
      root: null,
      threshold: 0.14,
      rootMargin: '0px 0px -8% 0px'
    }
  );
}

function setupMutationObserver() {
  const root = document.querySelector('#MainContent');
  if (!root) return;

  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        collectRevealTargets(node);
      });
    });
  });

  mutationObserver.observe(root, { childList: true, subtree: true });
}

function initScrollReveal() {
  setupObserver();
  collectRevealTargets(document);
  setupMutationObserver();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollReveal, { once: true });
} else {
  initScrollReveal();
}

document.addEventListener('shopify:section:load', (event) => {
  if (!(event.target instanceof HTMLElement)) return;
  collectRevealTargets(event.target);
});
