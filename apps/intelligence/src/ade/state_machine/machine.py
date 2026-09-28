# apps/intelligence/src/ade/state_machine/machine.py
from src.ade.enums import DecisionStatus


class IllegalStateTransitionError(Exception):
  pass


class DecisionStateMachine:
  """Strict state transition rules for ADE decisions (Section 26)."""

  VALID_TRANSITIONS = {
      DecisionStatus.PROPOSED: {
          DecisionStatus.VALIDATED,
          DecisionStatus.INVALIDATED,
          DecisionStatus.CANCELLED,
      },
      DecisionStatus.VALIDATED: {
          DecisionStatus.APPROVAL_PENDING,
          DecisionStatus.DISPATCHED,
          DecisionStatus.INVALIDATED,
          DecisionStatus.CANCELLED,
      },
      DecisionStatus.APPROVAL_PENDING: {
          DecisionStatus.APPROVED,
          DecisionStatus.REJECTED,
          DecisionStatus.EXPIRED,
          DecisionStatus.CANCELLED,
          DecisionStatus.INVALIDATED,
      },
      DecisionStatus.APPROVED: {
          DecisionStatus.DISPATCHED,
          DecisionStatus.CANCELLED,
          DecisionStatus.INVALIDATED,
      },
      DecisionStatus.DISPATCHED: {
          DecisionStatus.EXECUTING,
          DecisionStatus.FAILED,
          DecisionStatus.INVALIDATED,
      },
      DecisionStatus.EXECUTING: {
          DecisionStatus.COMPLETED,
          DecisionStatus.PARTIAL_SUCCESS,
          DecisionStatus.FAILED,
          DecisionStatus.TIMEOUT,
          DecisionStatus.EXPIRED,
          DecisionStatus.INVALIDATED,
      },
      # Terminal states
      DecisionStatus.COMPLETED: set(),
      DecisionStatus.PARTIAL_SUCCESS: set(),
      DecisionStatus.FAILED: set(),
      DecisionStatus.TIMEOUT: set(),
      DecisionStatus.EXPIRED: set(),
      DecisionStatus.REJECTED: set(),
      DecisionStatus.INVALIDATED: set(),
      DecisionStatus.CANCELLED: set(),
  }

  @classmethod
  def assert_transition(
      cls, from_status: DecisionStatus, to_status: DecisionStatus
  ):
    allowed = cls.VALID_TRANSITIONS.get(from_status, set())
    if to_status not in allowed:
      raise IllegalStateTransitionError(
          f"Illegal ADE decision transition: '{from_status.value}' ->"
          f" '{to_status.value}'. Allowed: {[s.value for s in allowed]}"
      )