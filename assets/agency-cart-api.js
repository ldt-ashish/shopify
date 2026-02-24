const JSON_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

async function parseResponse(response) {
  const data = await response.json();
  if (!response.ok || data?.status >= 400) {
    throw data;
  }
  return data;
}

export async function addToCart({ items, sections = [], sectionsUrl = window.location.pathname }) {
  const response = await fetch('/cart/add.js', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      items,
      sections: sections.join(','),
      sections_url: sectionsUrl,
    }),
  });

  return parseResponse(response);
}

export async function changeCartLine({ line, quantity, sections = [], sectionsUrl = window.location.pathname }) {
  const response = await fetch('/cart/change.js', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      line,
      quantity,
      sections: sections.join(','),
      sections_url: sectionsUrl,
    }),
  });

  return parseResponse(response);
}

export async function fetchCart() {
  const response = await fetch('/cart.js', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  return parseResponse(response);
}
