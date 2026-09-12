# Workflow

Define the smallest end-to-end path: trigger or invocation, inputs, deterministic
steps, semantic steps, outputs, side effects, verification, and failure recovery.
Prefer an existing command, helper, library, platform facility, or short script
over a new framework. Keep transformations idempotent when practical and make
reruns safe or explicitly state why they are not.

Put semantic model work at narrow boundaries. Do not send a whole dataset,
mailbox, repository, or document collection through the model when deterministic
selection or transformation can reduce it first. Conversely, do not force shell
or regex rules onto a genuinely semantic classification merely to avoid a model.

Separate inspection from consequential action. Respect explicit approval rules
for sending, publishing, deleting, purchasing, changing remote state, or other
external effects. Capture useful errors and make partial completion visible; do
not report an automation as working until the relevant path was actually tested
or the untested boundary is stated.
