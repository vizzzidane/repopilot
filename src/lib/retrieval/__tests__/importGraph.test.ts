import { describe, expect, it } from "vitest";
import { buildImportGraph } from "../importGraph";

describe("importGraph", () => {
  it("extracts relative internal imports", () => {
    const graph = buildImportGraph([
      {
        path: "src/app/page.tsx",
        content: `import { Button } from "../components/Button";`,
      },
      {
        path: "src/components/Button.tsx",
        content: `export function Button() { return null; }`,
      },
    ]);

    expect(graph.edges).toContainEqual({
      from: "src/app/page.tsx",
      to: "src/components/Button",
      importPath: "../components/Button",
      kind: "internal",
    });
  });

  it("extracts alias internal imports", () => {
    const graph = buildImportGraph([
      {
        path: "src/app/page.tsx",
        content: `import { cn } from "@/lib/utils";`,
      },
      {
        path: "src/lib/utils.ts",
        content: `export function cn() { return ""; }`,
      },
    ]);

    expect(graph.edges).toContainEqual({
      from: "src/app/page.tsx",
      to: "src/lib/utils",
      importPath: "@/lib/utils",
      kind: "internal",
    });
  });

  it("extracts external package imports", () => {
    const graph = buildImportGraph([
      {
        path: "src/app/page.tsx",
        content: `
import React from "react";
import { NextRequest } from "next/server";
import { z } from "zod";
`,
      },
    ]);

    expect(graph.externalPackages).toEqual(["next", "react", "zod"]);
    expect(graph.edges).toContainEqual({
      from: "src/app/page.tsx",
      to: "react",
      importPath: "react",
      kind: "external",
    });
  });

  it("deduplicates repeated imports from the same file", () => {
    const graph = buildImportGraph([
      {
        path: "src/app/page.tsx",
        content: `
import React from "react";
import type ReactType from "react";
const lazy = require("react");
`,
      },
    ]);

    expect(graph.externalPackages).toEqual(["react"]);
    expect(graph.edges.filter((edge) => edge.importPath === "react")).toHaveLength(
      1,
    );
  });

  it("extracts re-export, require, and dynamic import statements", () => {
    const graph = buildImportGraph([
      {
        path: "src/index.ts",
        content: `
export { helper } from "./helper";
const fs = require("fs");
const mod = import("next/navigation");
`,
      },
      {
        path: "src/helper.ts",
        content: `export const helper = true;`,
      },
    ]);

    expect(graph.edges).toContainEqual({
      from: "src/index.ts",
      to: "src/helper",
      importPath: "./helper",
      kind: "internal",
    });

    expect(graph.externalPackages).toEqual(["fs", "next"]);
  });

  it("detects common entrypoints", () => {
    const graph = buildImportGraph([
      {
        path: "src/app/page.tsx",
        content: "",
      },
      {
        path: "src/app/api/chat/route.ts",
        content: "",
      },
      {
        path: "src/lib/utils.ts",
        content: "",
      },
    ]);

    expect(graph.entrypoints).toEqual([
      "src/app/page.tsx",
      "src/app/api/chat/route.ts",
    ]);
  });

  it("normalizes Windows path separators", () => {
    const graph = buildImportGraph([
      {
        path: "src\\app\\page.tsx",
        content: `import { helper } from "..\\lib\\helper";`,
      },
      {
        path: "src\\lib\\helper.ts",
        content: `export const helper = true;`,
      },
    ]);

    expect(graph.nodes).toContainEqual({
      id: "src/app/page.tsx",
      path: "src/app/page.tsx",
    });

    expect(graph.edges[0]).toMatchObject({
      from: "src/app/page.tsx",
      kind: "internal",
    });
  });

  it("returns an empty graph for no files", () => {
    expect(buildImportGraph([])).toEqual({
      nodes: [],
      edges: [],
      entrypoints: [],
      externalPackages: [],
    });
  });
});