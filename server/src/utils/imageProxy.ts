/**
 * Helper utility to proxy external product images to bypass CDN hotlinking protection.
 */
export function proxyImageUrl(url: string | null | undefined): string | null | undefined {
  if (!url) return url;
  
  // If it's already a local URL or a data URL, return as is
  if (url.startsWith('/') || url.startsWith('data:') || url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
    return url;
  }
  
  // Check if it's an external URL (http or https)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Return the proxy endpoint URL with the original URL encoded as a query param
    return `/api/products/image-proxy?url=${encodeURIComponent(url)}`;
  }
  
  return url;
}
