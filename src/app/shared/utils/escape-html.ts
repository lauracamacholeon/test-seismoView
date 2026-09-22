const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapes text before it is interpolated into an HTML string (e.g. a
 * MapLibre popup's setHTML). The place names here come from the USGS feed,
 * an external source: escaping keeps a place name from ever being
 * interpreted as markup, however unlikely that source is to send any.
 */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => ESCAPES[character] ?? character);
}
