import { escapeHtml } from "./escape-html";

export function renderValue(value: unknown): string {
  return escapeHtml(value);
}
