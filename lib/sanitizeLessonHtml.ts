/**
 * Pure TypeScript HTML Sanitizer & Placeholder Detector.
 * Safe for Client Components, Server Components, and API routes.
 * Contains ZERO Node.js native dependencies (no jsdom, no fs, no child_process).
 */

const PLACEHOLDER_PHRASES = [
  'add your content here...',
  'add your content here',
  'start writing your lesson content...',
  'start writing your lesson content',
  'write something...',
  'write something',
];

/**
 * Strips HTML tags and HTML entities to retrieve plain text.
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Returns true if the HTML is empty, contains only empty tags (<p></p>), or matches placeholder text.
 */
export function isEmptyLessonHtml(html: string | null | undefined): boolean {
  const text = stripHtml(html).toLowerCase();
  if (!text) return true;
  if (PLACEHOLDER_PHRASES.includes(text)) return true;
  return false;
}

/**
 * Returns clean HTML string or null if empty/placeholder.
 */
export function sanitizeLessonTextContent(
  html: string | null | undefined
): string | null {
  if (html === null || html === undefined) return null;
  if (isEmptyLessonHtml(html)) return null;
  return String(html).trim();
}