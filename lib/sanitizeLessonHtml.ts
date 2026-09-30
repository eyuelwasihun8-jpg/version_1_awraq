const PLACEHOLDER_PHRASES = [
  'add your content here...',
  'add your content here',
  'start writing your lesson content...',
  'start writing your lesson content',
  'write something...',
  'write something',
];

export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isEmptyLessonHtml(html: string | null | undefined): boolean {
  const text = stripHtml(html).toLowerCase();
  if (!text) return true;
  if (PLACEHOLDER_PHRASES.includes(text)) return true;
  return false;
}

/** Returns clean HTML or null if empty/placeholder */
export function sanitizeLessonTextContent(
  html: string | null | undefined
): string | null {
  if (html === null || html === undefined) return null;
  if (isEmptyLessonHtml(html)) return null;
  return String(html);
}