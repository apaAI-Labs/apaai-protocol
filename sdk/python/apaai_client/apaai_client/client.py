from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Dict, Optional, List
import uuid

from .api import ApaaiAPI
from .utils import to_jsonable, normalize_checks
from .types import Actor

class AccountabilityLayer:
    def __init__(self, endpoint: Optional[str] = None, api_key: Optional[str] = None):
        self.api = ApaaiAPI(endpoint, api_key)

    def _now_iso(self) -> str:
        return datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z")

    def propose(
        self,
        *,
        type: str,
        actor: Actor | Dict[str, Any],
        target: Optional[str] = None,
        params: Optional[Dict[str, Any]] = None,
        id: Optional[str] = None,
        timestamp: Optional[str] = None,
    ) -> Dict[str, Any]:
        action: Dict[str, Any] = {
            "id": id or str(uuid.uuid4()),
            "timestamp": timestamp or self._now_iso(),
            "type": type,
            "actor": to_jsonable(actor),
        }
        if target:
            action["target"] = target
        if params:
            action["params"] = to_jsonable(params)

        return self.api.create_action(action)

    def evidence(self, action_id: str, checks: Any) -> Dict[str, Any]:
        payload = {
            "actionId": action_id,
            "checks": normalize_checks(list(checks)),
        }
        return self.api.submit_evidence(payload)

    def policy(self, action_type: Optional[str] = None) -> Dict[str, Any]:
        return self.api.get_policy(action_type)

    @property
    def policies(self):
        """Policy management interface."""
        return PolicyManager(self)

    @property
    def human(self):
        """Human-in-the-loop interface."""
        return HumanManager(self)

    @property
    def evidence(self):
        """Evidence management interface."""
        return EvidenceManager(self)

    @property
    def actions(self):
        """Action management interface."""
        return ActionManager(self)


class PolicyManager:
    def __init__(self, client: AccountabilityLayer):
        self.client = client

    def evaluate(self, action_id: str) -> Dict[str, Any]:
        """Evaluate policy for an action."""
        action = self.client.api.get_action(action_id)
        policy = self.client.policy(action["type"])
        return {"status": action["status"], "checks": action.get("checks", [])}

    def enforce(self, action_type: str) -> Dict[str, Any]:
        """Enforce policy for an action type."""
        return self.client.policy(action_type)

    def set(self, policy: Dict[str, Any]) -> Dict[str, Any]:
        """Set a policy."""
        return self.client.api.set_policy(policy)


class HumanManager:
    def __init__(self, client: AccountabilityLayer):
        self.client = client

    def approve(self, action_id: str, approver: Optional[str] = None) -> Dict[str, Any]:
        """Approve an action."""
        return self.client.api.approve_action(action_id, approver)

    def reject(self, action_id: str, reason: Optional[str] = None) -> Dict[str, Any]:
        """Reject an action."""
        return self.client.api.reject_action(action_id, reason)


class EvidenceManager:
    def __init__(self, client: AccountabilityLayer):
        self.client = client

    def add(self, action_id: str, checks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Add evidence for an action."""
        return self.client.evidence(action_id, checks)

    def get(self, action_id: str) -> Dict[str, Any]:
        """Get evidence for an action."""
        return self.client.api.get_evidence(action_id)


class ActionManager:
    def __init__(self, client: AccountabilityLayer):
        self.client = client

    def get(self, action_id: str) -> Dict[str, Any]:
        """Get an action by ID."""
        return self.client.api.get_action(action_id)

    def list(self, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """List actions with optional filters."""
        return self.client.api.list_actions(filters)


# Legacy compatibility
ApaaiClient = AccountabilityLayer
TraceClient = AccountabilityLayer
