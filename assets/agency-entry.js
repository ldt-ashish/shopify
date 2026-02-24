import { initAgencyCartSystem } from './agency-cart-system.js';
import { initAgencyVariantSystem } from './agency-variant-system.js';
import { initAgencyUiEnhancements } from './agency-ui-enhancements.js';
import { initAgencyPerformance } from './agency-performance.js';

function init() {
  initAgencyCartSystem();
  initAgencyVariantSystem();
  initAgencyUiEnhancements();
  initAgencyPerformance();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
