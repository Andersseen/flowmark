const HTML_ESCAPE_REPLACEMENTS: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const HTML_ESCAPE_PATTERN = /[&<>"']/g;

export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined || value === false) {
    return "";
  }

  return String(value).replace(
    HTML_ESCAPE_PATTERN,
    (character) => HTML_ESCAPE_REPLACEMENTS[character],
  );
}
