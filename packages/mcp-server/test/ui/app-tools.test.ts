/**
 * Tests for ext-apps app-only tool registration.
 *
 * Verifies that `registerAppOnlyTools` registers all 5 app-only tools
 * with correct names, schemas, and response formats.
 *
 * @see src/ui/app-tools.ts
 */

import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// Track calls to registerAppTool
const mockRegisterAppTool = jest.fn();

jest.unstable_mockModule("@modelcontextprotocol/ext-apps/server", () => ({
  registerAppTool: mockRegisterAppTool,
  registerAppResource: jest.fn(),
  getUiCapability: jest.fn(),
  RESOURCE_MIME_TYPE: "text/html;profile=mcp-app",
}));

// Dynamic import AFTER mock setup
const { registerAppOnlyTools } = await import("../../src/ui/app-tools.js");

describe("registerAppOnlyTools", () => {
  beforeEach(() => {
    mockRegisterAppTool.mockClear();
  });

  it("registers exactly 5 app-only tools", () => {
    const mockServer = {} as any;
    registerAppOnlyTools(mockServer);
    expect(mockRegisterAppTool).toHaveBeenCalledTimes(5);
  });

  it("registers the expected tool names", () => {
    const mockServer = {} as any;
    registerAppOnlyTools(mockServer);

    const toolNames = mockRegisterAppTool.mock.calls.map(
      (call: any[]) => call[1]
    );
    expect(toolNames).toContain("approve_section");
    expect(toolNames).toContain("reject_section");
    expect(toolNames).toContain("modify_section");
    expect(toolNames).toContain("approve_plan");
    expect(toolNames).toContain("reorder_plan");
  });

  it("passes the McpServer instance to each registration", () => {
    const mockServer = { name: "test-server" } as any;
    registerAppOnlyTools(mockServer);

    mockRegisterAppTool.mock.calls.forEach((call: any[]) => {
      expect(call[0]).toBe(mockServer);
    });
  });

  it("each tool has a title and description", () => {
    const mockServer = {} as any;
    registerAppOnlyTools(mockServer);

    mockRegisterAppTool.mock.calls.forEach((call: any[]) => {
      const options = call[2]; // 3rd argument is the options object
      expect(options).toHaveProperty("title");
      expect(options).toHaveProperty("description");
      expect(typeof options.title).toBe("string");
      expect(typeof options.description).toBe("string");
    });
  });

  it("each tool has app visibility meta", () => {
    const mockServer = {} as any;
    registerAppOnlyTools(mockServer);

    mockRegisterAppTool.mock.calls.forEach((call: any[]) => {
      const options = call[2];
      expect(options._meta?.ui?.visibility).toEqual(["app"]);
    });
  });

  describe("tool handlers", () => {
    it("approve_section returns approved action with section data", async () => {
      const mockServer = {} as any;
      registerAppOnlyTools(mockServer);

      const approveCall = mockRegisterAppTool.mock.calls.find(
        (call: any[]) => call[1] === "approve_section"
      );
      const handler = approveCall![approveCall!.length - 1];
      const section = { component: "hero", headline: "Test" };
      const result = await handler({ section });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.action).toBe("approved");
      expect(parsed.section).toEqual(section);
    });

    it("reject_section returns rejected action with reason", async () => {
      const mockServer = {} as any;
      registerAppOnlyTools(mockServer);

      const rejectCall = mockRegisterAppTool.mock.calls.find(
        (call: any[]) => call[1] === "reject_section"
      );
      const handler = rejectCall![rejectCall!.length - 1];
      const result = await handler({ reason: "Too generic" });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.action).toBe("rejected");
      expect(parsed.reason).toBe("Too generic");
    });

    it("reject_section uses default reason when none provided", async () => {
      const mockServer = {} as any;
      registerAppOnlyTools(mockServer);

      const rejectCall = mockRegisterAppTool.mock.calls.find(
        (call: any[]) => call[1] === "reject_section"
      );
      const handler = rejectCall![rejectCall!.length - 1];
      const result = await handler({});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.action).toBe("rejected");
      expect(typeof parsed.reason).toBe("string");
    });

    it("modify_section returns modify action with section data", async () => {
      const mockServer = {} as any;
      registerAppOnlyTools(mockServer);

      const modifyCall = mockRegisterAppTool.mock.calls.find(
        (call: any[]) => call[1] === "modify_section"
      );
      const handler = modifyCall![modifyCall!.length - 1];
      const section = { component: "faq" };
      const result = await handler({ section });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.action).toBe("modify");
      expect(parsed.section).toEqual(section);
    });

    it("approve_plan returns plan_approved with order", async () => {
      const mockServer = {} as any;
      registerAppOnlyTools(mockServer);

      const approveCall = mockRegisterAppTool.mock.calls.find(
        (call: any[]) => call[1] === "approve_plan"
      );
      const handler = approveCall![approveCall!.length - 1];
      const order = ["hero", "features", "cta"];
      const result = await handler({ order });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.action).toBe("plan_approved");
      expect(parsed.order).toEqual(order);
    });

    it("reorder_plan returns plan_reordered with new order", async () => {
      const mockServer = {} as any;
      registerAppOnlyTools(mockServer);

      const reorderCall = mockRegisterAppTool.mock.calls.find(
        (call: any[]) => call[1] === "reorder_plan"
      );
      const handler = reorderCall![reorderCall!.length - 1];
      const order = ["cta", "hero", "features"];
      const result = await handler({ order });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.action).toBe("plan_reordered");
      expect(parsed.order).toEqual(order);
    });
  });
});
