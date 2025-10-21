import { describe, it, createExpect } from "vitest";

const expect = createExpect() as unknown as <T>(actual: T, message?: string) => any;
import { AccountabilityLayer, Actor, withAction } from "../src/index";

const fakeApaai = (status: "approved" | "requires_approval"): AccountabilityLayer => ({
  async createAction() {
    return { actionId: "a_1", status };
  },
  async propose() {
    return { actionId: "a_1", status };
  },
  async submitEvidence() {
    return { verified: true };
  },
  async policy() { return { rules: [] }; },
  async approve() { return { verified: true }; },
  async reject() { return { verified: true }; },
  async getAction() { return {} as any; },
  async listActions() { return []; },
  async getEvidence() { return {} as any; },
  async setPolicy() { return { rules: [] }; },
  get policies() { return { evaluate: async () => ({}), enforce: async () => ({}), set: async () => ({}) }; },
  get human() { return { approve: async () => ({}), reject: async () => ({}) }; },
  get evidence() { return { add: async () => ({}), get: async () => ({}) }; },
  get actions() { return { get: async () => ({}), list: async () => [] }; }
} as any);

const actor: Actor = { kind: "agent", name: "bot" };

describe("withAction", () => {
  it("runs and sends success evidence", async () => {
    const res = await withAction({
      apaai: fakeApaai("approved"),
      type: "send_email",
      actor,
      execute: async () => ({ id: "ok" }),
      evidence: {
        onSuccess: (r) => [{ name: "email_sent", pass: true, note: `id=${(r as any).id}` }],
        onError: () => [{ name: "email_failed", pass: false }]
      }
    });
    expect((res as any).id).toBe("ok");
  });

  it("waits for approval when required", async () => {
    let waited = false;
    await withAction({
      apaai: fakeApaai("requires_approval"),
      type: "send_email",
      actor,
      onApproval: async () => { waited = true; },
      execute: async () => ({}),
      evidence: {
        onSuccess: () => [{ name: "email_sent", pass: true }],
        onError: () => [{ name: "email_failed", pass: false }]
      }
    });
    expect(waited).toBe(true);
  });
});
