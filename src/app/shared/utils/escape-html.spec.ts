import { escapeHtml } from './escape-html';

describe('escapeHtml', () => {
  it('should leave plain text unchanged', () => {
    expect(escapeHtml('10 km NW of Somewhere, Chile')).toBe('10 km NW of Somewhere, Chile');
  });

  it('should escape the five HTML-significant characters', () => {
    expect(escapeHtml(`<script>&"'>`)).toBe('&lt;script&gt;&amp;&quot;&#39;&gt;');
  });
});
