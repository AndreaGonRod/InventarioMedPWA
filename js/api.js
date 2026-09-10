async function lookupBarcode(barcode) {
  const cleanCode = barcode.trim();
  if (!cleanCode) return null;

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanCode)}.json`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;

    const product = data.product;

    return {
      name: product.product_name || product.product_name_es || '',
      activeIngredient: extractActiveIngredient(product),
      presentation: extractPresentation(product),
      category: extractCategory(product),
      barcode: cleanCode
    };
  } catch {
    return null;
  }
}

function extractActiveIngredient(product) {
  if (product.ingredients_text_es) return product.ingredients_text_es;
  if (product.ingredients_text) return product.ingredients_text;
  return '';
}

function extractPresentation(product) {
  if (product.quantity) return product.quantity;
  if (product.packaging) return product.packaging;
  return '';
}

function extractCategory(product) {
  if (product.categories_tags && product.categories_tags.length > 0) {
    const tag = product.categories_tags[product.categories_tags.length - 1];
    return tag.replace(/^[a-z]{2}:/, '').replace(/-/g, ' ');
  }
  if (product.categories) {
    const parts = product.categories.split(',');
    return parts[parts.length - 1].trim();
  }
  return '';
}
