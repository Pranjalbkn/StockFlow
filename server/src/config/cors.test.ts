import { describe, expect, it } from "vitest";
import { isAllowedOrigin } from "./cors.js";

describe("isAllowedOrigin", () => {
  const clientUrl = "https://stockflow.example.com";

  it("allows the configured production frontend", () => {
    expect(isAllowedOrigin(clientUrl, clientUrl, true)).toBe(true);
  });

  it("allows localhost ports during development", () => {
    expect(isAllowedOrigin("http://localhost:5174", clientUrl, false)).toBe(true);
  });

  it("rejects an unknown origin in production", () => {
    expect(isAllowedOrigin("https://unknown.example.com", clientUrl, true)).toBe(false);
  });
});
