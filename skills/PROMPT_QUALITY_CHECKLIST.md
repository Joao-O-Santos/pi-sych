# Prompt-quality checklist

Review every model-facing prompt before accepting it.

- Remove redundant instructions and duplicated built-in tool guidance.
- Replace vague quality adjectives with observable decisions or output properties.
- Detect and repair missing precedence, missing output contract, and missing-information fallback; state authority and stopping condition when each applies.
- Remove unsupported claims of authority and sycophantic framing.
- Reject overengineering pressure, speculative workflow, and generic-best-practice overrides of accepted project intent.
- Reject simplistic style rules, especially mechanical active-voice conversion, and generic LLM prose patterns.
- Check excessive token cost, contradictions between supervisor, worker, and skill prompts, and rules duplicated across layers.
- Require claims to distinguish observation, inference, assumption, accepted decision, unresolved question, and tentative proposal where material.
- Require reports to name only checks actually run; inspection is not verification or approval.
- Test decision rules with behavioral fixtures. Fixtures specify required and prohibited output properties, not a claimed model execution or an exact prompt snapshot.
