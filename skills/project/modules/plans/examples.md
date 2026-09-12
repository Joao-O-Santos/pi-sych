# Plans examples

## Authorization already covers implementation

Input: “Refactor this subsystem according to the approach we just agreed. Write a
plan first, then implement it and run the tests.”

Output: write the concise plan, use it as the implementation brief, complete the
covered refactor and verification, and report the result. Do not stop after the
plan merely to ask whether to continue.

## A new consequential choice remains

Input: a requested refactor exposes two incompatible public API designs, and the
user has not delegated that choice.

Output: plan the common work, state the API decision and consequences precisely,
and ask for that decision before crossing the boundary. The checkpoint is caused
by the new consequential choice, not by the number of files.
