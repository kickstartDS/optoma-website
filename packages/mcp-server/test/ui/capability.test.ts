/**
 * Tests for the ext-apps capability detection module.
 *
 * @see src/ui/capability.ts
 */

import { jest } from "@jest/globals";

// Mock the ext-apps server module so we control getUiCapability's return
const mockGetUiCapability = jest.fn();
jest.unstable_mockModule("@modelcontextprotocol/ext-apps/server", () => ({
  getUiCapability: mockGetUiCapability,
  RESOURCE_MIME_TYPE: "text/html;profile=mcp-app",
}));

// Dynamic imports must come AFTER jest.unstable_mockModule
const {
  clientSupportsExtApps,
  SECTION_PREVIEW_URI,
  PAGE_PREVIEW_URI,
  PLAN_REVIEW_URI,
  UI_URI_PREFIX,
} = await import("../../src/ui/capability.js");

// ── URI constants ──────────────────────────────────────────────────

describe("UI URI constants", () => {
  it("uses the correct URI prefix", () => {
    expect(UI_URI_PREFIX).toBe("ui://kds");
  });

  it("has correct section preview URI", () => {
    expect(SECTION_PREVIEW_URI).toBe("ui://kds/section-preview");
  });

  it("has correct page preview URI", () => {
    expect(PAGE_PREVIEW_URI).toBe("ui://kds/page-preview");
  });

  it("has correct plan review URI", () => {
    expect(PLAN_REVIEW_URI).toBe("ui://kds/plan-review");
  });

  it("all preview URIs start with the prefix", () => {
    expect(SECTION_PREVIEW_URI).toMatch(/^ui:\/\/kds\//);
    expect(PAGE_PREVIEW_URI).toMatch(/^ui:\/\/kds\//);
    expect(PLAN_REVIEW_URI).toMatch(/^ui:\/\/kds\//);
  });
});

// ── Capability detection ───────────────────────────────────────────

describe("clientSupportsExtApps", () => {
  beforeEach(() => {
    mockGetUiCapability.mockReset();
  });

  it("returns false when getUiCapability returns undefined", () => {
    mockGetUiCapability.mockReturnValue(undefined);
    const mockServer = {
      getClientCapabilities: () => ({}),
    } as any;

    expect(clientSupportsExtApps(mockServer)).toBe(false);
  });

  it("returns false when getUiCapability returns empty object", () => {
    mockGetUiCapability.mockReturnValue({});
    const mockServer = {
      getClientCapabilities: () => ({}),
    } as any;

    expect(clientSupportsExtApps(mockServer)).toBe(false);
  });

  it("returns false when getClientCapabilities throws", () => {
    const mockServer = {
      getClientCapabilities: () => {
        throw new Error("Not initialized");
      },
    } as any;

    expect(clientSupportsExtApps(mockServer)).toBe(false);
  });

  it("returns true when getUiCapability returns matching MIME type", () => {
    mockGetUiCapability.mockReturnValue({
      mimeTypes: ["text/html;profile=mcp-app"],
    });
    const mockServer = {
      getClientCapabilities: () => ({ experimental: {} }),
    } as any;

    expect(clientSupportsExtApps(mockServer)).toBe(true);
  });

  it("returns false when MIME types list does not include ext-apps type", () => {
    mockGetUiCapability.mockReturnValue({
      mimeTypes: ["text/plain"],
    });
    const mockServer = {
      getClientCapabilities: () => ({ experimental: {} }),
    } as any;

    expect(clientSupportsExtApps(mockServer)).toBe(false);
  });

  it("returns false when mimeTypes is empty array", () => {
    mockGetUiCapability.mockReturnValue({
      mimeTypes: [],
    });
    const mockServer = {
      getClientCapabilities: () => ({}),
    } as any;

    expect(clientSupportsExtApps(mockServer)).toBe(false);
  });
});
