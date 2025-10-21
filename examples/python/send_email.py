from apaai_client import AccountabilityLayer, AccountabilityLayerOptions
import requests

apaai = AccountabilityLayer(AccountabilityLayerOptions(endpoint="http://localhost:8787"))

# 1) Propose an action
decision = apaai.propose(
    type="send_email",
    actor={"kind": "agent", "name": "mail-bot", "provider": "openai"},
    target="mailto:sarah@acme.com",
    params={"subject": "Pricing", "body": "Hi!"}
)
print("Decision:", decision["status"], decision["checks"])

# 2) (Dev) simulate approval if required
if decision["status"] == "requires_approval":
    requests.post(f"http://localhost:8787/approve/{decision['actionId']}")
    print("Approved:", decision["actionId"])

# 3) Perform your side-effect (fake mailer here)
def send_email(to: str, subject: str, body: str):
    # simulate a send and return metadata
    return {"id": "msg_demo_123", "to": to, "subject": subject}

result = send_email("sarah@acme.com", "Pricing", "Hi!")

# 4) Attach evidence (success)
apaai.evidence(decision["actionId"], [
    {"name": "email_sent", "pass": True, "note": f"id={result['id']}"}
])
print("Evidence submitted.")
