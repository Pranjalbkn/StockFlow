import { describe, expect, it } from "vitest";
import { findUniqueCatalogMatch, normalizeCatalogName } from "./matchCatalogName.js";

describe("catalog name matching", () => {
  const products = [
    { id: 1, name: "Notebook", sku: "NOTE-01" },
    { id: 2, name: "Blue Shirt", sku: "SHIRT-BLUE" },
  ];

  it("matches a spoken plural to a singular product", () => {
    expect(findUniqueCatalogMatch("notebooks", products)?.id).toBe(1);
  });

  it("ignores case and punctuation", () => {
    expect(findUniqueCatalogMatch("BLUE-shirt", products)?.id).toBe(2);
  });

  it("does not guess when there is no exact normalized match", () => {
    expect(findUniqueCatalogMatch("shirt", products)).toBeNull();
  });

  it("normalizes common y plurals", () => {
    expect(normalizeCatalogName("batteries")).toBe("battery");
  });
});
