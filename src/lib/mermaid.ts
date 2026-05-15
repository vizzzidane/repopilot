const MAX_MERMAID_CHARS = 1500;
const MAX_MERMAID_LINES = 40;

const DISALLOWED_MERMAID_PATTERNS = [
  /<script/i,
  /<\/script/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /<svg/i,
  /<img/i,
  /<html/i,
  /<\/?[a-z][\s\S]*>/i,
];

export function sanitizeMermaidDiagram(input: unknown) {
  if (typeof input !== "string") {
    return "";
  }

  const diagram = input.trim();

  if (!diagram) {
    return "";
  }

  if (diagram.length > MAX_MERMAID_CHARS) {
    return "";
  }

  const lines = diagram.split(/\r?\n/);

  if (lines.length > MAX_MERMAID_LINES) {
    return "";
  }

  if (!diagram.startsWith("graph TD")) {
    return "";
  }

  if (DISALLOWED_MERMAID_PATTERNS.some((pattern) => pattern.test(diagram))) {
    return "";
  }

  return diagram;
}