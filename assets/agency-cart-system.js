import { CartUpdateEvent, CartErrorEvent, ThemeEvents } from '@theme/events';
import { addToCart, changeCartLine, fetchCart } from './agency-cart-api.js';

const LIVE_REGION_ID = 'agency-cart-live-region';
const DEFAULT_ERROR = 'Something went wrong while updating your cart.';

function ensureLiveRegion() {
  let region = document.getElementById(LIVE_REGION_ID);
  if (region) return region;

  region = document.createElement('div');
  region.id = LIVE_REGION_ID;
  region.className = 'visually-hidden';
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  document.body.appendChild(region);
  return region;
}

function announce(message) {
  const liveRegion = ensureLiveRegion();
  liveRegion.textContent = '';
  window.requestAnimationFrame(() => {
    liveRegion.textContent = message;
  });
}

function setLoadingState(button, loading) {
  if (!(button instanceof HTMLButtonElement)) return;
  button.classList.toggle('is-loading', loading);
  button.setAttribute('aria-busy', loading ? 'true' : 'false');
  button.disabled = loading;
}

function showSuccessState(button) {
  if (!(button instanceof HTMLButtonElement)) return;
  button.classList.add('is-success');
  window.setTimeout(() => {
    button.classList.remove('is-success');
  }, 900);
}

function getSectionIds() {
  const ids = new Set();
  document.querySelectorAll('[data-section-id]').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (node.dataset.sectionId) ids.add(node.dataset.sectionId);
  });
  return Array.from(ids);
}

function updateCartBubble(itemCount) {
  document.querySelectorAll('[ref="cartBubbleCount"], [data-testid="cart-bubble"]').forEach((node) => {
    node.textContent = `${itemCount}`;
    node.classList.toggle('hidden', itemCount === 0);
  });

  document.querySelectorAll('[ref="cartBubble"]').forEach((node) => {
    node.classList.toggle('visually-hidden', itemCount === 0);
  });
}

function getErrorMessage(error) {
  if (!error) return DEFAULT_ERROR;
  if (typeof error.description === 'string' && error.description.length) return error.description;
  if (typeof error.message === 'string' && error.message.length) return error.message;
  if (typeof error.errors === 'string' && error.errors.length) return error.errors;
  return DEFAULT_ERROR;
}

function emitCartUpdate(cart, sections) {
  const event = new CartUpdateEvent(cart, 'agency-cart-system', {
    source: 'agency-cart-system',
    itemCount: cart.item_count ?? 0,
    sections,
  });
  document.dispatchEvent(event);
}

function emitCartError(message, error) {
  document.dispatchEvent(new CartErrorEvent('agency-cart-system', message, error?.description, error?.errors));
}

async function handleAjaxAddToCart(form) {
  const variantIdInput = form.querySelector('input[name="id"]');
  if (!(variantIdInput instanceof HTMLInputElement)) return;

  const quantityInput = form.querySelector('input[name="quantity"]');
  const quantity = quantityInput instanceof HTMLInputElement ? Number(quantityInput.value || 1) : 1;
  const submitButton = form.querySelector('button[type="submit"], button[name="add"]');
  const sections = getSectionIds();

  try {
    setLoadingState(submitButton, true);
    await addToCart({
      items: [{ id: Number(variantIdInput.value), quantity }],
      sections,
    });
    const cart = await fetchCart();
    updateCartBubble(cart.item_count ?? 0);
    emitCartUpdate(cart, undefined);
    showSuccessState(submitButton);
    announce('Item added to cart.');
  } catch (error) {
    const message = getErrorMessage(error);
    emitCartError(message, error);
    announce(message);
  } finally {
    setLoadingState(submitButton, false);
  }
}

async function handleCartLineChange(button) {
  if (!(button instanceof HTMLElement)) return;

  const line = Number(button.dataset.agencyCartLine);
  const action = button.dataset.agencyCartAction;
  if (!line || !action) return;

  const input = document.querySelector(`[data-agency-cart-input="${line}"]`);
  const currentQuantity = input instanceof HTMLInputElement ? Number(input.value || 1) : 1;
  const quantity = action === 'decrement' ? Math.max(currentQuantity - 1, 0) : currentQuantity + 1;
  const sections = getSectionIds();

  try {
    const cart = await changeCartLine({ line, quantity, sections });
    updateCartBubble(cart.item_count ?? 0);
    emitCartUpdate(cart, cart.sections);
    announce('Cart updated.');
  } catch (error) {
    const message = getErrorMessage(error);
    emitCartError(message, error);
    announce(message);
  }
}

async function handleCartLineRemove(button) {
  if (!(button instanceof HTMLElement)) return;
  const line = Number(button.dataset.agencyCartRemove);
  if (!line) return;

  try {
    const cart = await changeCartLine({ line, quantity: 0, sections: getSectionIds() });
    updateCartBubble(cart.item_count ?? 0);
    emitCartUpdate(cart, cart.sections);
    announce('Item removed from cart.');
  } catch (error) {
    const message = getErrorMessage(error);
    emitCartError(message, error);
    announce(message);
  }
}

export function initAgencyCartSystem() {
  ensureLiveRegion();

  document.addEventListener(
    'submit',
    (event) => {
      const form = event.target instanceof Element ? event.target.closest('form[data-agency-ajax-atc]') : null;
      if (!(form instanceof HTMLFormElement)) return;
      event.preventDefault();
      handleAjaxAddToCart(form);
    },
    true
  );

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const removeButton = target.closest('[data-agency-cart-remove]');
    if (removeButton) {
      event.preventDefault();
      handleCartLineRemove(removeButton);
      return;
    }

    const actionButton = target.closest('[data-agency-cart-line][data-agency-cart-action]');
    if (actionButton) {
      event.preventDefault();
      handleCartLineChange(actionButton);
    }
  });

  document.addEventListener(ThemeEvents.cartUpdate, (event) => {
    const itemCount = event?.detail?.data?.itemCount;
    if (typeof itemCount === 'number') {
      updateCartBubble(itemCount);
    }
  });
}
