import { AccountabilityLayer, withAction } from "apaai-ts-sdk";
import { sendEmail } from "./lib/mailer.mjs";

const apaai = new AccountabilityLayer({ endpoint: "http://localhost:8787" });

await withAction({
  apaai,
  type: "send_email",
  actor: { kind: "agent", name: "mail-bot", provider: "openai" },
  target: "mailto:sarah@acme.com",
  params: { subject: "Pricing", body: "Hi!" },

  onApproval: async ({ actionId }) => {
    // Dev helper route; in prod you'd wait for Slack, etc.
    await fetch(`http://localhost:8787/approve/${actionId}`, { method: "POST" });
    console.log("Approved:", actionId);
  },

  evidence: {
    onSuccess: (res) => [{ name: "email_sent", pass: true, note: `msgId=${res.id}` }],
    onError:  (err) => [{ name: "email_failed", pass: false, note: String(err?.message ?? err) }]
  },

  execute: async () => {
    return sendEmail({
      to: "sarah@acme.com",
      subject: "Pricing",
      body: "Hi!"
    });
  }
});

console.log("Done.");
