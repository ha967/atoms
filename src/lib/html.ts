export function extractHtml(raw: string): string | null {
  if (!raw) {
    return null;
  }

  let text = raw.trim();

  text = text.replace(/^```(?:html|HTML)?\s*/i, '');
  text = text.replace(/```\s*$/i, '').trim();

  const doctypeIndex = text.toLowerCase().indexOf('<!doctype');

  if (doctypeIndex >= 0) {
    text = text.slice(doctypeIndex);
  } else {
    const htmlIndex = text.toLowerCase().indexOf('<html');

    if (htmlIndex >= 0) {
      text = text.slice(htmlIndex);
    }
  }

  const closingIndex = text.toLowerCase().lastIndexOf('</html>');

  if (closingIndex >= 0) {
    text = text.slice(0, closingIndex + '</html>'.length);
  }

  if (!/<html[\s>]/i.test(text) || !/<body[\s>]/i.test(text)) {
    return null;
  }

  if (text.length < 200) {
    return null;
  }

  return text;
}

export function looksInteractive(html: string): boolean {
  return /<(button|input|select|textarea|form)[\s>]/i.test(html) || /onclick|addEventListener/i.test(html);
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function deriveTitle(prompt: string): string {
  const normalized = prompt.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return '未命名应用';
  }

  const firstSentence = normalized.split(/[。！？.!?\n]/)[0]?.trim() || normalized;
  return firstSentence.length > 24 ? `${firstSentence.slice(0, 24)}…` : firstSentence;
}
