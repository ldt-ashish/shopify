import { ThemeEvents } from '@theme/events';

function formatMoney(cents) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(cents / 100);
}

function updateFreeShippingUI(cart) {
  document.querySelectorAll('[data-agency-free-shipping]').forEach((container) => {
    if (!(container instanceof HTMLElement)) return;
    const threshold = Number(container.dataset.threshold || 5000);
    const subtotal = Number(cart?.total_price || 0);
    const remaining = Math.max(threshold - subtotal, 0);
    const progress = Math.min(Math.round((subtotal / threshold) * 100), 100);

    const text = container.querySelector('[data-agency-free-shipping-text]');
    const bar = container.querySelector('[data-agency-free-shipping-bar]');
    const track = container.querySelector('[data-agency-free-shipping-track]');

    if (text) {
      text.textContent =
        remaining > 0
          ? `Spend ${formatMoney(remaining)} more to unlock free shipping`
          : 'You unlocked free shipping';
    }

    if (bar instanceof HTMLElement) {
      bar.style.setProperty('--free-shipping-progress', `${progress}%`);
    }

    if (track instanceof HTMLElement) {
      track.setAttribute('aria-valuenow', `${progress}`);
    }
  });
}

function injectTrustBadges() {
  const productButtons = document.querySelector('.product-form-buttons');
  if (!productButtons) return;
  if (document.querySelector('[data-agency-trust-badges]')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'agency-trust-badges';
  wrapper.dataset.agencyTrustBadges = 'true';
  wrapper.innerHTML = `
    <ul class="agency-trust-badges__list" role="list" aria-label="Store trust badges">
      <li class="agency-trust-badges__item">Secure checkout</li>
      <li class="agency-trust-badges__item">Fast dispatch</li>
      <li class="agency-trust-badges__item">Easy returns</li>
    </ul>
  `;

  productButtons.insertAdjacentElement('beforeend', wrapper);
}

function initFaqAccordionDelegation() {
  document.addEventListener('click', (event) => {
    const trigger = event.target instanceof Element ? event.target.closest('[data-agency-faq-trigger]') : null;
    if (!(trigger instanceof HTMLElement)) return;

    const item = trigger.closest('[data-agency-faq-item]');
    const panel = item?.querySelector('[data-agency-faq-panel]');
    if (!(panel instanceof HTMLElement)) return;

    const expanded = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    panel.hidden = expanded;
  });
}

export function initAgencyUiEnhancements() {
  injectTrustBadges();
  initFaqAccordionDelegation();

  document.addEventListener(ThemeEvents.cartUpdate, (event) => {
    updateFreeShippingUI(event?.detail?.resource);
  });
}
