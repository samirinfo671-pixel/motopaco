/**
 * Formats a numeric price into Moroccan Dirhams (DH) format.
 * E.g., 5200 => "5 200,00 DH"
 */
export function formatPrice(price: number): string {
  const formattedValue = new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
  
  return `${formattedValue} MAD`;
}

/**
 * Formats a standard DD/MM/YYYY date
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-MA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    return dateString;
  }
}
/**
 * Decodes HTML entities from a string (e.g. &amp; → &, &lt; → <).
 * Useful for strings stored in the DB that were imported from WooCommerce/WordPress.
 */
export function decodeHtml(str: string): string {
  if (!str) return str;
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}
