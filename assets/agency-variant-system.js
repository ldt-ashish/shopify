import { ThemeEvents } from '@theme/events';

function formatMoney(cents) {
  if (typeof cents !== 'number') return '';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(cents / 100);
}

function updatePrice(root, variant) {
  const priceNode = root.querySelector('[data-agency-variant-price]');
  const compareNode = root.querySelector('[data-agency-variant-compare]');
  if (priceNode) priceNode.textContent = formatMoney(variant.price);

  if (!compareNode) return;
  const hasCompare = typeof variant.compare_at_price === 'number' && variant.compare_at_price > variant.price;
  compareNode.hidden = !hasCompare;
  compareNode.textContent = hasCompare ? formatMoney(variant.compare_at_price) : '';
}

function updateSku(root, variant) {
  const skuNode = root.querySelector('[data-agency-variant-sku]');
  if (!skuNode) return;

  const sku = typeof variant.sku === 'string' ? variant.sku : '';
  skuNode.textContent = sku;
  skuNode.hidden = !sku;
}

function updateImage(root, variant) {
  const image = root.querySelector('img[data-agency-variant-image]');
  if (!(image instanceof HTMLImageElement)) return;
  const src = variant?.featured_media?.preview_image?.src;
  if (!src) return;
  image.src = src;
  if (variant?.featured_media?.alt) image.alt = variant.featured_media.alt;
}

function updateAvailability(root, variant) {
  root.querySelectorAll('button[name="add"], button[type="submit"][name="add"]').forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;
    button.disabled = !variant.available;
    button.setAttribute('aria-disabled', variant.available ? 'false' : 'true');
  });
}

function updateLowInventory(root, variant) {
  const lowInventoryNode = root.querySelector('[data-agency-low-stock]');
  if (!(lowInventoryNode instanceof HTMLElement)) return;

  const threshold = Number(lowInventoryNode.dataset.threshold || 5);
  const quantity = Number(variant.inventory_quantity || 0);
  const isManaged = variant.inventory_management === 'shopify';
  const deniesOversell = variant.inventory_policy === 'deny';

  const lowMessageTemplate = lowInventoryNode.dataset.lowMessage || 'Only [count] left in stock';
  const inStockMessage = lowInventoryNode.dataset.inStockMessage || 'In stock';
  const outOfStockMessage = lowInventoryNode.dataset.outOfStockMessage || 'Out of stock';

  if (!variant.available) {
    lowInventoryNode.dataset.stockState = 'out';
    lowInventoryNode.textContent = outOfStockMessage;
    return;
  }

  const isLow = isManaged && deniesOversell && quantity > 0 && quantity <= threshold;
  if (isLow) {
    lowInventoryNode.dataset.stockState = 'low';
    lowInventoryNode.textContent = lowMessageTemplate.replace('[count]', `${quantity}`);
    return;
  }

  lowInventoryNode.dataset.stockState = 'in';
  lowInventoryNode.textContent = inStockMessage;
}

function formatDeliveryDate(businessDays) {
  const date = new Date();
  let added = 0;

  while (added < businessDays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }

  return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}

function updateDeliveryEstimate(root, variant) {
  const estimateNode = root.querySelector('[data-agency-delivery-estimate]');
  if (!(estimateNode instanceof HTMLElement)) return;

  const minDays = Number(estimateNode.dataset.minDays || 2);
  const maxDays = Math.max(minDays, Number(estimateNode.dataset.maxDays || minDays));
  const unavailableText = estimateNode.dataset.unavailableText || '';
  const prefix = estimateNode.dataset.prefix || 'Estimated delivery:';

  if (!variant.available) {
    estimateNode.hidden = unavailableText.length === 0;
    estimateNode.textContent = unavailableText;
    return;
  }

  const minDate = formatDeliveryDate(minDays);
  const maxDate = formatDeliveryDate(maxDays);
  estimateNode.hidden = false;
  estimateNode.textContent = `${prefix} ${minDate}${maxDate !== minDate ? ` - ${maxDate}` : ''}`;
}

export function initAgencyVariantSystem() {
  document.addEventListener(ThemeEvents.variantUpdate, (event) => {
    const root = event.target instanceof HTMLElement ? event.target.closest('.shopify-section, dialog, product-card') : null;
    const variant = event?.detail?.resource;
    if (!root || !variant) return;

    updatePrice(root, variant);
    updateSku(root, variant);
    updateImage(root, variant);
    updateAvailability(root, variant);
    updateLowInventory(root, variant);
    updateDeliveryEstimate(root, variant);
  });
}
