export type ImportGraphFile = {
  path: string;
  content: string;
};

export type ImportGraphNode = {
  id: string;
  path: string;
};

export type ImportGraphEdge = {
  from: string;
  to: string;
  importPath: string;
  kind: "internal" | "external";
};

export type ImportGraph = {
  nodes: ImportGraphNode[];
  edges: ImportGraphEdge[];
  entrypoints: string[];
  externalPackages: string[];
};

const ENTRYPOINT_PATTERNS = [
  /(^|\/)app\/page\.(tsx|ts|jsx|js)$/i,
  /(^|\/)app\/layout\.(tsx|ts|jsx|js)$/i,
  /(^|\/)app\/api\/.*\/route\.(tsx|ts|jsx|js)$/i,
  /(^|\/)pages\/index\.(tsx|ts|jsx|js)$/i,
  /(^|\/)pages\/api\/.*\.(tsx|ts|jsx|js)$/i,
  /(^|\/)src\/main\.(tsx|ts|jsx|js)$/i,
  /(^|\/)src\/index\.(tsx|ts|jsx|js)$/i,
];

const IMPORT_PATTERNS = [
  /import\s+(?:type\s+)?(?:[^"'`]+?\s+from\s+)?["']([^"']+)["']/g,
  /export\s+(?:type\s+)?[^"'`]+?\s+from\s+["']([^"']+)["']/g,
  /require\(\s*["']([^"']+)["']\s*\)/g,
  /import\(\s*["']([^"']+)["']\s*\)/g,
];

function normalizePath(path: string) {
  return path.replaceAll("\\", "/").replace(/^\.?\//, "");
}

function getDirectory(path: string) {
  const normalized = normalizePath(path);
  const lastSlashIndex = normalized.lastIndexOf("/");

  if (lastSlashIndex === -1) {
    return "";
  }

  return normalized.slice(0, lastSlashIndex);
}

function isRelativeImport(importPath: string) {
  return importPath.startsWith("./") || importPath.startsWith("../");
}

function isAliasImport(importPath: string) {
  return importPath.startsWith("@/");
}

function getExternalPackageName(importPath: string) {
  if (importPath.startsWith("@")) {
    const [scope, name] = importPath.split("/");
    return name ? `${scope}/${name}` : importPath;
  }

  return importPath.split("/")[0];
}

function stripKnownExtension(path: string) {
  return path.replace(/\.(tsx|ts|jsx|js|json|css|scss|mdx|md)$/i, "");
}

function resolveInternalImport(
  fromFile: string,
  importPath: string,
  knownPaths: Set<string>,
) {
  const normalizedFromFile = normalizePath(fromFile);
  const normalizedImport = normalizePath(importPath);

  const basePath = isAliasImport(normalizedImport)
    ? normalizePath(normalizedImport.replace(/^@\//, "src/"))
    : normalizePath(`${getDirectory(normalizedFromFile)}/${normalizedImport}`);

  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}.json`,
    `${basePath}/index.ts`,
    `${basePath}/index.tsx`,
    `${basePath}/index.js`,
    `${basePath}/index.jsx`,
  ].map(normalizePath);

  return candidates.find((candidate) => knownPaths.has(candidate)) ?? basePath;
}

function extractImports(content: string) {
  const imports = new Set<string>();

  for (const pattern of IMPORT_PATTERNS) {
    pattern.lastIndex = 0;

    for (const match of content.matchAll(pattern)) {
      const importPath = match[1]?.trim();

      if (importPath) {
        imports.add(importPath);
      }
    }
  }

  return [...imports];
}

function isEntrypoint(path: string) {
  return ENTRYPOINT_PATTERNS.some((pattern) => pattern.test(path));
}

export function buildImportGraph(files: ImportGraphFile[]): ImportGraph {
  const normalizedFiles = files.map((file) => ({
    path: normalizePath(file.path),
    content: file.content,
  }));

  const knownPaths = new Set(normalizedFiles.map((file) => file.path));
  const externalPackages = new Set<string>();

  const nodes: ImportGraphNode[] = normalizedFiles.map((file) => ({
    id: file.path,
    path: file.path,
  }));

  const edges: ImportGraphEdge[] = [];

  for (const file of normalizedFiles) {
    const imports = extractImports(file.content);

    for (const importPath of imports) {
      if (isRelativeImport(importPath) || isAliasImport(importPath)) {
        edges.push({
          from: file.path,
          to: stripKnownExtension(
            resolveInternalImport(file.path, importPath, knownPaths),
          ),
          importPath,
          kind: "internal",
        });

        continue;
      }

      const packageName = getExternalPackageName(importPath);
      externalPackages.add(packageName);

      edges.push({
        from: file.path,
        to: packageName,
        importPath,
        kind: "external",
      });
    }
  }

  return {
    nodes,
    edges,
    entrypoints: normalizedFiles
      .map((file) => file.path)
      .filter((path) => isEntrypoint(path)),
    externalPackages: [...externalPackages].sort(),
  };
}